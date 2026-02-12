import { useState, useCallback } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { InstallPrompt } from "@/components/InstallPrompt";
import { MainApp } from "@/components/MainApp";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <MainApp />
      <InstallPrompt />
    </>
  );
};

export default Index;
