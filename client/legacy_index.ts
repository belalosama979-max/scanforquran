import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Student to sheet name mapping
const STUDENT_SHEETS: Record<string, string> = {
  "أحمد صبحا": "أحمد صبحا",
  "أُبَيّ العنبوسي": "أُبَيّ العنبوسي",
  "عمر الرجوب": "عمر الرجوب",
  "صالح العكش": "صالح العكش",
  "محمد المناصير": "محمد المناصير",
  "محمود الناصر": "محمود الناصر",
  "زيد صافي": "زيد صافي",
  "ليث العبداللات": "ليث العبداللات",
  "عبدالرحمن توتنجي": "عبدالرحمن توتنجي",
};

const SHEET_COLUMNS = [
  "المطلوب",
  "اليوم", 
  "التاريخ المتوقع",
  "تاريخ التسميع",
  "التقدير",
  "الاستماع للشيخ",
  "التسميع لطالب آخر",
  "ملاحظات"
];

async function getGoogleAuthToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
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

async function getSheetData(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  limit: number = 10
): Promise<string[][]> {
  const range = encodeURIComponent(`'${sheetName}'!A:H`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?majorDimension=ROWS`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google Sheets API error:", errorText);
    throw new Error(`Failed to read sheet: ${response.status}`);
  }
  
  const data = await response.json();
  const values = data.values || [];
  
  // Skip header row and get last N records
  if (values.length <= 1) {
    return [];
  }
  
  const records = values.slice(1); // Remove header
  const lastRecords = records.slice(-limit); // Get last N records
  
  return lastRecords;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentName, limit = 5 } = await req.json();

    if (!studentName) {
      return new Response(
        JSON.stringify({ error: "يرجى تحديد اسم الطالب" }),
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

    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountJson) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured");
    }

    const spreadsheetId = "1256TCTbmYhp4ksmnxiPt49AqUQLtSXo4FB7OYiLwgKc";
    const accessToken = await getGoogleAuthToken(serviceAccountJson);
    const records = await getSheetData(accessToken, spreadsheetId, sheetName, limit);

    return new Response(
      JSON.stringify({
        success: true,
        studentName,
        records,
        columns: SHEET_COLUMNS,
        totalRecords: records.length,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching records:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
