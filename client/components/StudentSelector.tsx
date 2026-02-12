import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, User } from "lucide-react";

interface StudentSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

const STUDENTS = [
  "أحمد صبحا",
  "أبي العنبوسي",
  "عمر الرجوب",
  "صالح العكش",
  "محمد المناصير",
  "محمود الناصر",
  "زيد صافي",
  "ليث العبداللات",
  "عبد الرحمن التوتنجي",
  "أسامة الطباخي",
];

export function StudentSelector({ value, onValueChange }: StudentSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
        </div>
        اختر الطالب
      </label>

      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-12 sm:h-14 bg-card border-2 border-border hover:border-primary/50 focus:border-primary transition-all duration-200 text-base sm:text-lg shadow-sm hover:shadow-md rounded-xl">
          <SelectValue placeholder="اختر اسم الطالب..." />
        </SelectTrigger>
        <SelectContent className="bg-card border-2 border-border shadow-xl z-50 rounded-xl">
          {STUDENTS.map((name) => (
            <SelectItem
              key={name}
              value={name}
              className="text-base sm:text-lg py-3 cursor-pointer hover:bg-primary/5 focus:bg-primary/10 transition-colors rounded-lg mx-1"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <span>{name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
