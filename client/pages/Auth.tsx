import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Mail, Lock, User, BookOpen, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: "خطأ في الدخول", description: error.message === "Invalid login credentials" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : error.message, variant: "destructive" });
        } else {
          navigate("/");
        }
      } else {
        if (!fullName.trim()) {
          toast({ title: "خطأ", description: "الرجاء إدخال الاسم الكامل", variant: "destructive" });
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({ title: "خطأ في التسجيل", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "تم التسجيل", description: "يرجى تفعيل حسابك من البريد الإلكتروني" });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-pattern-islamic relative overflow-hidden flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 via-primary/10 to-accent/20 rounded-3xl blur-xl opacity-50" />

        <div className="relative bg-card/95 backdrop-blur-sm rounded-2xl shadow-premium border border-border/50 overflow-hidden">
          {/* Top accent */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

          <div className="p-6 sm:p-8 space-y-6">
            {/* Logo */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative mx-auto w-20 h-20"
              >
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-accent/30 via-primary/20 to-accent/30 blur-lg" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-card via-card to-secondary flex items-center justify-center shadow-premium border border-border/50 overflow-hidden">
                  <img src="/logo-512.png" alt="شعار المركز" className="w-16 h-16 object-contain" />
                </div>
              </motion.div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-amiri text-foreground">
                  مركز ضاحية الاستقلال القرآني
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isLogin ? "تسجيل الدخول للمتابعة" : "إنشاء حساب جديد"}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <User className="w-4 h-4 text-primary" />
                    الاسم الكامل
                  </Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: بلال أحمد"
                    dir="rtl"
                    className="h-12 rounded-xl border-2 border-border hover:border-primary/50 focus:border-primary text-base"
                  />
                </motion.div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Mail className="w-4 h-4 text-primary" />
                  البريد الإلكتروني
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  dir="ltr"
                  className="h-12 rounded-xl border-2 border-border hover:border-primary/50 focus:border-primary text-base text-left"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Lock className="w-4 h-4 text-primary" />
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="h-12 rounded-xl border-2 border-border hover:border-primary/50 focus:border-primary text-base text-left pl-12"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="emerald"
                size="lg"
                className="w-full h-14 text-lg font-bold"
                disabled={submitting}
              >
                {submitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                ) : isLogin ? (
                  <>
                    <LogIn className="ml-2 w-5 h-5" />
                    تسجيل الدخول
                  </>
                ) : (
                  <>
                    <UserPlus className="ml-2 w-5 h-5" />
                    إنشاء حساب
                  </>
                )}
              </Button>
            </form>

            {/* Toggle */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                {isLogin ? "ليس لديك حساب؟ سجّل الآن" : "لديك حساب؟ سجّل دخولك"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">محوّل دفتر الحفظ الذكي</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
