import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, ChevronDown, ChevronUp, FileSpreadsheet, Loader2, AlertCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface StudentRecordsPreviewProps {
  studentName: string;
}

const COLUMNS = [
  "المطلوب",
  "اليوم", 
  "التاريخ المتوقع",
  "تاريخ التسميع",
  "التقدير",
  "الاستماع للشيخ",
  "التسميع لطالب آخر",
  "ملاحظات"
];

const getGradeColor = (grade: string) => {
  if (!grade) return "";
  if (grade.includes("ممتاز")) return "bg-emerald-100 text-emerald-800";
  if (grade.includes("جيد جداً") || grade.includes("جيد جدا")) return "bg-blue-100 text-blue-800";
  if (grade.includes("جيد")) return "bg-sky-100 text-sky-800";
  if (grade.includes("مقبول")) return "bg-amber-100 text-amber-800";
  return "bg-muted text-muted-foreground";
};

export function StudentRecordsPreview({ studentName }: StudentRecordsPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [records, setRecords] = useState<string[][]>([]);
  const [sheetUrl, setSheetUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    if (!studentName || records.length > 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/student-records/${encodeURIComponent(studentName)}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || "فشل في جلب البيانات");
        return;
      }

      const mappedRecords = (data.records || []).map((r: any) => [
        r.plan || "",
        r.actualDate || "",
        r.pages || "",
        r.pages || "",
        r.grade || "",
        (r.sheikhListen === true || r.sheikhListen === "TRUE" || r.sheikhListen === "نعم") ? "نعم" : "لا",
        (r.studentListen === true || r.studentListen === "TRUE" || r.studentListen === "نعم") ? "نعم" : "لا",
        r.notes || ""
      ]);

      setRecords(mappedRecords);
      // setSheetUrl(data.sheetUrl || ""); // Server doesn't return sheetUrl in GET yet, but that's fine for now.
    } catch (err) {
      console.error(err);
      setError("حدث خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded && records.length === 0 && !isLoading) {
      fetchRecords();
    }
  }, [isExpanded, studentName]);

  // Reset when student changes
  useEffect(() => {
    setRecords([]);
    setError(null);
    setIsExpanded(false);
  }, [studentName]);

  if (!studentName) return null;

  return (
    <div className="border-2 border-border rounded-xl overflow-hidden bg-card transition-all duration-300 hover:border-primary/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-emerald-light flex items-center justify-center shadow-md">
            <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
          <div className="text-right">
            <h3 className="font-semibold text-foreground text-sm sm:text-base">سجلات {studentName}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">آخر 5 تسميعات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {records.length} سجل
            </span>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border overflow-hidden"
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 gap-2 sm:gap-3">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-spin" />
                <p className="text-sm sm:text-base text-muted-foreground">جارٍ تحميل السجلات...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 gap-2 sm:gap-3 text-destructive">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                <p className="text-sm sm:text-base">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchRecords}>
                  إعادة المحاولة
                </Button>
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 gap-2 sm:gap-3 text-muted-foreground">
                <FileSpreadsheet className="w-10 h-10 sm:w-12 sm:h-12 opacity-50" />
                <p className="text-sm sm:text-base">لا توجد سجلات بعد</p>
              </div>
            ) : (
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Records as cards for mobile-friendly display */}
                <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                  {records.slice(0, 3).map((record, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-secondary/30 rounded-lg p-3 sm:p-4 space-y-2 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm sm:text-base line-clamp-2">{record[0] || "-"}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {record[1]} • {record[3] || record[2] || "-"}
                          </p>
                        </div>
                        {record[4] && (
                          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${getGradeColor(record[4])}`}>
                            {record[4]}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground">
                        {record[5] === "نعم" && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-accent" />
                            استمع للشيخ
                          </span>
                        )}
                        {record[6] === "نعم" && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-accent" />
                            سمّع لطالب
                          </span>
                        )}
                      </div>
                      {record[7] && (
                        <p className="text-xs sm:text-sm text-muted-foreground italic border-t border-border pt-2 mt-2">
                          {record[7]}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Link to full sheet */}
                {sheetUrl && (
                  <div className="pt-2 border-t border-border">
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-xs sm:text-sm font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      عرض جميع السجلات في Google Sheets
                    </a>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
