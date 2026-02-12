import { Sparkles, BookOpen, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function Header() {
  const { profile, signOut } = useAuth();

  return (
    <header className="text-center space-y-4 sm:space-y-6 py-3 sm:py-6">
      {/* User info bar */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-card/80 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-border/50 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-light flex items-center justify-center text-primary-foreground text-xs font-bold">
              {profile.full_name?.charAt(0) || "م"}
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground leading-tight">{profile.full_name}</p>
              {profile.section_name && (
                <p className="text-[11px] text-muted-foreground">{profile.section_name}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-destructive h-8 px-2">
            <LogOut className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* Logo and Title */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="inline-flex flex-col items-center gap-3 sm:gap-5"
      >
        <div className="relative">
          {/* Outer glow ring */}
          <motion.div 
            className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-accent/30 via-primary/20 to-accent/30 blur-xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Logo container */}
          <div className="relative w-18 h-18 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-card via-card to-secondary flex items-center justify-center shadow-premium border border-border/50 overflow-hidden">
            <img src="/logo-512.png" alt="شعار المركز" className="w-14 h-14 sm:w-20 sm:h-20 object-contain" />
            <div className="absolute inset-0 animate-shimmer" />
          </div>
          
          {/* Sparkle badge */}
          <motion.div 
            className="absolute -top-1.5 -right-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-accent to-gold-dark flex items-center justify-center shadow-gold"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
          </motion.div>
        </div>
        
        <div className="space-y-1.5">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl sm:text-3xl md:text-4xl font-bold font-amiri text-foreground leading-tight"
          >
            <span className="text-gradient-gold">محوّل</span> دفتر الحفظ
          </motion.h1>
          
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="h-0.5 w-20 sm:w-28 mx-auto rounded-full bg-gradient-to-r from-transparent via-accent to-transparent"
          />
        </div>
      </motion.div>

      {/* Description */}
      <motion.p 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-xs sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed px-4"
      >
        حوّل دفاتر الحفظ المكتوبة بخط اليد إلى ملفات منظمة بضغطة واحدة
      </motion.p>

      {/* Feature Tags */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-wrap justify-center gap-2 px-2"
      >
        <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-primary/15 to-primary/5 text-primary text-[11px] sm:text-xs font-semibold border border-primary/20 shadow-sm">
          <motion.span 
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary ml-1.5"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          ذكاء اصطناعي
        </span>
        
        <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-accent/25 to-accent/10 text-accent-foreground text-[11px] sm:text-xs font-semibold border border-accent/30">
          <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1.5 text-accent" />
          قراءة خط اليد
        </span>
        
        <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-secondary text-secondary-foreground text-[11px] sm:text-xs font-semibold border border-border">
          <motion.span 
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary/60 ml-1.5"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          حفظ تلقائي
        </span>
      </motion.div>
    </header>
  );
}
