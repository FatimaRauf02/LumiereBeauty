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
      content:
        "Hello! I'm Lumière, your personal beauty advisor ✨ How can I help you find your perfect skincare routine today? You can type or tap the mic to speak.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatMutation = useSendChatMessage();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.volume = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.name.toLowerCase().includes("female") ||
          v.name.toLowerCase().includes("samantha") ||
          v.name.toLowerCase().includes("victoria") ||
          v.name.toLowerCase().includes("karen") ||
          v.name.toLowerCase().includes("google uk english female")
      );
      if (preferred) utterance.voice = preferred;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      synthRef.current = utterance;
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
    if (!SR) return;
    if (recognitionRef.current) recognitionRef.current.abort();

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);

    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || chatMutation.isPending) return;
    const userMsg: Message = { role: "user", content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
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
      const err = "I'm having a moment — please try again.";
      setMessages([...newHistory, { role: "assistant", content: err }]);
      speak(err);
    }
  };

  const hasSpeechRecognition =
    typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

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
            style={{ height: 480 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-accent px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
                  <span className="text-white text-sm">✨</span>
                </div>
                <div>
                  <p className="font-serif text-white text-lg leading-tight">Lumière</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                    <p className="text-white/85 text-[10px] font-sans tracking-wide">
                      {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Beauty Advisor"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setVoiceEnabled((v) => !v);
                    if (isSpeaking) stopSpeaking();
                  }}
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
                    <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <span className="text-[10px]">✨</span>
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
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center mr-2">
                    <span className="text-[10px]">✨</span>
                  </div>
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
            <div className="border-t border-border p-3 bg-white flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={isListening ? "Listening..." : "Ask about skincare..."}
                  rows={1}
                  className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans resize-none leading-relaxed"
                  style={{ minHeight: 40, maxHeight: 100 }}
                />
              </div>
              {hasSpeechRecognition && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`p-2.5 rounded-xl transition-all ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse shadow-lg"
                      : "bg-muted text-muted-foreground hover:bg-accent/30 hover:text-primary"
                  }`}
                  title={isListening ? "Stop listening" : "Speak your question"}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              )}
              <button
                onClick={() => send()}
                disabled={chatMutation.isPending || !input.trim()}
                className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 shadow"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
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
