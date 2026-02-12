import { useState, useEffect } from "react";
import { FileSpreadsheet, AlertCircle, Sparkles, Zap, Shield, Clock, Camera, Mic, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { StudentSelector } from "@/components/StudentSelector";
import { ImageUploader } from "@/components/ImageUploader";
import { VoiceInput } from "@/components/VoiceInput";
import { ProcessingState } from "@/components/ProcessingState";
import { SuccessState } from "@/components/SuccessState";
import { ReviewState } from "@/components/ReviewState";
import { StudentRecordsPreview } from "@/components/StudentRecordsPreview";
import { toast } from "@/hooks/use-toast";
import { useNotebookProcessor } from "@/hooks/useNotebookProcessor";
import { motion, AnimatePresence } from "framer-motion";

type AppState = "idle" | "processing" | "review" | "success" | "error";
type InputMode = "image" | "voice";

export function MainApp() {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("image");
  const [appState, setAppState] = useState<AppState>("idle");
  const [resultData, setResultData] = useState<{
    rowsAdded?: number;
    sheetUrl?: string;
    extractedData?: string[][];
    columns?: string[];
  }>({});
  
  // --- ADDED: System Status Logic ---
  const [systemStatus, setSystemStatus] = useState("");

  const setStatus = (state: string) => {
    const messages: Record<string, string> = {
      listening: "🎤 جاري الاستماع...",
      processing: "🧠 جاري تحليل الصوت...",
      sending: "📤 جاري إرسال البيانات...",
      success: "✅ تم الحفظ بنجاح",
      error: "❌ حدث خطأ، حاول مرة أخرى",
    };
    setSystemStatus(messages[state] || "");
    
    // Clear success/error after 3 seconds
    if (state === "success" || state === "error") {
      setTimeout(() => setSystemStatus(""), 3000);
    }
  };
  // ----------------------------------

  // Check Backend Health on Mount
  useEffect(() => {
    console.log("Checking backend health...");
    fetch("https://scanforquran-1.onrender.com/health")
      .then(res => {
        if (!res.ok) throw new Error("Health check failed: " + res.status);
        console.log("Backend is Healthy ✅");
      })
      .catch(err => {
        console.error("🚨 Backend Connection Failed:", err);
      });
  }, []);

  const { processNotebook, confirmData, isProcessing } = useNotebookProcessor();

  const canProcess = selectedStudent && uploadedImage && inputMode === "image";

  const handleProcess = async () => {
    if (!canProcess || !uploadedImage) return;

    setAppState("processing");
    setStatus("processing"); // Status call

    try {
      const result = await processNotebook(selectedStudent, uploadedImage);
      
      if (result.success) {
        if (result.needsReview) {
          setResultData({
            extractedData: result.extractedData,
            columns: result.columns,
          });
          setAppState("review");
          setStatus(""); // Clear processing status
          toast({
            title: "مراجعة مطلوبة",
            description: "يوجد بعض الخلايا غير الواضحة، يرجى مراجعتها",
          });
        } else {
          setResultData({
            rowsAdded: result.rowsAdded,
            sheetUrl: result.sheetUrl,
          });
          setAppState("success");
          setStatus("success"); // Status call
          toast({
            title: "تم التحويل بنجاح",
            description: `تم إضافة ${result.rowsAdded} سجل(ات) للطالب ${selectedStudent}`,
          });
        }
      } else {
        setAppState("error");
        setStatus("error"); // Status call
        toast({
          title: "حدث خطأ",
          description: result.error || "فشل في معالجة الصورة",
          variant: "destructive",
        });
        setTimeout(() => setAppState("idle"), 100);
      }
    } catch (error) {
      setAppState("error");
      setStatus("error"); // Status call
      toast({
        title: "حدث خطأ",
        description: error instanceof Error ? error.message : "فشل في معالجة الصورة",
        variant: "destructive",
      });
      setTimeout(() => setAppState("idle"), 100);
    }
  };

  const handleConfirmReview = async (confirmedData: string[][]) => {
    setAppState("processing");
    setStatus("sending"); // Status call
    
    try {
      const result = await confirmData(selectedStudent, confirmedData);
      
      if (result.success) {
        setResultData({
          rowsAdded: result.rowsAdded,
          sheetUrl: result.sheetUrl,
        });
        setAppState("success");
        setStatus("success"); // Status call
        toast({
          title: "تم التحويل بنجاح",
          description: `تم إضافة ${result.rowsAdded} سجل(ات) للطالب ${selectedStudent}`,
        });
      } else {
        setStatus("error"); // Status call
        toast({
          title: "حدث خطأ",
          description: result.error || "فشل في إضافة البيانات",
          variant: "destructive",
        });
        setAppState("review");
      }
    } catch (error) {
      setStatus("error"); // Status call
      toast({
        title: "حدث خطأ",
        description: error instanceof Error ? error.message : "فشل في إضافة البيانات",
        variant: "destructive",
      });
      setAppState("review");
    }
  };

  const handleCancelReview = () => {
    setAppState("idle");
    setResultData({});
    setStatus("");
  };

  const handleVoiceData = async (voiceRows: string[][]) => {
    if (!selectedStudent) {
      toast({ title: "خطأ", description: "الرجاء اختيار اسم الطالب أولاً", variant: "destructive" });
      return;
    }
    // Show review state for voice data
    setResultData({
      extractedData: voiceRows,
      columns: ["الخطة", "تاريخ التسميع الفعلي", "عدد الصفحات", "التسميع عند طالب", "الاستماع لشيخ", "التسميع المنزلي", "الأخطاء", "التقدير", "ملاحظات"],
    });
    setAppState("review");
    setStatus(""); // Clear any listening status
  };

  const handleReset = () => {
    setSelectedStudent("");
    setUploadedImage(null);
    setAppState("idle");
    setResultData({});
    setStatus("");
  };

  const features = [
    {
      icon: Zap,
      title: "تحليل فوري",
      description: "قراءة الخط العربي بدقة فائقة",
      gradient: "from-accent/20 via-accent/10 to-transparent",
      iconBg: "bg-gradient-to-br from-accent to-gold-dark",
    },
    {
      icon: Shield,
      title: "دقة عالية",
      description: "حتى الخط غير الواضح",
      gradient: "from-primary/15 via-primary/5 to-transparent",
      iconBg: "bg-gradient-to-br from-primary to-emerald-light",
    },
    {
      icon: Clock,
      title: "حفظ تلقائي",
      description: "مباشرة في Google Sheets",
      gradient: "from-secondary via-muted to-transparent",
      iconBg: "bg-gradient-to-br from-muted-foreground/80 to-muted-foreground/60",
    },
  ];

  // Check mobile for visual optimizations
  const isMobileDevice = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className={`min-h-screen bg-background relative overflow-hidden ${isMobileDevice ? 'bg-pattern-islamic-mobile' : 'bg-pattern-islamic'}`}>
      {/* --- ADDED: System Status Indicator --- */}
      {systemStatus && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-2 bg-foreground/90 text-background rounded-full text-sm font-bold shadow-2xl border border-white/20 animate-in fade-in slide-in-from-top-4 ${!isMobileDevice && 'backdrop-blur-md'}`}>
          {systemStatus}
        </div>
      )}
      {/* -------------------------------------- */}

      {/* Background decorations - Reduced on mobile */}
      {!isMobileDevice && (
        <div className="absolute inset-0 pointer-events-none">
            <motion.div 
            className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-accent/5 rounded-full blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
            className="absolute bottom-1/4 right-1/4 w-64 sm:w-80 h-64 sm:h-80 bg-primary/5 rounded-full blur-3xl"
            animate={{ x: [0, -15, 0], y: [0, 15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
        </div>
      )}

      <div className={`container max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10 ${isMobileDevice ? 'pb-48' : ''}`}>
        <Header />

        <main className="mt-6 sm:mt-10 space-y-5 sm:space-y-8">
          {/* Main Card */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            {/* Card glow effect - Desktop only */}
            {!isMobileDevice && (
                <div className="absolute -inset-0.5 sm:-inset-1 bg-gradient-to-r from-accent/15 via-primary/10 to-accent/15 rounded-2xl sm:rounded-3xl blur-lg sm:blur-xl opacity-60" />
            )}
            
            <div className={`relative bg-card/95 rounded-2xl sm:rounded-3xl border border-border/40 overflow-hidden ${isMobileDevice ? 'shadow-md' : 'shadow-premium backdrop-blur-sm'}`}>
              {/* Top accent line */}
              <div className="h-1 sm:h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
              
              <AnimatePresence mode="wait">
                {appState === "processing" ? (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="p-5 sm:p-10"
                  >
                    <ProcessingState />
                  </motion.div>
                ) : appState === "review" ? (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35 }}
                    className="p-3.5 sm:p-8"
                  >
                    <ReviewState
                      extractedData={resultData.extractedData || []}
                      columns={resultData.columns || []}
                      onConfirm={handleConfirmReview}
                      onCancel={handleCancelReview}
                    />
                  </motion.div>
                ) : appState === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                    className="p-5 sm:p-10"
                  >
                    <SuccessState
                      studentName={selectedStudent}
                      rowsAdded={resultData.rowsAdded}
                      sheetUrl={resultData.sheetUrl}
                      onReset={handleReset}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 sm:p-10 space-y-5 sm:space-y-8"
                  >
                    <StudentSelector
                      value={selectedStudent}
                      onValueChange={setSelectedStudent}
                    />

                    {/* Input Mode Tabs - Enhanced */}
                    <div className="flex gap-1.5 p-1 bg-muted/70 rounded-2xl backdrop-blur-sm border border-border/30">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setInputMode("image")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl text-sm font-bold transition-all duration-250 ${
                          inputMode === "image"
                            ? "bg-card text-foreground shadow-md border border-border/30"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        صورة الدفتر
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setInputMode("voice")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl text-sm font-bold transition-all duration-250 ${
                          inputMode === "voice"
                            ? "bg-card text-foreground shadow-md border border-border/30"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                        تسجيل صوتي
                      </motion.button>
                    </div>

                    {/* Student Records Preview */}
                    <AnimatePresence>
                      {selectedStudent && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                        >
                          <StudentRecordsPreview studentName={selectedStudent} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      {inputMode === "image" ? (
                        <motion.div
                          key="image-mode"
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 15 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-5"
                        >
                          <ImageUploader
                            image={uploadedImage}
                            onImageChange={setUploadedImage}
                          />

                          {!canProcess && (selectedStudent || uploadedImage) && (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-3 text-muted-foreground bg-gradient-to-r from-secondary/80 to-secondary/40 rounded-2xl p-3.5 border border-border/40 shadow-sm"
                            >
                              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="h-5 w-5" />
                              </div>
                              <p className="text-sm font-medium">
                                {!selectedStudent
                                  ? "الرجاء اختيار اسم الطالب"
                                  : "الرجاء رفع صورة الدفتر"}
                              </p>
                            </motion.div>
                          )}

                          <Button
                            variant="emerald"
                            size="lg"
                            className="w-full h-13 sm:h-16 text-sm sm:text-lg font-bold relative overflow-hidden group rounded-2xl"
                            disabled={!canProcess}
                            onClick={handleProcess}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <Sparkles className="ml-2 h-5 w-5" />
                            تحويل وحفظ في Google Sheets
                            <FileSpreadsheet className="mr-2 h-5 w-5" />
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="voice-mode"
                          initial={{ opacity: 0, x: 15 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -15 }}
                          transition={{ duration: 0.3 }}
                        >
                          {!selectedStudent ? (
                            <div className="flex items-center gap-3 text-muted-foreground bg-gradient-to-r from-secondary/80 to-secondary/40 rounded-2xl p-3.5 border border-border/40 shadow-sm">
                              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="h-5 w-5" />
                              </div>
                              <p className="text-sm font-medium">الرجاء اختيار اسم الطالب أولاً</p>
                            </div>
                          ) : (
                            <VoiceInput 
                              onDataReady={handleVoiceData}
                              onStatusChange={setStatus} // Call setStatus
                            />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Features Section - Enhanced for mobile */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {features.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                whileTap={{ scale: 0.97 }}
                className={`bg-gradient-to-br ${item.gradient} backdrop-blur-sm rounded-2xl p-3 sm:p-5 border border-border/30 text-center hover-lift group`}
              >
                <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl ${item.iconBg} text-white flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <h3 className="font-bold text-foreground text-[11px] sm:text-sm mb-0.5">{item.title}</h3>
                <p className="text-[9px] sm:text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <footer className="text-center pb-6 pt-2 sm:pb-8 sm:pt-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-secondary/50 border border-border/40"
            >
              <span className="text-[10px] sm:text-sm text-muted-foreground">
                صُمم بعناية لمعلمي القرآن الكريم
              </span>
              <span className="text-base sm:text-lg">💚</span>
            </motion.div>
          </footer>
        </main>
      </div>
    </div>
  );
}
