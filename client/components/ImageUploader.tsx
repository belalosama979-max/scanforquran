import { useState, useCallback } from "react";
import { Upload, Camera, X, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ImageUploaderProps {
  image: File | null;
  onImageChange: (file: File | null) => void;
}

export function ImageUploader({ image, onImageChange }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file && file.type.startsWith("image/")) {
        onImageChange(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    onImageChange(null);
    setPreview(null);
  }, [onImageChange]);

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
        </div>
        صورة الدفتر
      </label>

      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative border-2 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-10 text-center transition-all duration-300 cursor-pointer
              ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.02] shadow-lg"
                  : "border-border hover:border-primary/50 bg-gradient-to-b from-card to-secondary/20 hover:shadow-md"
              }
            `}
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-4 sm:space-y-5">
              <div className="mx-auto w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border-2 border-dashed border-primary/30">
                <Upload className="h-7 w-7 sm:h-10 sm:w-10 text-primary" />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-base sm:text-xl font-semibold text-foreground">
                  اسحب الصورة هنا أو اضغط للاختيار
                </p>
                <p className="text-sm sm:text-base text-muted-foreground">
                  يمكنك أيضاً التقاط صورة مباشرة من الكاميرا
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
                <Button variant="outline" size="lg" className="pointer-events-none shadow-sm h-11 sm:h-12 text-sm sm:text-base">
                  <Upload className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  رفع ملف
                </Button>
                <Button variant="outline" size="lg" className="pointer-events-none shadow-sm h-11 sm:h-12 text-sm sm:text-base">
                  <Camera className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  الكاميرا
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl sm:rounded-2xl overflow-hidden border-2 border-primary/30 bg-card shadow-lg group"
          >
            <img
              src={preview}
              alt="معاينة الصورة"
              className="w-full h-48 sm:h-72 object-contain bg-gradient-to-b from-secondary/30 to-secondary/10"
            />
            <button
              onClick={handleRemove}
              className="absolute top-3 sm:top-4 left-3 sm:left-4 p-2 sm:p-2.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200 shadow-lg hover:scale-110"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/90 via-foreground/60 to-transparent p-4 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-primary-foreground font-medium text-sm sm:text-base truncate">
                    {image?.name}
                  </p>
                  <p className="text-primary-foreground/70 text-xs sm:text-sm">
                    جاهز للتحويل
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
