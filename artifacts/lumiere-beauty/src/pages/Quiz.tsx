import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { useSubmitQuiz, useGetQuizResults } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/ProductCard";

const STEPS = [
  {
    key: "skinType",
    question: "What best describes your skin type?",
    options: [
      { value: "dry", label: "Dry", desc: "Feels tight, flaky, or rough" },
      { value: "oily", label: "Oily", desc: "Shiny, enlarged pores" },
      { value: "combination", label: "Combination", desc: "Oily T-zone, dry cheeks" },
      { value: "normal", label: "Normal", desc: "Balanced, minimal issues" },
      { value: "sensitive", label: "Sensitive", desc: "Reacts easily, prone to redness" },
    ],
    multi: false,
  },
  {
    key: "concerns",
    question: "What are your main skin concerns?",
    subtitle: "Select all that apply",
    options: [
      { value: "acne", label: "Acne & Breakouts" },
      { value: "dark spots", label: "Dark Spots" },
      { value: "dullness", label: "Dullness & Radiance" },
      { value: "dryness", label: "Dryness & Dehydration" },
      { value: "large pores", label: "Large Pores" },
      { value: "redness", label: "Redness & Sensitivity" },
      { value: "wrinkles", label: "Fine Lines & Wrinkles" },
      { value: "uneven texture", label: "Uneven Texture" },
    ],
    multi: true,
  },
  {
    key: "ageRange",
    question: "What is your age range?",
    options: [
      { value: "under 25", label: "Under 25" },
      { value: "25-35", label: "25 – 35" },
      { value: "35-45", label: "35 – 45" },
      { value: "45+", label: "45 and above" },
    ],
    multi: false,
  },
  {
    key: "dailyTime",
    question: "How much time do you have for skincare daily?",
    options: [
      { value: "minimal", label: "Minimal", desc: "Under 5 minutes" },
      { value: "moderate", label: "Moderate", desc: "5–15 minutes" },
      { value: "dedicated", label: "Dedicated", desc: "15–30 minutes" },
      { value: "luxury", label: "Luxury", desc: "30+ minutes" },
    ],
    multi: false,
  },
  {
    key: "budget",
    question: "What is your budget per product?",
    options: [
      { value: "under 30", label: "Under $30" },
      { value: "30-60", label: "$30 – $60" },
      { value: "60-100", label: "$60 – $100" },
      { value: "100+", label: "$100+" },
    ],
    multi: false,
  },
];

interface Answers {
  skinType: string;
  concerns: string[];
  ageRange: string;
  dailyTime: string;
  budget: string;
}

export default function Quiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ skinType: "", concerns: [], ageRange: "", dailyTime: "", budget: "" });
  const [results, setResults] = useState<any>(null);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const submitMutation = useSubmitQuiz();
  const { data: savedResults } = useGetQuizResults({ query: { enabled: isAuthenticated, retry: false } });

  const current = STEPS[step];

  const getValue = () => {
    const a = answers as Record<string, string | string[]>;
    return a[current.key];
  };

  const isSelected = (val: string) => {
    const v = getValue();
    if (Array.isArray(v)) return v.includes(val);
    return v === val;
  };

  const toggle = (val: string) => {
    if (current.multi) {
      const arr = (answers.concerns ?? []) as string[];
      setAnswers({ ...answers, concerns: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] });
    } else {
      setAnswers({ ...answers, [current.key]: val });
    }
  };

  const canNext = () => {
    const v = getValue();
    if (current.multi) return (v as string[]).length > 0;
    return !!v;
  };

  const handleSubmit = async () => {
    try {
      const res = await submitMutation.mutateAsync({ data: answers });
      setResults(res);
    } catch {
      toast({ title: "Error getting recommendations", variant: "destructive" });
    }
  };

  const handleAddAllToCart = async () => {
    if (!results?.recommendations) return;
    for (const rec of results.recommendations.slice(0, 3)) {
      try { await addToCart(rec.product.id); } catch {}
    }
    toast({ title: "Top picks added to cart" });
  };

  if (results) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <p className="text-xs tracking-[0.4em] uppercase text-primary mb-4 font-sans">Your Results</p>
            <h1 className="font-serif text-5xl font-light mb-4">Your Personalized Routine</h1>
            <p className="text-muted-foreground font-sans max-w-md mx-auto">
              Based on your {results.skinProfile?.skinType} skin with concerns about {results.skinProfile?.concerns?.join(", ")}, our beauty AI has curated these products for you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {results.recommendations?.map((rec: any, i: number) => (
              <motion.div key={rec.product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <ProductCard product={rec.product} />
                <div className="mt-3 p-3 bg-card border border-card-border">
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed italic">"{rec.reason}"</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleAddAllToCart}
              className="bg-primary text-primary-foreground px-10 py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity font-sans"
            >
              Add Top 3 to Cart
            </button>
            <button
              onClick={() => { setResults(null); setStep(0); setAnswers({ skinType: "", concerns: [], ageRange: "", dailyTime: "", budget: "" }); }}
              className="border border-border px-10 py-4 text-xs tracking-widest uppercase hover:bg-secondary transition-colors font-sans"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-3 font-sans">Personalized For You</p>
          <h1 className="font-serif text-4xl font-light">Skin Quiz</h1>
          <p className="text-muted-foreground text-sm font-sans mt-3">
            Answer {STEPS.length} questions to receive AI-powered product recommendations tailored to your skin.
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-12">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-0.5 flex-1 transition-colors duration-300 ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        {/* Step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-8">
              <p className="text-xs text-muted-foreground font-sans mb-2">{step + 1} of {STEPS.length}</p>
              <h2 className="font-serif text-2xl font-light">{current.question}</h2>
              {(current as any).subtitle && <p className="text-muted-foreground text-sm font-sans mt-1">{(current as any).subtitle}</p>}
            </div>

            <div className="grid gap-3">
              {current.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className={`flex items-center justify-between p-4 border transition-colors text-left ${
                    isSelected(opt.value)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div>
                    <p className="font-sans text-sm font-medium">{opt.label}</p>
                    {(opt as any).desc && <p className="text-xs text-muted-foreground mt-0.5">{(opt as any).desc}</p>}
                  </div>
                  {isSelected(opt.value) && (
                    <div className="w-4 h-4 bg-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors font-sans"
          >
            <ChevronLeft size={14} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 text-xs tracking-widest uppercase hover:opacity-90 disabled:opacity-50 transition-opacity font-sans"
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canNext() || submitMutation.isPending}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 text-xs tracking-widest uppercase hover:opacity-90 disabled:opacity-50 transition-opacity font-sans"
            >
              {submitMutation.isPending ? (
                <><Sparkles size={14} className="animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles size={14} /> Get My Results</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
