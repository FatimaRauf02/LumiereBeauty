import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX, Square } from "lucide-react";
import { useSendChatMessage } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Lumiere, your beauty advisor. Ask me anything about skincare, hair care, or finding your perfect routine — by text or voice.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [bars, setBars] = useState<number[]>([4, 4, 4, 4, 4]);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const chatMutation = useSendChatMessage();
  const { toast } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isPendingRef = useRef(false);
  const messagesRef = useRef(messages);
  const sendMessageRef = useRef<(text: string) => void>(() => {});

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { isPendingRef.current = chatMutation.isPending; }, [chatMutation.isPending]);

  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages, open, isRecording, isTranscribing]);

  // ─── Real audio bar animation via AnalyserNode ───────────────────────────
  const startBarAnim = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const slice = [data[2], data[4], data[6], data[4], data[2]] as number[];
        setBars(slice.map(v => Math.max(4, Math.round(v / 5))));
        animRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // fallback: sine animation
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
    }
  }, []);

  const stopBarAnim = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    analyserRef.current = null;
    setBars([4, 4, 4, 4, 4]);
  }, []);

  // ─── Text-to-Speech ──────────────────────────────────────────────────────
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
      utt.rate = 0.92;
      utt.pitch = 1.1;
      utt.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const pick = voices.find(v =>
        v.name === "Samantha" || v.name === "Karen" || v.name === "Victoria" ||
        v.name.includes("Google UK English Female") ||
        v.name.includes("Microsoft Zira") || v.name.includes("Microsoft Jenny") ||
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

  // ─── Send message to AI ──────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (isPendingRef.current) {
      toast({ title: "Please wait", description: "Still thinking about your last question..." });
      return;
    }
    const userMsg: Message = { role: "user", content: trimmed };
    const history = messagesRef.current;
    setMessages(prev => [...prev, userMsg]);
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
      const errMsg = "I'm having a moment — please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: errMsg }]);
      speak(errMsg);
    }
  }, [chatMutation, speak, toast]);

  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  // ─── Stop recording ──────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    stopBarAnim();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setRecordSeconds(0);
  }, [stopBarAnim]);

  // ─── Start recording ─────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (isSpeaking) stopSpeaking();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = rec;
      audioChunksRef.current = [];

      rec.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      rec.onstop = async () => {
        const finalMime = mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: finalMime });

        if (blob.size < 1000) {
          toast({ title: "No audio captured", description: "Please hold the mic button and speak clearly." });
          return;
        }

        setIsTranscribing(true);
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(",")[1] ?? "");
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const response = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio: base64, mimeType: finalMime }),
          });

          if (!response.ok) throw new Error("Transcription request failed");
          const { transcript } = await response.json() as { transcript: string };

          if (transcript?.trim()) {
            setInput(transcript.trim());
            setTimeout(() => sendMessageRef.current(transcript.trim()), 200);
          } else {
            toast({ title: "Couldn't hear you", description: "Please try speaking again." });
          }
        } catch {
          toast({ title: "Transcription failed", description: "Please type your message instead." });
        } finally {
          setIsTranscribing(false);
        }
      };

      rec.start(250);
      setIsRecording(true);
      setRecordSeconds(0);
      startBarAnim(stream);

      // Auto-stop after 30s
      timerRef.current = setInterval(() => {
        setRecordSeconds(s => {
          if (s >= 29) {
            stopRecording();
            return 0;
          }
          return s + 1;
        });
      }, 1000);

    } catch (err: any) {
      const msg = err?.name === "NotAllowedError"
        ? "Microphone access denied. Please allow microphone in your browser settings."
        : err?.name === "NotFoundError"
        ? "No microphone found. Please connect a mic or type your question."
        : "Could not access microphone. Please type your question.";
      toast({ title: "Microphone error", description: msg });
    }
  }, [isSpeaking, stopSpeaking, startBarAnim, stopRecording, toast]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const statusText = isRecording
    ? `Listening… ${recordSeconds}s`
    : isTranscribing
    ? "Transcribing…"
    : isSpeaking
    ? "Speaking…"
    : "Beauty Advisor";

  const hasMediaDevices = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden"
            style={{
              width: "min(380px, calc(100vw - 24px))",
              height: "min(560px, calc(100dvh - 110px))",
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-accent px-4 py-3.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center font-serif text-white text-sm">L</div>
                <div>
                  <p className="font-serif text-white text-base leading-tight">Lumiere</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isRecording ? "bg-red-300 animate-ping" :
                      isTranscribing ? "bg-yellow-300 animate-pulse" :
                      isSpeaking ? "bg-blue-300 animate-pulse" :
                      "bg-green-300"
                    }`} />
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
                  onClick={() => {
                    setOpen(false);
                    if (isRecording) stopRecording();
                    if (isSpeaking) stopSpeaking();
                  }}
                  className="text-white/80 hover:text-white transition-colors p-1"
                >
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

            {/* Voice visualizer */}
            <AnimatePresence>
              {(isRecording || isTranscribing) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 52, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex-shrink-0 bg-primary/5 border-t border-primary/10 flex items-center justify-center gap-1.5 px-5 overflow-hidden"
                >
                  {isTranscribing ? (
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                      />
                      <p className="text-primary text-xs font-sans">Transcribing your voice…</p>
                    </div>
                  ) : (
                    <>
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
                      <p className="text-primary text-xs font-sans ml-3 flex-shrink-0">Speak now…</p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input row */}
            <div className="border-t border-border p-3 bg-white flex gap-2 items-end flex-shrink-0">
              <textarea
                value={input}
                onChange={e => { if (!isRecording) setInput(e.target.value); }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isRecording && input.trim()) sendMessage(input);
                  }
                }}
                placeholder={
                  isRecording ? "Listening… tap stop when done" :
                  isTranscribing ? "Transcribing…" :
                  "Type or tap the mic…"
                }
                rows={1}
                readOnly={isRecording || isTranscribing}
                className="flex-1 bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans resize-none leading-relaxed"
                style={{ minHeight: 40, maxHeight: 100 }}
              />

              {hasMediaDevices && (
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={toggleRecording}
                  disabled={isTranscribing}
                  className={`relative p-2.5 rounded-xl transition-all flex-shrink-0 disabled:opacity-40 ${
                    isRecording
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-accent/30 hover:text-primary"
                  }`}
                  title={isRecording ? "Stop recording" : "Tap to speak"}
                >
                  {isRecording && (
                    <motion.span
                      className="absolute inset-0 rounded-xl bg-red-400 opacity-60"
                      animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    />
                  )}
                  {isRecording ? <Square size={15} className="relative z-10" /> : <Mic size={16} className="relative z-10" />}
                </motion.button>
              )}

              <button
                onClick={() => { if (!isRecording && !isTranscribing && input.trim()) sendMessage(input); }}
                disabled={chatMutation.isPending || isRecording || isTranscribing || !input.trim()}
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
