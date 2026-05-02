import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [skinType, setSkinType] = useState("");
  const { setAuth } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let data: any;
      if (mode === "login") {
        data = await loginMutation.mutateAsync({ data: { email, password } });
      } else {
        data = await registerMutation.mutateAsync({ data: { email, password, firstName, lastName, skinType: skinType || undefined } });
      }
      if (data?.accessToken && data?.user) {
        setAuth(data.user, data.accessToken);
        toast({ title: `Welcome${mode === "register" ? "" : " back"}, ${data.user.firstName}!` });
        navigate("/");
      }
    } catch (err: any) {
      const msg = err?.data?.message ?? err?.message ?? "Something went wrong";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://picsum.photos/seed/authpanel/800/1000"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/60" />
        <div className="relative flex flex-col justify-end p-16">
          <h2 className="font-serif text-5xl font-light text-foreground leading-tight mb-4">
            Your beauty<br />journey starts<br /><span className="italic text-primary">here.</span>
          </h2>
          <p className="text-muted-foreground font-sans font-light max-w-xs">
            Join thousands discovering their perfect skincare routine with Lumière Beauty.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <p className="font-serif text-3xl font-light text-primary tracking-[0.15em] mb-8">LUMIÈRE</p>
            <div className="flex gap-6 border-b border-border">
              {(["login", "register"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs tracking-widest uppercase font-sans block mb-2">First Name *</label>
                    <input
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-xs tracking-widest uppercase font-sans block mb-2">Last Name *</label>
                    <input
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs tracking-widest uppercase font-sans block mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                />
              </div>

              <div>
                <label className="text-xs tracking-widest uppercase font-sans block mb-2">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                />
              </div>

              {mode === "register" && (
                <div>
                  <label className="text-xs tracking-widest uppercase font-sans block mb-2">Skin Type (Optional)</label>
                  <select
                    value={skinType}
                    onChange={e => setSkinType(e.target.value)}
                    className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans text-foreground"
                  >
                    <option value="">Select skin type</option>
                    {["dry", "oily", "combination", "normal", "sensitive"].map(st => (
                      <option key={st} value={st} className="capitalize">{st.charAt(0).toUpperCase() + st.slice(1)}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-primary text-primary-foreground py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50 font-sans mt-2"
              >
                {isPending ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              </button>

              <p className="text-center text-xs text-muted-foreground font-sans pt-2">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "register" : "login")}
                  className="text-primary hover:opacity-80 transition-opacity"
                >
                  {mode === "login" ? "Create one" : "Sign in"}
                </button>
              </p>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
