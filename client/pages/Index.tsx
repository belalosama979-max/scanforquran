import { useState, useCallback } from "react";
import { MobileIntro } from "@/components/MobileIntro";
import { InstallPrompt } from "@/components/InstallPrompt";
import { MainApp } from "@/components/MainApp";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <MobileIntro onComplete={handleSplashComplete} />}
      <MainApp />
      <InstallPrompt />
    </>
  );
};

export default Index;
