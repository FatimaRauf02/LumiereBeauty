import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
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
      content: "Hello! I am Lumiere, your personal beauty advisor. How can I help you find your perfect skincare routine today? You can type or tap the microphone to speak.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [interimText, setInterimText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatMutation = useSendChatMessage();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, isListening]);

  const cleanForSpeech = (text: string) => {
    return text
      .replace(/[*_#`~^|\\]/g, "")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const cleaned = cleanForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 0.93;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(
          (v) =>
            v.name.toLowerCase().includes("samantha") ||
            v.name.toLowerCase().includes("victoria") ||
            v.name.toLowerCase().includes("karen") ||
            v.name.toLowerCase().includes("google uk english female") ||
            (v.name.toLowerCase().includes("female") && v.lang.startsWith("en"))
        );
        if (preferred) utterance.voice = preferred;
      };

      setVoice();
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener("voiceschanged", setVoice, { once: true });
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

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) {
      alert("Your browser does not support voice input. Please use Chrome or Edge.");
      return;
    }
    if (recognitionRef.current) recognitionRef.current.abort();

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onstart = () => {
      setIsListening(true);
      setInterimText("");
    };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      if (interim) setInterimText(interim);
      if (final) {
        setInterimText("");
        setInput(final.trim());
      }
    };

    rec.onerror = (e) => {
      setIsListening(false);
      setInterimText("");
      if (e.error === "not-allowed") {
        alert("Microphone access was denied. Please allow microphone permissions in your browser settings.");
      }
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimText("");
    };

    recognitionRef.current = rec;
    rec.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText("");
  }, []);

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || chatMutation.isPending) return;
    const userMsg: Message = { role: "user", content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setInterimText("");
    try {
      const res = await chatMutation.mutateAsync({
        data: {
          message: userMsg.content,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        },
      });
      const reply = (res as any).reply as string;
      setMessages([...newHistory, { role: "assistant", content: reply }]);
      speak(reply);
    } catch {
      const err = "I am having a moment. Please try again.";
      setMessages([...newHistory, { role: "assistant", content: err }]);
      speak(err);
    }
  }, [input, messages, chatMutation, speak]);

  useEffect(() => {
    if (input && !isListening && interimText === "") {
      const wasVoice = recognitionRef.current !== null;
      if (wasVoice) {
        send(input);
      }
    }
  }, [isListening]);

  const hasSpeechRecognition =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-[340px] bg-white border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden"
            style={{ height: 500 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-accent px-4 py-3.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-sm">L</div>
                <div>
                  <p className="font-serif text-white text-lg leading-tight">Lumiere</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-red-300 animate-ping" : isSpeaking ? "bg-blue-300 animate-pulse" : "bg-green-300"}`} />
                    <p className="text-white/85 text-[10px] font-sans tracking-wide">
                      {isListening ? "Listening to you..." : isSpeaking ? "Speaking..." : "Beauty Advisor"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setVoiceEnabled((v) => !v); if (isSpeaking) stopSpeaking(); }}
                  className="text-white/80 hover:text-white transition-colors p-1"
                  title={voiceEnabled ? "Mute voice" : "Enable voice"}
                >
                  {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>
                <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors p-1">
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
                  transition={{ duration: 0.25 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 text-[10px] font-serif text-primary">L</div>
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

              {/* Interim voice transcript */}
              {(isListening || interimText) && (
                <div className="flex justify-end">
                  <div className="max-w-[82%] text-sm px-3.5 py-2.5 bg-primary/20 text-primary rounded-2xl rounded-br-sm font-sans italic">
                    {interimText || "Listening..."}
                    <span className="inline-block w-1 h-3.5 bg-primary ml-1 animate-pulse align-middle" />
                  </div>
                </div>
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

            {/* Input */}
            <div className="border-t border-border p-3 bg-white flex gap-2 items-end flex-shrink-0">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={isListening ? "Listening to your voice..." : "Ask about skincare..."}
                rows={1}
                className="flex-1 bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans resize-none leading-relaxed"
                style={{ minHeight: 40, maxHeight: 100 }}
              />
              {hasSpeechRecognition && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={isListening ? stopListening : startListening}
                  className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                    isListening
                      ? "bg-red-500 text-white shadow-lg shadow-red-200"
                      : "bg-muted text-muted-foreground hover:bg-accent/30 hover:text-primary"
                  }`}
                  title={isListening ? "Stop listening" : "Speak your question"}
                >
                  <AnimatePresence mode="wait">
                    {isListening ? (
                      <motion.div key="stop" initial={{ scale: 0.8 }} animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                        <MicOff size={16} />
                      </motion.div>
                    ) : (
                      <motion.div key="start" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                        <Mic size={16} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}
              <button
                onClick={() => send()}
                disabled={chatMutation.isPending || (!input.trim() && !isListening)}
                className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 shadow flex-shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen(!open)}
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
