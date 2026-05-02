import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Mic, Volume2, VolumeX } from "lucide-react";
import { useSendChatMessage } from "@workspace/api-client-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Lumiere, your beauty advisor. Tap the microphone, speak your question, and I'll respond in both text and voice.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [bars, setBars] = useState<number[]>([4, 4, 4, 4, 4]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const chatMutation = useSendChatMessage();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const animRef = useRef<number | null>(null);
  const messagesRef = useRef(messages);
  const isListeningRef = useRef(false);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages, open, isListening]);

  // ─── Animate bars when listening ───────────────────────────────────────────
  const startBarAnim = useCallback(() => {
    let t = 0;
    const tick = () => {
      t += 0.18;
      setBars([
        Math.round(4 + Math.abs(Math.sin(t + 0.0)) * 22),
        Math.round(4 + Math.abs(Math.sin(t + 0.7)) * 18),
        Math.round(4 + Math.abs(Math.sin(t + 1.4)) * 26),
        Math.round(4 + Math.abs(Math.sin(t + 2.1)) * 18),
        Math.round(4 + Math.abs(Math.sin(t + 2.8)) * 22),
      ]);
      animRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const stopBarAnim = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
    setBars([4, 4, 4, 4, 4]);
  }, []);

  // ─── Text-to-Speech with female voice ──────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const clean = text
      .replace(/[*_#`~^|\\]/g, "")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\n+/g, ". ")
      .replace(/\s{2,}/g, " ")
      .trim();

    const say = () => {
      const utt = new SpeechSynthesisUtterance(clean);
      utt.lang = "en-US";
      utt.rate = 0.9;
      utt.pitch = 1.1;
      utt.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      // Priority: natural female voices
      const pick = voices.find(v =>
        v.name === "Samantha" ||
        v.name === "Karen" ||
        v.name === "Victoria" ||
        v.name === "Moira" ||
        v.name.includes("Google UK English Female") ||
        v.name.includes("Microsoft Zira") ||
        v.name.includes("Microsoft Jenny") ||
        (v.lang.startsWith("en") && v.name.toLowerCase().includes("female"))
      ) ?? voices.find(v => v.lang.startsWith("en"));

      if (pick) utt.voice = pick;

      utt.onstart = () => setIsSpeaking(true);
      utt.onend = () => setIsSpeaking(false);
      utt.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utt);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener("voiceschanged", say, { once: true });
    } else {
      say();
    }
  }, [voiceEnabled]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  // ─── Send message to AI ─────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chatMutation.isPending) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const history = messagesRef.current;
    const updated = [...history, userMsg];
    setMessages(updated);
    setInput("");

    try {
      const res = await chatMutation.mutateAsync({
        data: {
          message: trimmed,
          history: history.slice(-6).map(m => ({ role: m.role, content: m.content })),
        },
      });
      const reply = (res as { reply: string }).reply;
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      speak(reply);
    } catch {
      const err = "I'm having a moment. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: err }]);
      speak(err);
    }
  }, [chatMutation, speak]);

  // ─── Voice recognition ──────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setInput(prev => prev); // keep whatever was typed/transcribed
    stopBarAnim();
  }, [stopBarAnim]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input requires Chrome or Edge browser. Please switch browsers.");
      return;
    }

    if (isSpeaking) stopSpeaking();
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false; // auto-stops when you pause speaking

    let finalTranscript = "";

    rec.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setInput("");
      finalTranscript = "";
      startBarAnim();
    };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      // Show live transcript in input box
      setInput(finalTranscript + interim);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "not-allowed") {
        alert("Microphone access denied. Please allow microphone in your browser settings and try again.");
      }
      isListeningRef.current = false;
      setIsListening(false);
      stopBarAnim();
      recognitionRef.current = null;
    };

    rec.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      stopBarAnim();
      recognitionRef.current = null;

      const captured = finalTranscript.trim();
      if (captured) {
        setInput(captured); // show final text in input box
        // Small delay so user sees what was captured before sending
        setTimeout(() => sendMessage(captured), 300);
      }
    };

    recognitionRef.current = rec;
    rec.start();
  }, [isSpeaking, stopSpeaking, startBarAnim, stopBarAnim, sendMessage]);

  const hasSpeech = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const statusText = isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Beauty Advisor";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-[350px] bg-white border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden"
            style={{ height: 520 }}
          >
            {/* ── Header ── */}
            <div className="bg-gradient-to-r from-primary to-accent px-4 py-3.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center font-serif text-white text-sm">L</div>
                <div>
                  <p className="font-serif text-white text-base leading-tight">Lumiere</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-red-300 animate-ping" : isSpeaking ? "bg-blue-300 animate-pulse" : "bg-green-300"}`} />
                    <p className="text-white/85 text-[10px] font-sans tracking-wide">{statusText}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setVoiceEnabled(v => !v); if (isSpeaking) stopSpeaking(); }}
                  className="text-white/80 hover:text-white transition-colors p-1"
                  title={voiceEnabled ? "Mute AI voice" : "Unmute AI voice"}
                >
                  {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>
                <button
                  onClick={() => { setOpen(false); if (isListening) stopListening(); if (isSpeaking) stopSpeaking(); }}
                  className="text-white/80 hover:text-white transition-colors p-1"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 text-[10px] font-serif text-primary">L</div>
                  )}
                  <div className={`max-w-[82%] text-sm px-3.5 py-2.5 leading-relaxed font-sans rounded-2xl ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-white border border-border text-foreground rounded-bl-sm shadow-sm"
                  }`}>
                    {m.content}
                  </div>
                </motion.div>
              ))}

              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center mr-2 text-[10px] font-serif text-primary">L</div>
                  <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center">
                      {[0, 0.15, 0.3].map(d => (
                        <motion.div key={d} animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 0.7, delay: d }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* ── Voice visualizer (shown while listening) ── */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 48, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex-shrink-0 bg-primary/5 border-t border-primary/10 flex items-center justify-center gap-1.5 px-5 overflow-hidden"
                >
                  <div className="flex items-end gap-1 h-8 flex-1">
                    {bars.map((h, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: h }}
                        transition={{ duration: 0.07 }}
                        className="flex-1 bg-primary rounded-sm"
                        style={{ minHeight: 3 }}
                      />
                    ))}
                  </div>
                  <p className="text-primary text-xs font-sans ml-3 flex-shrink-0">Listening... speak now</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Input row ── */}
            <div className="border-t border-border p-3 bg-white flex gap-2 items-end flex-shrink-0">
              <textarea
                value={input}
                onChange={e => !isListening && setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isListening && input.trim()) sendMessage(input);
                  }
                }}
                placeholder={isListening ? "Listening... speak your question" : "Type or tap mic to speak..."}
                rows={1}
                readOnly={isListening}
                className="flex-1 bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans resize-none leading-relaxed"
                style={{ minHeight: 40, maxHeight: 100 }}
              />

              {hasSpeech && (
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={isListening ? stopListening : startListening}
                  className={`relative p-2.5 rounded-xl transition-all flex-shrink-0 ${
                    isListening ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:bg-accent/30 hover:text-primary"
                  }`}
                  title={isListening ? "Stop (will auto-send)" : "Tap to speak"}
                >
                  {isListening && (
                    <motion.span
                      className="absolute inset-0 rounded-xl bg-red-400 opacity-60"
                      animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    />
                  )}
                  <Mic size={16} className="relative z-10" />
                </motion.button>
              )}

              <button
                onClick={() => { if (!isListening && input.trim()) sendMessage(input); }}
                disabled={chatMutation.isPending || isListening || !input.trim()}
                className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-35 shadow flex-shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating button ── */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow rounded-full"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="c" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={20} />
            </motion.div>
          ) : (
            <motion.div key="o" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle size={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
