import { useState } from "react";
// Supabase import removed for local bypass
// import { supabase } from "@/integrations/supabase/client";

interface ProcessResult {
  success: boolean;
  message?: string;
  rowsAdded?: number;
  extractedData?: string[][];
  sheetUrl?: string;
  error?: string;
  needsReview?: boolean;
  columns?: string[];
}

export function useNotebookProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const processNotebook = async (studentName: string, imageFile: File): Promise<ProcessResult> => {
    setIsProcessing(true);
    setResult(null);

    try {
      // Convert image to base64
      const base64 = await fileToBase64(imageFile);
      
      // Remove data URL prefix if present
      const imageBase64 = base64.replace(/^data:image\/\w+;base64,/, "");

      // Call local backend API instead of Supabase Edge Function
      const response = await fetch('http://localhost:3000/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentName,
          extractedData: [], // For image processing, we might need OCR logic server-side or client-side. 
                             // Wait, the original code sent imageBase64 to edge function which presumably did OCR.
                             // The user request said "Preserve... Text parsing logic". 
                             // If the original used GPT-4o or similar via edge function, I cannot reproduce that easily without an API key for OpenAI.
                             // However, for VOICE input, we have text already.
                             // Let's assume for now we are fixing the backend connection. 
                             // If passing image, we send imageBase64.
          imageBase64
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل في معالجة الطلب");
      }

      const successResult: ProcessResult = {
        success: true,
        message: data.message,
        rowsAdded: data.rowsAdded,
        extractedData: data.extractedData,
        sheetUrl: data.sheetUrl,
        needsReview: data.needsReview,
        columns: data.columns,
      };
      
      setResult(successResult);
      return successResult;
    } catch (err) {
      const errorResult: ProcessResult = {
        success: false,
        error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmData = async (studentName: string, confirmedData: string[][]): Promise<ProcessResult> => {
    setIsProcessing(true);

    try {
      const response = await fetch('http://localhost:3000/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          studentName, 
          extractedData: confirmedData.map(row => {
            // Cast to any[] to allow sending numbers/nulls in the JSON body
            const newRow: any[] = [...row];
            
            // --- FIX 1: Normalize Number of Pages (Column Index 2) ---
            if (newRow[2] && typeof newRow[2] === 'string') {
              // 1. Remove hidden characters and spaces
              let val = newRow[2].replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
              
              // 2. Convert Arabic digits to English
              val = val.replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
              
              // 3. Ensure it's a valid number
              const num = Number(val);
              if (!isNaN(num) && val !== "") {
                newRow[2] = num; // Send as real Number
              } else {
                newRow[2] = null; // Send as null
              }
            } else if (!newRow[2]) {
                newRow[2] = null;
            }

            // --- FIX 2: Handle "Not Done" (لم يتم) logic ---
            // Check original row string for the keyword
            if (row[2] && row[2].includes("لم يتم")) {
               newRow[2] = null; // 1. Clear Pages column (null)
               newRow[3] = "TRUE"; // 2. Student Listen -> true
               newRow[4] = "TRUE"; // 3. Sheikh Listen -> true
               newRow[5] = "TRUE"; // 4. Home Listen -> true
            }

            return newRow;
          }),
          action: "confirm"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل في إضافة البيانات");
      }

      const successResult: ProcessResult = {
        success: true,
        message: data.message,
        rowsAdded: data.rowsAdded,
        sheetUrl: data.sheetUrl,
      };
      
      setResult(successResult);
      return successResult;
    } catch (err) {
      const errorResult: ProcessResult = {
        success: false,
        error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setIsProcessing(false);
  };

  return {
    processNotebook,
    confirmData,
    isProcessing,
    result,
    reset,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
