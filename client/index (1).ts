import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Full sheet columns (11 columns A-K)
const ALL_SHEET_COLUMNS = [
  "الخطة",       // A
  "اليوم",        // B (pre-filled)
  "التاريخ",      // C (pre-filled)
  "تاريخ التسميع الفعلي", // D
  "عدد الصفحات",  // E
  "التسميع عند طالب", // F (checkbox)
  "الاستماع لشيخ", // G (checkbox)
  "التسميع المنزلي", // H (checkbox)
  "الأخطاء",      // I
  "التقدير",       // J (dropdown)
  "ملاحظات",      // K
];

// Voice-input columns (what user fills - skipping اليوم and التاريخ)
const VOICE_COLUMNS = [
  "الخطة",
  "تاريخ التسميع الفعلي",
  "عدد الصفحات",
  "التسميع عند طالب",
  "الاستماع لشيخ",
  "التسميع المنزلي",
  "الأخطاء",
  "التقدير",
  "ملاحظات",
];

// Mapping: voice column index → sheet column letter
const VOICE_TO_SHEET_COL: Record<number, string> = {
  0: "A",  // الخطة
  1: "D",  // تاريخ التسميع الفعلي
  2: "E",  // عدد الصفحات
  3: "F",  // التسميع عند طالب
  4: "G",  // الاستماع لشيخ
  5: "H",  // التسميع المنزلي
  6: "I",  // الأخطاء
  7: "J",  // التقدير
  8: "K",  // ملاحظات
};

// Student tab names (must match exactly the Google Sheets tab names)
const STUDENT_SHEETS: Record<string, string> = {
  "أحمد صبحا": "أحمد صبحا",
  "أبي العنبوسي": "أبي العنبوسي",
  "عمر الرجوب": "عمر الرجوب",
  "صالح العكش": "صالح العكش",
  "محمد المناصير": "محمد المناصير",
  "محمود الناصر": "محمود الناصر",
  "زيد صافي": "زيد صافي",
  "ليث العبداللات": "ليث العبداللات",
  "عبد الرحمن التوتنجي": "عبد الرحمن التوتنجي",
  "أسامة الطباخي": "أسامة الطباخي",
};

// New spreadsheet ID
const SPREADSHEET_ID = "1eit-GMIXiHBKfQDJISKtHw-F19IvN9fOBFmCf9DqE_I";

// Google Sheets API helper
async function getGoogleAuthToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsignedToken = `${headerB64}.${claimB64}`;

  const pemContent = sa.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${unsignedToken}.${signatureB64}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

// Get sheet GID by name
async function getSheetGid(
  accessToken: string,
  sheetName: string
): Promise<number> {
  const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties`;
  const metadataRes = await fetch(metadataUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  const metadata = await metadataRes.json();
  const sheet = metadata.sheets?.find((s: any) => s.properties.title === sheetName);
  return sheet?.properties?.sheetId || 0;
}

// Find the first row where column A (الخطة) is empty, starting from row 4
async function findFirstEmptyRow(
  accessToken: string,
  sheetName: string
): Promise<number> {
  const range = encodeURIComponent(`'${sheetName}'!A4:A100`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  const data = await res.json();
  const values = data.values || [];
  
  // Find first empty cell
  for (let i = 0; i < values.length; i++) {
    if (!values[i] || !values[i][0] || values[i][0].toString().trim() === "") {
      return i + 4; // Row 4 is index 0
    }
  }
  
  // If all rows have data, return the next row after the last one
  return values.length + 4;
}

// Update specific cells in existing rows using batchUpdate
async function updateSheetRows(
  accessToken: string,
  sheetName: string,
  rows: string[][],
  startRow: number
): Promise<number> {
  const valueRanges: any[] = [];
  
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const sheetRow = startRow + rowIdx;
    const row = rows[rowIdx];
    
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const value = row[colIdx];
      if (!value && value !== "TRUE" && value !== "FALSE") continue;
      
      const colLetter = VOICE_TO_SHEET_COL[colIdx];
      if (!colLetter) continue;
      
      let cellValue: any = value;
      if (colIdx >= 3 && colIdx <= 5) {
        cellValue = value === "TRUE" ? true : (value === "FALSE" ? false : value);
      }
      if (colIdx === 1 && value && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
        cellValue = `'${value}`;
      }
      
      valueRanges.push({
        range: `'${sheetName}'!${colLetter}${sheetRow}`,
        values: [[cellValue]],
      });
    }
  }
  
  if (valueRanges.length === 0) {
    throw new Error("لا توجد بيانات لإضافتها");
  }
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: valueRanges,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google Sheets API error:", errorText);
    throw new Error(`فشل في تحديث الجدول: ${response.status}`);
  }
  
  await response.json();
  console.log(`Updated ${valueRanges.length} cells across ${rows.length} rows`);
  return await getSheetGid(accessToken, sheetName);
}

// Enhanced OCR using Gemini Vision
async function extractTextFromImage(imageBase64: string, lovableApiKey: string): Promise<{ rows: any[][], hasUnclear: boolean }> {
  const currentYear = new Date().getFullYear();
  
  const prompt = `أنت أفضل خبير عالمي في قراءة الخط العربي المكتوب يدوياً. لديك قدرة خارقة على:
- فهم الخط المشوش وغير الواضح
- تخمين الكلمات من السياق حتى لو كانت الحروف ناقصة
- التعرف على الأنماط المتكررة في دفاتر الحفظ

## المهمة:
استخرج بيانات سجلات الحفظ من جدول في الصورة.

## ⚠️ قاعدة صارمة - تجاهل رؤوس الأعمدة تماماً:
هذه الكلمات هي عناوين أعمدة وليست بيانات، لا تستخرجها أبداً:
- "الخطة" أو "المطلوب"
- "التاريخ" أو "تاريخ التسميع"
- "التقدير"
- "الاستماع لشيخ" 
- "ملاحظات"
- "اليوم"
- أي صف يبدو كعنوان أو رأس جدول

ابدأ من أول صف يحتوي على بيانات فعلية.

## الأعمدة المطلوبة (9 أعمدة بالترتيب - بدون اليوم والتاريخ):
1. الخطة - ما يجب حفظه (مثال: "البقرة ٥-١٠" أو "ص ٣٢")
2. تاريخ التسميع الفعلي - التاريخ الفعلي DD/MM/YYYY
3. عدد الصفحات - رقم فقط
4. التسميع عند طالب - نعم/لا أو TRUE/FALSE
5. الاستماع لشيخ - نعم/لا أو TRUE/FALSE
6. التسميع المنزلي - نعم/لا أو TRUE/FALSE
7. الأخطاء - رقم فقط
8. التقدير - ممتاز، جيد جدا، جيد، مقبول، لم يسمع
9. ملاحظات - أي ملاحظات إضافية

## 📅 قواعد التاريخ المهمة:
- التاريخ يجب أن يكون بصيغة DD/MM/YYYY
- السنة الحالية هي ${currentYear}
- الأرقام العربية: ٠١٢٣٤٥٦٧٨٩ = 0123456789

## 🔍 قواعد قراءة الخط غير الواضح:
- علامة ✓ أو ✔ أو صح = "TRUE"
- علامة ✗ أو X = "FALSE"
- خلية فارغة = ""
- فقط إذا كان مستحيل القراءة = "[غير واضح]"

## صيغة الإخراج JSON:
{
  "rows": [
    ["الخطة", "تاريخ التسميع", "عدد الصفحات", "التسميع عند طالب", "الاستماع لشيخ", "التسميع المنزلي", "الأخطاء", "التقدير", "ملاحظات"],
    ...
  ],
  "hasUnclear": false
}

أعد JSON فقط بدون أي نص إضافي.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI Gateway error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً");
    }
    if (response.status === 402) {
      throw new Error("يرجى إضافة رصيد للاستمرار");
    }
    throw new Error("فشل في تحليل الصورة");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  console.log("AI Response:", content);

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        rows: parsed.rows || [],
        hasUnclear: parsed.hasUnclear || false
      };
    }
    
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0]);
      const hasUnclear = parsed.some((row: string[]) => 
        row.some((cell: string) => cell.includes("[غير واضح]") || cell.endsWith("?"))
      );
      return { rows: parsed, hasUnclear };
    }
    
    throw new Error("No valid JSON found in response");
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    throw new Error("فشل في تحليل البيانات المستخرجة من الصورة");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentName, imageBase64, confirmedData, action } = await req.json();

    // If this is a confirmation request, update sheet rows
    if (action === "confirm" && confirmedData) {
      const sheetName = STUDENT_SHEETS[studentName];
      if (!sheetName) {
        return new Response(
          JSON.stringify({ error: "الطالب غير موجود في القائمة" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
      if (!serviceAccountJson) {
        throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured");
      }

      const accessToken = await getGoogleAuthToken(serviceAccountJson);
      
      // Find first empty row
      const startRow = await findFirstEmptyRow(accessToken, sheetName);
      console.log(`Found first empty row at: ${startRow} for student: ${sheetName}`);
      
      const sheetGid = await updateSheetRows(accessToken, sheetName, confirmedData, startRow);

      return new Response(
        JSON.stringify({
          success: true,
          message: `تم إضافة ${confirmedData.length} سجل(ات) بنجاح`,
          rowsAdded: confirmedData.length,
          sheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=${sheetGid}`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normal extraction flow
    if (!studentName || !imageBase64) {
      return new Response(
        JSON.stringify({ error: "يرجى تحديد اسم الطالب والصورة" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sheetName = STUDENT_SHEETS[studentName];
    if (!sheetName) {
      return new Response(
        JSON.stringify({ error: "الطالب غير موجود في القائمة" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountJson) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured");
    }

    console.log(`Processing notebook for student: ${studentName}`);

    const { rows: extractedRows, hasUnclear } = await extractTextFromImage(imageBase64, lovableApiKey);
    
    if (!extractedRows || extractedRows.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "لم يتم العثور على بيانات في الصورة",
          details: "يرجى التأكد من وضوح الصورة وأن الجدول واضح"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Extracted ${extractedRows.length} rows from image, hasUnclear: ${hasUnclear}`);

    if (hasUnclear) {
      return new Response(
        JSON.stringify({
          success: true,
          needsReview: true,
          message: "يوجد بعض الخلايا غير الواضحة، يرجى مراجعتها",
          extractedData: extractedRows,
          columns: VOICE_COLUMNS,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getGoogleAuthToken(serviceAccountJson);
    const startRow = await findFirstEmptyRow(accessToken, sheetName);
    const sheetGid = await updateSheetRows(accessToken, sheetName, extractedRows, startRow);

    console.log(`Successfully updated ${extractedRows.length} rows in sheet: ${sheetName} starting at row ${startRow}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `تم إضافة ${extractedRows.length} سجل(ات) بنجاح`,
        rowsAdded: extractedRows.length,
        extractedData: extractedRows,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=${sheetGid}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing notebook:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
