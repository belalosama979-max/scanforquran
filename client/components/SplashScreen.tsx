import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 600);
    }, 2800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary via-emerald-light to-primary" />
          
          {/* Animated gradient overlay */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-accent/20"
            animate={{ 
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />

          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.4'%3E%3Cpath d='M50 0l50 50-50 50L0 50zm0 15L15 50l35 35 35-35z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "80px 80px",
            }} />
          </div>

          {/* Floating particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-accent/40"
              style={{
                left: `${15 + i * 10}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.4,
              }}
            />
          ))}

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 150, 
              damping: 12,
              delay: 0.2 
            }}
            className="relative mb-10"
          >
            {/* Outer glow rings */}
            <motion.div
              className="absolute -inset-8 rounded-full border-2 border-accent/30"
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute -inset-16 rounded-full border border-white/10"
              animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            />
            
            {/* Main logo container */}
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-3xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/30">
              <img 
                src="/logo-512.png" 
                alt="شعار المركز" 
                className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-lg"
              />
              
              {/* Inner shimmer */}
              <motion.div 
                className="absolute inset-0 rounded-3xl"
                style={{
                  background: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)",
                }}
                animate={{ 
                  backgroundPosition: ["-200% -200%", "200% 200%"],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-accent/40 blur-2xl -z-10" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="text-center px-6 relative z-10"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-amiri mb-5 drop-shadow-lg">
              مركز ضاحية الاستقلال القرآني
            </h1>
            
            {/* Decorative divider */}
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex items-center justify-center gap-3 mb-5"
            >
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-accent" />
              <div className="w-2 h-2 rounded-full bg-accent" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-accent" />
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="text-lg md:text-xl text-white/90 font-semibold"
            >
              بإشراف اللجنة الفنية
            </motion.p>
          </motion.div>

          {/* Loading indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="absolute bottom-16 flex flex-col items-center"
          >
            <div className="flex gap-3 mb-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-accent shadow-gold"
                  animate={{
                    y: [0, -12, 0],
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
            <p className="text-white/60 text-sm font-medium">جاري التحميل...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
