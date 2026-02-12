import { Loader2, Sparkles, FileSearch, Upload } from "lucide-react";

export function ProcessingState() {
  return (
    <div className="text-center py-12 space-y-8 animate-fade-in">
      {/* Animated Icon */}
      <div className="relative mx-auto w-32 h-32">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-20 animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary to-emerald-light flex items-center justify-center shadow-xl">
          <FileSearch className="w-12 h-12 text-primary-foreground animate-pulse" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-lg animate-bounce">
          <Sparkles className="w-4 h-4 text-accent-foreground" />
        </div>
      </div>

      {/* Text */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-foreground font-amiri">
          جارٍ تحليل الصورة...
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          يتم استخراج البيانات من الدفتر باستخدام تقنية الذكاء الاصطناعي المتقدمة
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center gap-8 pt-4">
        {[
          { icon: Upload, label: "رفع", done: true },
          { icon: FileSearch, label: "تحليل", active: true },
          { icon: Sparkles, label: "استخراج" },
        ].map((step, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
              ${step.done ? 'bg-primary text-primary-foreground shadow-lg' : 
                step.active ? 'bg-primary/20 text-primary animate-pulse shadow-md' : 
                'bg-muted text-muted-foreground'}
            `}>
              <step.icon className="w-5 h-5" />
            </div>
            <span className={`text-sm font-medium ${step.active ? 'text-primary' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Loading Spinner */}
      <div className="flex justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    </div>
  );
}
