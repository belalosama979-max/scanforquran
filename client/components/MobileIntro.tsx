import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileIntroProps {
  onComplete: () => void;
}

export function MobileIntro({ onComplete }: MobileIntroProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Total duration 1.5 seconds
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 400); // 400ms buffer for exit animation
    }, 1100);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f6f3eb]"
        >
          {/* Logo Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-6 relative"
          >
             <div className="w-32 h-32 rounded-3xl bg-white shadow-lg flex items-center justify-center p-4">
               <img src="/logo-192.png" alt="Logo" className="w-full h-full object-contain" />
             </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-xl font-bold text-primary text-center font-amiri px-4"
          >
            مركز ضاحية الاستقلال القرآني
          </motion.h1>
          
          {/* Subtle loading bar */}
           <motion.div 
            className="absolute bottom-10 h-1 bg-primary/20 w-32 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
