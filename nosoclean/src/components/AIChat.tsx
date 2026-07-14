import React, { useState, useRef, useEffect } from 'react';
import { Article, Message } from '../types';
import { streamAssistantReply } from '../lib/chatApi';
import { Mic, Plus, Send, Sparkles, X, Trash2, Pause } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  article: Article | null;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const AIChat: React.FC<Props> = ({
  article,
  isOpen,
  onOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: `Bonjour, je suis Nosoclean AI, votre assistant expert en hygiene professionnelle. Je vous aide a definir des protocoles conformes, evaluer les risques de contamination et recommander des solutions adaptees a votre secteur. Indiquez votre contexte (secteur, type de surface ou equipement, et objectif), et je vous propose un plan d'action clair.`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [preRecordingInput, setPreRecordingInput] = useState('');
  const [volumeLevels, setVolumeLevels] = useState<number[]>(Array(28).fill(0));
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
    }
  }, [isOpen]);

  const startTimer = () => {
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingSeconds(0);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const sendMessage = async (rawInput: string) => {
    const userInput = rawInput.trim();
    if (!userInput || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userInput,
      timestamp: Date.now()
    };

    const assistantDraftId = (Date.now() + 1).toString();
    const assistantDraft: Message = {
      id: assistantDraftId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(prev => [...prev, userMsg, assistantDraft]);
    setInput('');
    inputRef.current?.blur();
    setIsLoading(true);

    try {
      const response = await streamAssistantReply(
        { article, history: nextHistory, question: userInput },
        (token) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantDraftId
                ? { ...msg, text: msg.text + token }
                : msg
            )
          );
        }
      );
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantDraftId ? { ...msg, text: response } : msg
        )
      );
    } catch (error) {
      console.error(error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantDraftId
            ? { ...msg, text: "Je rencontre un probleme technique. Reessayez dans quelques secondes." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    await sendMessage(input);
  };

  const startVolumeAnalysis = async () => {
    try {
      if (!audioContextRef.current) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current!.createMediaStreamSource(stream);
      const analyzer = audioContextRef.current!.createAnalyser();
      analyzer.fftSize = 256;
      analyzerRef.current = analyzer;
      source.connect(analyzer);

      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      const updateVolume = () => {
        analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolumeLevels((prev) => {
          const newLevels = [...prev.slice(1)];
          newLevels.push(Math.min(100, (average / 255) * 100));
          return newLevels;
        });
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (error) {
      console.error('Erreur accès au microphone:', error);
    }
  };

  const stopVolumeAnalysis = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyzerRef.current = null;
    setVolumeLevels(Array(28).fill(0));
  };

  const handleMicrophone = async () => {
    const RecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionAPI) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'model',
        text: "La saisie vocale n'est pas supportée sur ce navigateur. Utilisez Chrome ou Edge récents.",
        timestamp: Date.now(),
      }]);
      return;
    }



    const recognition = new RecognitionAPI();
    recognition.lang = 'fr-FR';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setPreRecordingInput(input);
      startVolumeAnalysis();
      startTimer();
    };
    recognition.onend = () => {
      setIsRecording(false);
      stopVolumeAnalysis();
      stopTimer();
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsRecording(false);
      stopVolumeAnalysis();
      stopTimer();
      const errors: Record<string, string> = {
        'no-speech': "Aucune parole détectée. Veuillez réessayer.",
        'audio-capture': "Aucun microphone détecté. Vérifiez vos paramètres audio.",
        'not-allowed': "Accès au microphone refusé. Autorisez l'accès dans les paramètres du navigateur.",
        'network': "Erreur réseau lors de la reconnaissance vocale.",
      };
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'model',
        text: errors[event.error] || "Erreur de reconnaissance vocale.",
        timestamp: Date.now(),
      }]);
    };
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript || '';
        currentTranscript += (currentTranscript && !transcript.startsWith(' ') ? ' ' : '') + transcript;
      }
      setInput(preRecordingInput + (preRecordingInput && currentTranscript ? ' ' : '') + currentTranscript.trim());
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setIsRecording(false);
      stopVolumeAnalysis();
      stopTimer();
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'model',
        text: "Impossible de démarrer la reconnaissance vocale. Vérifiez les permissions du microphone.",
        timestamp: Date.now(),
      }]);
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const handleDeleteRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setInput('');
  };

  const expandedGlassStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 32px rgba(0,0,0,0.12)',
  };

  const collapsedGlassStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.55)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.45)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
  };

  const handleOpen = () => { if (!isOpen) onOpen(); };
  const handleToggle = () => { if (isOpen) onClose(); else onOpen(); };

  return (
    <div
      className="fixed inset-0 h-[100dvh] pointer-events-none z-[70] flex flex-col justify-end px-4 md:px-0 md:items-center pb-4"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)'
      }}
    >
      <style>{`
        @keyframes rec-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @keyframes typing-pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div
        className={`relative overflow-hidden w-full pointer-events-auto max-w-5xl ${
          isOpen ? 'is-open h-[85vh] rounded-[24px]' : 'h-[60px] rounded-[999px]'
        }`}
        style={{
          transformOrigin: 'bottom center',
          transition: 'height 0.38s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
          ...(isOpen ? expandedGlassStyle : collapsedGlassStyle),
        }}
      >
        {/* ── Chat area ── */}
        <div
          className="flex flex-col h-[calc(100%-84px)]"
          style={{
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'opacity 0.2s ease 0.1s',
          }}
        >
          {/* Header */}
          <div className="px-5 py-4 flex justify-between items-center text-stone-ink/90 border-b border-white/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cobalt-primary" />
              <span className="font-headline italic text-lg">Nosoclean AI</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="overflow-y-auto px-4 py-5 space-y-3 no-scrollbar flex-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
              >
                {msg.role === 'model' && (
                  <div className="hidden md:flex w-7 h-7 rounded-full bg-cobalt-primary/15 items-center justify-center flex-shrink-0 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-cobalt-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-white rounded-[18px_18px_4px_18px]'
                      : 'text-stone-ink rounded-[18px_18px_18px_4px]'
                  }`}
                  style={
                    msg.role === 'user'
                      ? { background: '#056A2E' }
                      : {
                          background: 'rgba(255,255,255,0.72)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255,255,255,0.5)',
                        }
                  }
                >
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start items-end gap-2">
                <div className="hidden md:flex w-7 h-7 rounded-full bg-cobalt-primary/15 items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-cobalt-primary" />
                </div>
                <div
                  className="px-4 py-3 rounded-[18px_18px_18px_4px] flex gap-1.5 items-center"
                  style={{
                    background: 'rgba(255,255,255,0.72)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.5)',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#09257d', animation: 'typing-pulse 1.4s infinite ease-in-out both', animationDelay: '-0.32s' }} />
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#09257d', animation: 'typing-pulse 1.4s infinite ease-in-out both', animationDelay: '-0.16s' }} />
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#09257d', animation: 'typing-pulse 1.4s infinite ease-in-out both', animationDelay: '0s' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className={`${isOpen ? 'absolute bottom-3 left-3 right-3' : 'h-full px-1.5'} flex items-center`}>


          {/* Input container */}
          <div
            className={`relative flex items-center w-full gap-1.5 ${isOpen ? 'rounded-[28px] px-2 py-1.5' : 'p-0'}`}
            style={
              isOpen
                ? {
                    background: 'rgba(255,255,255,0.65)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                  }
                : undefined
            }
          >

            {/* ══ Unified Input & Controls ══ */}
            {(isRecording || input) && (
              <button
                type="button"
                onClick={isRecording ? handleDeleteRecording : () => setInput('')}
                className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-stone-ink/40 hover:text-red-500 transition-colors"
                aria-label="Effacer le contenu"
              >
                <Trash2 className="w-[18px] h-[18px]" />
              </button>
            )}

            {!isRecording && isOpen && !input && (
              <button
                type="button"
                onClick={handleToggle}
                className="w-11 h-11 flex items-center justify-center text-stone-ink/50 hover:text-stone-ink transition-colors flex-shrink-0"
                aria-label="Fermer le chat"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <input
              ref={inputRef}
              value={input}
              onFocus={handleOpen}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? "Je vous écoute..." : "Posez votre question..."}
              className="flex-1 bg-transparent border-none focus:ring-0 text-stone-ink text-[16px] md:text-sm placeholder-stone-ink/40 px-2 py-2.5 outline-none font-body cursor-pointer min-w-0"
            />

            {isRecording && (
              <div className="flex items-center gap-1.5 flex-shrink-0 px-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#ef4444', animation: 'rec-pulse 1.2s ease-in-out infinite' }}
                />
                <span className="text-xs font-mono font-medium tabular-nums text-stone-ink/60 min-w-[2.2rem]">
                  {formatTime(recordingSeconds)}
                </span>
              </div>
            )}

            {!isRecording ? (
              <>
                <button
                  type="button"
                  onClick={handleMicrophone}
                  className="w-10 h-10 flex items-center justify-center text-stone-ink/50 hover:text-stone-ink transition-colors flex-shrink-0"
                  aria-label="Démarrer la dictée"
                >
                  <Mic className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!isOpen || isLoading || !input.trim()}
                  className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 transition-all disabled:opacity-30"
                  style={{ background: '#056A2E' }}
                  aria-label="Envoyer"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 bg-cobalt-primary/10"
                  aria-label="Arrêter"
                >
                  <Pause className="w-4 h-4 text-cobalt-primary" />
                </button>

                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 bg-cobalt-primary"
                  aria-label="Envoyer"
                >
                  <Send className="w-4 h-4 text-white" style={{ transform: 'translateX(1px)' }} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
