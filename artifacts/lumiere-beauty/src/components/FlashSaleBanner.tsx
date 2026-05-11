import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Copy, Check } from "lucide-react";

const STORAGE_KEY = "lumiere_flash_sale_dismissed";
const SALE_DURATION_MS = 24 * 60 * 60 * 1000;
const SALE_END_KEY = "lumiere_flash_sale_end";
const BANNER_HEIGHT = 40;
const DISCOUNT_CODE = "FLASH20";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getTimeLeft(endTs: number) {
  const diff = Math.max(0, endTs - Date.now());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return { h, m, s, expired: diff === 0 };
}

export default function FlashSaleBanner() {
  const [visible, setVisible] = useState(false);
  const [endTs, setEndTs] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0, expired: false });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    let end = parseInt(localStorage.getItem(SALE_END_KEY) ?? "0", 10);
    if (!end || end < Date.now()) {
      end = Date.now() + SALE_DURATION_MS;
      localStorage.setItem(SALE_END_KEY, String(end));
    }
    setEndTs(end);
    setTimeLeft(getTimeLeft(end));
    setVisible(true);
    document.documentElement.style.setProperty("--banner-height", `${BANNER_HEIGHT}px`);
  }, []);

  useEffect(() => {
    if (!visible || !endTs) return;
    const id = setInterval(() => {
      const tl = getTimeLeft(endTs);
      setTimeLeft(tl);
      if (tl.expired) {
        dismiss();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [visible, endTs]);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
    document.documentElement.style.setProperty("--banner-height", "0px");
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(DISCOUNT_CODE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: BANNER_HEIGHT, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-0 left-0 right-0 z-[60] overflow-hidden"
          style={{ height: BANNER_HEIGHT }}
        >
          <div
            className="h-full flex items-center justify-center px-4 gap-4"
            style={{ background: "linear-gradient(90deg, #9b3a5c 0%, #c4607a 40%, #e8a0b0 70%, #c4607a 100%)" }}
          >
            {/* Left: icon + message */}
            <div className="flex items-center gap-2 min-w-0">
              <Zap size={13} className="text-white/90 flex-shrink-0" fill="currentColor" />
              <span className="text-white text-[11px] tracking-widest uppercase font-sans font-medium whitespace-nowrap">
                Flash Sale — 20% off sitewide
              </span>
            </div>

            {/* Code chip */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/40 rounded-full px-3 py-0.5 transition-colors flex-shrink-0"
            >
              {copied ? <Check size={11} className="text-white" /> : <Copy size={11} className="text-white" />}
              <span className="font-mono text-white text-[11px] font-bold tracking-[0.2em]">{DISCOUNT_CODE}</span>
            </button>

            {/* Countdown */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-white/70 text-[10px] font-sans tracking-widest uppercase hidden sm:inline">Ends in</span>
              <span className="font-mono text-white text-[12px] font-semibold tabular-nums">
                {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
              </span>
            </div>

            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-1"
            >
              <X size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
