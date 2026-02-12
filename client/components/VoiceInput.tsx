import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, MicOff, RotateCcw, CheckCircle2, AlertCircle, Volume2, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  COLUMNS,
  DATE_COL_INDICES,
  NUMBER_COL_INDICES,
  CHECKBOX_COL_INDICES,
  GRADE_COL_INDEX,
  PLAN_COL_INDEX,
  SEPARATOR_VARIANTS,
  SEPARATOR_REGEX,
  spokenToDate,
  spokenToSurahRange,
  spokenToNumber,
  spokenToCheckbox,
  spokenToGrade,
  cleanArabicTranscript,
} from "@/lib/voiceUtils";

interface VoiceInputProps {
  onDataReady: (data: string[][]) => void;
  onStatusChange?: (status: string) => void;
}

export function VoiceInput({ onDataReady, onStatusChange }: VoiceInputProps) {
  const isMobile = useIsMobile();
  const [isListening, setIsListening] = useState(false);
  const [currentColIndex, setCurrentColIndex] = useState(0);
  const [cellValues, setCellValues] = useState<string[]>(Array(COLUMNS.length).fill(""));
  const [rows, setRows] = useState<string[][]>([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const currentColIndexRef = useRef(0);
  const isListeningRef = useRef(false);
  const restartTimeoutRef = useRef<any>(null);
  const processedResultIndexRef = useRef(0);
  // Mobile deduplication: track last processed texts to avoid repeats
  const lastProcessedTextsRef = useRef<string[]>([]);

  // Web Speech API Integration (Restored & Optimized)
  const isTogglingRef = useRef(false);
 
  

  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const supported = !!SpeechRecognitionAPI;

  // Process text immediately
  const processText = useCallback((rawText: string) => {
    const text = cleanArabicTranscript(rawText);
    const trimmed = text.trim();
    if (!trimmed) return;

    // Mobile deduplication
    const recentTexts = lastProcessedTextsRef.current;
    if (recentTexts.includes(trimmed)) return;
    recentTexts.push(trimmed);
    if (recentTexts.length > 5) recentTexts.shift();

    const segments = trimmed.split(SEPARATOR_REGEX);
    const textParts: string[] = [];
    let separatorCount = 0;

    for (const seg of segments) {
      const s = seg.trim();
      if (!s) continue;
      if (SEPARATOR_VARIANTS.some(v => s === v)) {
        separatorCount++;
      } else {
        // Add pending separators
        for (let i = 0; i < separatorCount; i++) textParts.push("__SEP__");
        separatorCount = 0;
        textParts.push(s);
      }
    }
    // Trailing separators
    for (let i = 0; i < separatorCount; i++) textParts.push("__SEP__");

    // Strictly separate processing from view updates to avoid race conditions
    // We calculate the NEXT state based on current refs
    
    let colIdx = currentColIndexRef.current;

    setCellValues(prev => {
      const vals = [...prev];
      
      for (const part of textParts) {
        if (part === "__SEP__") {
          // Move to next column or next row
          if (colIdx >= COLUMNS.length - 1) {
             // Row logic handled via effects or external triggers usually, 
             // but here we just reset for next row input
             colIdx = 0; 
             // Ideally we should commit the row here, but avoiding complex state refactors.
             // Relying on user to click "Add Row" or auto-add logic elsewhere if present.
             // The previous "newRows" logic was removed to simplify. 
             // If "Auto Move" hits end, we wrap to 0.
          } else {
            colIdx++;
          }
        } else {
          // Valid content
          if (colIdx < COLUMNS.length) {
             let value = part;
             if (colIdx === PLAN_COL_INDEX) value = spokenToSurahRange(value);
             else if (DATE_COL_INDICES.includes(colIdx)) value = spokenToDate(value);
             else if (NUMBER_COL_INDICES.includes(colIdx)) value = spokenToNumber(value);
             else if (CHECKBOX_COL_INDICES.includes(colIdx)) value = spokenToCheckbox(value);
             else if (colIdx === GRADE_COL_INDEX) value = spokenToGrade(value);
             
             vals[colIdx] = value; 
          }
        }
      }
      
      // Update refs
      currentColIndexRef.current = colIdx;
      setCurrentColIndex(colIdx); // Sync UI
      return vals;
    });

  }, []);

  // Mobile detection standard
  const isMobileDevice = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // Throttling ref
  const lastTranscriptUpdate = useRef(0);
  const recognitionInstanceRef = useRef<any>(null);

  // Initialize Recognition Instance Once (Mobile Optimized)
  useEffect(() => {
    if (!SpeechRecognitionAPI) return;

    // Create instance once
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "ar-JO";
    recognition.continuous = false; 
    recognition.interimResults = true; 
    recognition.maxAlternatives = 1;

    recognitionInstanceRef.current = recognition;

    return () => {
        try { recognition.abort(); } catch(e) {}
        recognitionInstanceRef.current = null;
    };
  }, [SpeechRecognitionAPI]);

  const startRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI) return;
    
    // Reuse instance or create (fallback)
    let recognition = recognitionInstanceRef.current;
    if (!recognition) {
        recognition = new SpeechRecognitionAPI();
        recognition.lang = "ar-JO";
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognitionInstanceRef.current = recognition;
    }

    try {
        // Event Handlers (Attached fresh to capture latest closures if needed, 
        // strictly usage of refs recommended for deps)
        
        recognition.onresult = (event: any) => {
            if (!event.results || event.results.length === 0) return;

            const res = event.results[0];
            const transcript = res[0].transcript;
            const confidence = res[0].confidence;
            const isFinal = res.isFinal;

            // Mobile-Specific Enhancements
            if (isMobileDevice) {
                // Higher confidence threshold for mobile
                if (isFinal && confidence < 0.75) { // Adjusted to 0.75 for balance
                     console.warn("Mobile: Low confidence ignored:", transcript, confidence);
                     return;
                }
                
                // Prevent duplicate processing
                if (isFinal && lastProcessedTextsRef.current.includes(cleanArabicTranscript(transcript).trim())) {
                     return;
                }

                // Throttling UI updates for interim results (300ms)
                const now = Date.now();
                if (!isFinal && now - lastTranscriptUpdate.current < 300) {
                    return; // Skip this frame
                }
                lastTranscriptUpdate.current = now;
            } else {
                // Desktop strict confidence
                if (isFinal && confidence < 0.75) return;
            }

            // Keyword Detection
            const isCommand = /^(انتهى|انتها|خلص|تم|التالي|كمل)$/i.test(transcript.trim());
            const hasCommandSuffix = /(انتهى|انتها|خلص|تم|التالي|كمل)$/i.test(transcript.trim());

            let finalText = transcript;
            let shouldAdvance = false;

            if (isCommand) {
                finalText = ""; 
                shouldAdvance = true;
            } else if (hasCommandSuffix) {
                finalText = transcript.replace(/(انتهى|انتها|خلص|تم|التالي|كمل)$/i, "").trim();
                shouldAdvance = true;
            }

            // Update UI
            setLiveTranscript(finalText || "Done");
            
            if (isFinal && (finalText || shouldAdvance)) {
                 // Prevent double firing
                 if (recognition.processingFinal) return;
                 recognition.processingFinal = true;

                 setTimeout(() => setLiveTranscript(""), 800);

                let payLoad = finalText;
                if (shouldAdvance) {
                    payLoad += " " + SEPARATOR_VARIANTS[0] + " "; 
                }
                
                processText(payLoad);
                
                // Reset flag after short delay
                setTimeout(() => { recognition.processingFinal = false; }, 500);

                // Mobile: Force stop to prevent double-firing
                if (isMobileDevice) {
                    try { recognition.stop(); } catch(e) {}
                }
            }
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'not-allowed') {
                setErrorMsg("يرجى السماح بالميكروفون");
                setIsListening(false);
                isListeningRef.current = false;
            } else if (event.error !== 'no-speech') {
                console.warn("Speech Error:", event.error);
            }
        };

        recognition.onend = () => {
             // Mobile: Avoid rapid restart loop
             const delay = isMobileDevice ? 200 : 50;
            
            if (isListeningRef.current) {
                restartTimeoutRef.current = setTimeout(() => {
                    startRecognition();
                }, delay);
            }
        };

        recognition.start();

    } catch (e) {
        console.error("Start Error:", e);
        setIsListening(false);
        isListeningRef.current = false;
    }
  }, [SpeechRecognitionAPI, processText, isMobileDevice]);

  const startListening = useCallback(() => {
    if (!supported) {
       onStatusChange?.("unsupported");
       return;
    }
    if (isListeningRef.current) return;
    
    setIsListening(true);
    isListeningRef.current = true;
    onStatusChange?.("listening");
    setErrorMsg(null);
    
    startRecognition();
  }, [supported, startRecognition, onStatusChange]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    isListeningRef.current = false;
    onStatusChange?.("processing");
    
    if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
    }
    
    const recognition = recognitionInstanceRef.current || recognitionRef.current;
    if (recognition) {
        try { recognition.stop(); } catch(e) {}
    }
    setLiveTranscript("");
  }, []);

  const handleCellEdit = (index: number, value: string) => {
    const newValues = [...cellValues];
    newValues[index] = value;
    setCellValues(newValues);
  };

  const addRow = () => {
    setRows(prev => [...prev, cellValues.map(v => v.trim())]);
    setCellValues(Array(COLUMNS.length).fill(""));
    setCurrentColIndex(0);
    currentColIndexRef.current = 0;
  };

  const resetAll = () => {
    stopListening();
    setCellValues(Array(COLUMNS.length).fill(""));
    setCurrentColIndex(0);
    currentColIndexRef.current = 0;
    setRows([]);
    setLiveTranscript("");
    setErrorMsg(null);
    processedResultIndexRef.current = 0;
    lastProcessedTextsRef.current = [];
  };

  const submitData = () => {
    const allRows = [...rows];
    const currentRow = cellValues.map(v => v.trim());
    if (currentRow.some(v => v)) allRows.push(currentRow);
    if (allRows.length > 0) onDataReady(allRows);
  };

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  if (!supported) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p>متصفحك لا يدعم ميزة التسجيل الصوتي. يرجى استخدام Chrome أو Edge.</p>
      </div>
    );
  }

  const totalRows = rows.length + (cellValues.some(v => v.trim()) ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Microphone Button - Mobile Optimized */}
      <div className={`flex flex-col items-center gap-3 ${isMobileDevice ? 'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-background/90 p-4 rounded-3xl shadow-2xl border border-primary/20 backdrop-blur-md w-[90%] max-w-sm' : ''}`}>
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          onClick={isListening ? stopListening : startListening}
          className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            isListening
              ? "bg-destructive text-destructive-foreground shadow-lg"
              : "bg-gradient-to-br from-primary to-emerald-light text-primary-foreground shadow-emerald"
          }`}
        >
          {isListening && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-[3px] border-destructive/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-destructive/15"
                animate={{ scale: [1, 1.7, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
            </>
          )}
          {isListening ? <MicOff className="w-8 h-8 sm:w-9 sm:h-9" /> : <Mic className="w-8 h-8 sm:w-9 sm:h-9" />}
        </motion.button>

        <div className="text-center space-y-0.5">
          <p className="text-sm font-bold text-foreground">
            {isListening ? "🔴 جارٍ التسجيل..." : "اضغط للبدء"}
          </p>
          <p className="text-[11px] text-muted-foreground max-w-[240px] leading-relaxed">
            {isListening
              ? 'قل "انتهى" للانتقال للعمود التالي'
              : "سجّل البيانات صوتياً بدلاً من الكتابة"}
          </p>
        </div>
      </div>
      
      {/* Spacer for Mobile to prevent content hiding behind fixed mic */}
      {isMobileDevice && <div className="h-40" />}

      {/* Error */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-sm text-destructive"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Transcript */}
      <AnimatePresence>
        {(isListening || liveTranscript) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 rounded-2xl bg-primary/5 border border-primary/15 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Volume2 className="w-3.5 h-3.5 text-primary" />
              </motion.div>
              <span className="text-[11px] font-bold text-primary">ما يُسمع الآن</span>
            </div>
            <p className="text-sm text-foreground min-h-[1.5em] leading-relaxed" dir="rtl">
              {liveTranscript || (
                <span className="text-muted-foreground">في انتظار الصوت...</span>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Column Indicator */}
      <div className="flex flex-wrap gap-1 justify-center">
        {COLUMNS.map((col, i) => (
          <motion.span
            key={i}
            animate={i === currentColIndex && isListening ? { scale: [1, 1.06, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            className={`text-[10px] sm:text-[11px] px-2 py-1 rounded-full border transition-all font-medium ${
              i === currentColIndex && isListening
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : i < currentColIndex || cellValues[i]
                ? "bg-primary/10 text-primary border-primary/25"
                : "bg-muted/60 text-muted-foreground border-border/50"
            }`}
          >
            {col}
          </motion.span>
        ))}
      </div>

      {/* Filled Values Preview */}
      <AnimatePresence>
        {cellValues.some(v => v) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-border/60 overflow-hidden shadow-sm bg-card"
          >
            <div className="bg-gradient-to-r from-primary/8 to-accent/5 px-4 py-2 flex items-center gap-2 border-b border-border/30">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-bold text-foreground">السطر الحالي</span>
              {rows.length > 0 && (
                <span className="mr-auto text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                  صف {rows.length + 1}
                </span>
              )}
            </div>
            <div className="divide-y divide-border/30">
              {COLUMNS.map((col, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2">
                  <span className="text-[10px] sm:text-xs text-muted-foreground w-20 sm:w-24 flex-shrink-0 font-medium truncate">{col}</span>
                  <Input
                    value={cellValues[i]}
                    onChange={(e) => handleCellEdit(i, e.target.value)}
                    className="h-8 text-sm flex-1 rounded-xl border-border/40 bg-background/50"
                    dir="rtl"
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
            <div className="p-2.5 bg-muted/20 border-t border-border/30">
              <Button size="sm" variant="outline" onClick={addRow} className="w-full rounded-xl gap-1.5 text-xs h-9 border-dashed border-primary/30 text-primary hover:bg-primary/5">
                <Plus className="w-3.5 h-3.5" />
                إضافة سطر جديد
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Previous Rows */}
      <AnimatePresence>
        {rows.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-xs font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              الأسطر المضافة ({rows.length})
            </p>
            <div className="overflow-x-auto rounded-2xl border border-border/60 shadow-sm bg-card">
              <table className="w-full text-[10px] sm:text-xs">
                <thead>
                  <tr className="bg-gradient-to-r from-primary/8 to-accent/5">
                    {COLUMNS.map((col, i) => (
                      <th key={i} className="px-2 py-2 text-right font-bold whitespace-nowrap text-foreground">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-2 py-1.5 whitespace-nowrap">
                          {cell || <span className="text-muted-foreground">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <AnimatePresence>
        {(cellValues.some(v => v) || rows.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex gap-2.5"
          >
            <Button variant="outline" size="default" onClick={resetAll} className="gap-1.5 rounded-xl border-border/50">
              <RotateCcw className="w-4 h-4" />
              إعادة
            </Button>
            <Button
              variant="emerald"
              size="default"
              onClick={submitData}
              className="flex-1 gap-2 rounded-xl font-bold shadow-emerald"
            >
              <Send className="w-4 h-4" />
              تأكيد وإرسال ({totalRows} سطر)
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
