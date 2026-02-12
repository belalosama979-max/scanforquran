import { CheckCircle2, ExternalLink, RotateCcw, Sparkles, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessStateProps {
  studentName: string;
  rowsAdded?: number;
  sheetUrl?: string;
  onReset: () => void;
}

export function SuccessState({ studentName, rowsAdded, sheetUrl, onReset }: SuccessStateProps) {
  return (
    <div className="text-center py-8 space-y-8 animate-fade-in">
      {/* Success Icon */}
      <div className="relative mx-auto w-28 h-28">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-emerald-light flex items-center justify-center shadow-xl">
          <CheckCircle2 className="w-14 h-14 text-primary-foreground" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-lg">
          <Sparkles className="w-4 h-4 text-accent-foreground" />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-foreground font-amiri">
          تم بنجاح! 🎉
        </h2>
        <div className="bg-secondary/50 rounded-xl p-4 max-w-sm mx-auto">
          <p className="text-foreground font-medium mb-1">
            الطالب: {studentName}
          </p>
          {rowsAdded && (
            <p className="text-muted-foreground">
              تم إضافة <span className="text-primary font-bold">{rowsAdded}</span> سجل(ات) للجدول
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        {sheetUrl && (
          <Button
            variant="emerald"
            size="lg"
            className="shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => window.open(sheetUrl, '_blank')}
          >
            <FileSpreadsheet className="ml-2 h-5 w-5" />
            فتح Google Sheets
            <ExternalLink className="mr-2 h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          onClick={onReset}
          className="shadow-sm hover:shadow-md transition-all duration-300"
        >
          <RotateCcw className="ml-2 h-5 w-5" />
          تحويل صفحة جديدة
        </Button>
      </div>

      {/* Decorative Element */}
      <div className="flex justify-center gap-2 pt-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-accent animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
