import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function MobilePWA() {
  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (!isMobile) return;

    // Detect Standalone Mode
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone;
    
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      // Hide Splash after delay
      const timer = setTimeout(() => setShowSplash(false), 2500);
      return () => clearTimeout(timer);
    } else {
      setShowSplash(false);
      
      // Capture install prompt
      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        // Show prompt after a small delay to not be annoying
        setTimeout(() => setShowInstall(true), 3000);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }
  }, [isMobile]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };

  if (!isMobile) return null;

  return (
    <>
      {/* Splash Screen (Standalone Only) */}
      <AnimatePresence>
        {isStandalone && showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#0D4F3C] flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md mb-4 border border-white/20">
                 <img src="/logo-192.png" alt="Logo" className="w-16 h-16 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">محوّل الدفتر</h1>
              <p className="text-sm text-white/70">مركز ضاحية الاستقلال القرآني</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Prompt (Browser Only) */}
      <AnimatePresence>
        {showInstall && !isStandalone && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 z-50"
          >
            <div className="bg-[#0D4F3C] text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                   <h3 className="font-bold text-lg">تثبيت التطبيق</h3>
                   <p className="text-xs text-white/80 mt-1">
                     قم بتثبيت التطبيق لتجربة أسرع وشاشة كاملة.
                   </p>
                </div>
                <button onClick={() => setShowInstall(false)} className="text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Button 
                onClick={handleInstallClick}
                className="w-full bg-white text-[#0D4F3C] hover:bg-white/90 font-bold rounded-xl gap-2 h-10"
              >
                <Download className="w-4 h-4" />
                تثبيت الآن
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
