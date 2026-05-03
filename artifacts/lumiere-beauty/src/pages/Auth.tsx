import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle } from "lucide-react";

export default function Auth() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [skinType, setSkinType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [fieldError, setFieldError] = useState<{ field: string; msg: string } | null>(null);
  const { setAuth } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    try {
      if (mode === "register") {
        await registerMutation.mutateAsync({ data: { email, password, firstName, lastName, skinType: skinType || undefined } });
        setRegisterSuccess(true);
        setTimeout(() => {
          setMode("login");
          setRegisterSuccess(false);
          setPassword("");
        }, 1800);
      } else {
        const data = await loginMutation.mutateAsync({ data: { email, password } });
        if (data?.accessToken && data?.user) {
          setAuth(data.user, data.accessToken);
          toast({ title: `Welcome back, ${data.user.firstName}!` });
          navigate("/");
        }
      }
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      const msg = err?.data?.message ?? err?.message ?? "Something went wrong";

      if (mode === "register" && status === 409) {
        setFieldError({ field: "email", msg: "This email is already registered. Please sign in instead." });
      } else if (mode === "login" && status === 401) {
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes("credential") || lowerMsg.includes("password") || lowerMsg.includes("invalid")) {
          setFieldError({ field: "password", msg: "Incorrect email or password. Please try again." });
        } else {
          setFieldError({ field: "email", msg: msg });
        }
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const inputClass = (field?: string) =>
    `w-full bg-background border px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans rounded-lg transition-colors ${
      fieldError?.field === field ? "border-destructive ring-1 ring-destructive" : "border-border"
    }`;

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1570194065650-d99fb4ee0e7e?w=900&q=90&fit=crop&auto=format"
          alt="Luxury beauty products"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-background/30 to-accent/25" />
        <div className="relative flex flex-col justify-end p-16">
          <div className="backdrop-blur-sm bg-white/15 rounded-2xl p-8 border border-white/20">
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/70 font-sans mb-3">Lumière Beauty</p>
            <h2 className="font-serif text-4xl font-light text-white leading-tight mb-4">
              Your beauty<br />journey starts<br /><em className="text-accent">here.</em>
            </h2>
            <p className="text-white/80 font-sans font-light text-sm leading-relaxed">
              Join thousands discovering their perfect skincare routine with Lumière Beauty.
            </p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <p className="font-serif text-3xl font-light text-primary tracking-[0.15em] mb-8">LUMIÈRE</p>
            <div className="flex gap-6 border-b border-border">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setFieldError(null); setRegisterSuccess(false); }}
                  className={`pb-3 text-xs tracking-widest uppercase font-sans transition-colors border-b-2 -mb-px ${
                    mode === m ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {registerSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-10 text-center"
              >
                <CheckCircle size={48} className="text-green-500" />
                <h3 className="font-serif text-2xl text-foreground">Account Created!</h3>
                <p className="text-muted-foreground font-sans text-sm">
                  Welcome to Lumière! Please sign in with your new credentials.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {mode === "register" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] tracking-widest uppercase font-sans block mb-2 text-foreground/80">First Name *</label>
                      <input
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={inputClass()}
                        placeholder="Jane"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] tracking-widest uppercase font-sans block mb-2 text-foreground/80">Last Name *</label>
                      <input
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={inputClass()}
                        placeholder="Smith"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] tracking-widest uppercase font-sans block mb-2 text-foreground/80">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFieldError(null); }}
                    className={inputClass("email")}
                    placeholder="jane@example.com"
                  />
                  {fieldError?.field === "email" && (
                    <p className="text-destructive text-xs font-sans mt-1.5">{fieldError.msg}</p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] tracking-widest uppercase font-sans block mb-2 text-foreground/80">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setFieldError(null); }}
                      className={`${inputClass("password")} pr-12`}
                      placeholder="At least 6 characters"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldError?.field === "password" && (
                    <p className="text-destructive text-xs font-sans mt-1.5">{fieldError.msg}</p>
                  )}
                </div>

                {mode === "register" && (
                  <div>
                    <label className="text-[11px] tracking-widest uppercase font-sans block mb-2 text-foreground/80">Skin Type (Optional)</label>
                    <select
                      value={skinType}
                      onChange={(e) => setSkinType(e.target.value)}
                      className="w-full bg-background border border-border px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans text-foreground rounded-lg"
                    >
                      <option value="">Select your skin type</option>
                      {["dry", "oily", "combination", "normal", "sensitive"].map((st) => (
                        <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-primary text-primary-foreground py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-all disabled:opacity-50 font-sans mt-2 rounded-lg shadow-md hover:shadow-lg"
                >
                  {isPending ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
                </button>

                <p className="text-center text-xs text-muted-foreground font-sans pt-2">
                  {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => { setMode(mode === "login" ? "register" : "login"); setFieldError(null); }}
                    className="text-primary hover:opacity-80 transition-opacity font-medium"
                  >
                    {mode === "login" ? "Create one" : "Sign in"}
                  </button>
                </p>

                {mode === "login" && (
                  <p className="text-center text-[11px] text-muted-foreground font-sans">
                    Admin: admin@lumierebeauty.com
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
