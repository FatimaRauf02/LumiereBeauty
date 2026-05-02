import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Mic, Volume2, VolumeX, Square } from "lucide-react";
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

const BARS = 5;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Lumiere, your beauty advisor. Tap the mic and speak — I'll listen and respond with voice, just like a voice assistant.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [interimText, setInterimText] = useState("");
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(BARS).fill(3));

  const bottomRef = useRef<HTMLDivElement>(null);
  const chatMutation = useSendChatMessage();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const finalTextRef = useRef("");
  const messagesRef = useRef<Message[]>(messages);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, isListening, interimText]);

  const cleanForSpeech = (text: string) =>
    text
      .replace(/[*_#`~^|\\]/g, "")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const cleaned = cleanForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      const applyVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(
          (v) =>
            v.name.toLowerCase().includes("samantha") ||
            v.name.toLowerCase().includes("victoria") ||
            v.name.toLowerCase().includes("karen") ||
            v.name.toLowerCase().includes("google uk english female") ||
            v.name.toLowerCase().includes("zira") ||
            (v.lang.startsWith("en") && v.name.toLowerCase().includes("female"))
        );
        if (preferred) utterance.voice = preferred;
      };

      applyVoice();
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener("voiceschanged", applyVoice, { once: true });
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled]
  );

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const stopAudioViz = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = null;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setAudioLevels(Array(BARS).fill(3));
  }, []);

  const startAudioViz = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 64;
      ctx.createMediaStreamSource(stream).connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const levels = Array.from({ length: BARS }, (_, i) => {
          const slice = Math.floor((data.length / BARS) * i);
          const val = data[slice] ?? 0;
          return Math.max(3, Math.round((val / 255) * 32));
        });
        setAudioLevels(levels);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // mic access denied — still show animation
      let t = 0;
      const tick = () => {
        t += 0.15;
        setAudioLevels(
          Array.from({ length: BARS }, (_, i) => 4 + Math.round(Math.abs(Math.sin(t + i * 0.6)) * 20))
        );
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || chatMutation.isPending) return;
      const userMsg: Message = { role: "user", content: trimmed };
      const history = messagesRef.current;
      const newHistory = [...history, userMsg];
      setMessages(newHistory);
      setInput("");
      setInterimText("");
      finalTextRef.current = "";
      try {
        const res = await chatMutation.mutateAsync({
          data: {
            message: trimmed,
            history: history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          },
        });
        const reply = (res as { reply: string }).reply;
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        speak(reply);
      } catch {
        const err = "I'm having a moment. Please try again shortly.";
        setMessages((prev) => [...prev, { role: "assistant", content: err }]);
        speak(err);
      }
    },
    [chatMutation, speak]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setInterimText("");
    stopAudioViz();
  }, [stopAudioViz]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input requires Chrome or Edge browser.");
      return;
    }

    if (isSpeaking) stopSpeaking();
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    finalTextRef.current = "";
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = true;

    rec.onstart = () => {
      setIsListening(true);
      setInterimText("");
      startAudioViz();
    };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTextRef.current += t + " ";
        } else {
          interim += t;
        }
      }
      setInterimText(finalTextRef.current + interim);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "not-allowed") {
        alert("Microphone access was denied. Please allow microphone access in your browser settings.");
      }
      stopListening();
    };

    rec.onend = () => {
      setIsListening(false);
      stopAudioViz();
      const captured = finalTextRef.current.trim();
      if (captured) {
        setInterimText("");
        sendMessage(captured);
      } else {
        setInterimText("");
      }
      recognitionRef.current = null;
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setIsListening(false);
    }
  }, [isSpeaking, startAudioViz, stopListening, sendMessage]);

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const hasSpeechRecognition =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const statusLabel = isListening
    ? "Listening..."
    : isSpeaking
    ? "Speaking..."
    : "Beauty Advisor";

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
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-accent px-4 py-3.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-sm font-serif text-white">L</div>
                <div>
                  <p className="font-serif text-white text-base leading-tight">Lumiere</p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isListening
                          ? "bg-red-300 animate-ping"
                          : isSpeaking
                          ? "bg-blue-300 animate-pulse"
                          : "bg-green-300"
                      }`}
                    />
                    <p className="text-white/85 text-[10px] font-sans tracking-wide">{statusLabel}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setVoiceEnabled((v) => !v); if (isSpeaking) stopSpeaking(); }}
                  className="text-white/80 hover:text-white transition-colors p-1"
                  title={voiceEnabled ? "Mute voice responses" : "Enable voice responses"}
                >
                  {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>
                <button onClick={() => { setOpen(false); if (isListening) stopListening(); }} className="text-white/80 hover:text-white transition-colors p-1">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Messages */}
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
                    <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 text-[10px] font-serif text-primary">
                      L
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] text-sm px-3.5 py-2.5 leading-relaxed font-sans rounded-2xl ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-white border border-border text-foreground rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}

              {/* Live voice transcript */}
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div className="max-w-[82%] text-sm px-3.5 py-2.5 bg-primary/15 text-primary rounded-2xl rounded-br-sm font-sans italic border border-primary/20">
                    {interimText || (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center mr-2 text-[10px] font-serif text-primary">L</div>
                  <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center">
                      {[0, 0.15, 0.3].map((d) => (
                        <motion.div
                          key={d}
                          animate={{ y: [-2, 2, -2] }}
                          transition={{ repeat: Infinity, duration: 0.7, delay: d }}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Voice visualizer bar — shown when listening */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 52, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 bg-primary/5 border-t border-primary/10 flex items-center justify-center gap-1.5 overflow-hidden px-4"
                >
                  <div className="flex items-center gap-1.5 flex-1">
                    {audioLevels.map((h, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: h }}
                        transition={{ duration: 0.08, ease: "linear" }}
                        className="bg-primary rounded-full flex-1"
                        style={{ minHeight: 3 }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={stopListening}
                    className="ml-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-sans px-3 py-1.5 rounded-full hover:bg-red-600 transition-colors flex-shrink-0"
                  >
                    <Square size={10} fill="white" />
                    Stop
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input row */}
            <div className="border-t border-border p-3 bg-white flex gap-2 items-end flex-shrink-0">
              <textarea
                value={isListening ? interimText : input}
                onChange={(e) => !isListening && setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isListening && input.trim()) sendMessage(input);
                  }
                }}
                placeholder={isListening ? "Listening to your voice..." : "Type or tap mic to speak..."}
                rows={1}
                readOnly={isListening}
                className="flex-1 bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans resize-none leading-relaxed"
                style={{ minHeight: 40, maxHeight: 100 }}
              />

              {hasSpeechRecognition && (
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={handleMicClick}
                  className={`relative p-2.5 rounded-xl transition-all flex-shrink-0 ${
                    isListening
                      ? "bg-red-500 text-white shadow-lg"
                      : "bg-muted text-muted-foreground hover:bg-accent/30 hover:text-primary"
                  }`}
                  title={isListening ? "Stop listening" : "Tap to speak"}
                >
                  {isListening && (
                    <motion.span
                      className="absolute inset-0 rounded-xl bg-red-400"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ repeat: Infinity, duration: 1.4 }}
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

      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow rounded-full"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={20} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle size={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
