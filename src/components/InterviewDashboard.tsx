import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Brain,
  Clock,
  Trash2,
  Download,
  Volume2,
  AlertTriangle,
  Zap,
  BookOpen,
  Send,
  MessageSquare,
  Mic,
  Square,
  Play,
  X,
  CheckCircle,
  ArrowUp,
  Eye,
  EyeOff,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useScreenShareDetection } from '../hooks/useScreenShareDetection';
import { useAIResponse } from '../hooks/useAIResponse';
import SettingsPanel from './SettingsPanel';
import AnswerCard from './AnswerCard';
import Waveform from './Waveform';
import type { UserSettings, InterviewSession } from '../types';

interface InterviewDashboardProps {
  onBack: () => void;
}

const defaultSettings: UserSettings = {
  // Default to Gemini for the live site as it is more reliable (no CORS proxy needed)
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || 
          import.meta.env.VITE_GROQ_API_KEY || 
          '', // System Gemini Key (Add via .env)
  aiModel: import.meta.env.VITE_GEMINI_API_KEY ? 'gemini' : 
           (import.meta.env.VITE_GROQ_API_KEY) ? 'groq' : 'gemini',
  language: 'en-US',
  responseSpeed: 'balanced',
  stealthMode: false,
  autoListen: false,
  role: '',
  experience: 'mid',
  techStack: [],
};

export default function InterviewDashboard({ onBack }: InterviewDashboardProps) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('interviewai-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // If they saved an empty key, use the .env one instead
      const apiKey = parsed.apiKey || defaultSettings.apiKey;
      const aiModel = parsed.apiKey ? parsed.aiModel : defaultSettings.aiModel;
      return { ...defaultSettings, ...parsed, apiKey, aiModel };
    }
    return defaultSettings;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [stealthMode, setStealthMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'stealth';
  });
  const [session, setSession] = useState<InterviewSession>({
    id: Date.now().toString(),
    title: 'Interview Session',
    role: '',
    techStack: [],
    questions: [],
    startTime: new Date(),
    isActive: true,
  });
  const [manualQuestion, setManualQuestion] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'practice'>('live');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const questionsEndRef = useRef<HTMLDivElement>(null);
  const { isScreenSharing } = useScreenShareDetection();
  const { isProcessing, generateAnswer, cancelProcessing } = useAIResponse();

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('interviewai-settings', JSON.stringify(settings));
  }, [settings]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleQuestionDetected = useCallback(async (transcript: string) => {
    const q = transcript.trim();
    if (!q || q.length < 3) return;

    const tempId = 'q_' + Date.now();

    // 1. add placeholder card with spinner
    setSession(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: tempId,
          question: q,
          timestamp: new Date(),
          isProcessing: true,
        },
      ],
    }));

    showNotification('info', 'Analyzing question…');

    try {
      const result = await generateAnswer(q, {
        apiKey: settings.apiKey,
        aiModel: settings.aiModel,
        role: settings.role,
        experience: settings.experience,
        responseSpeed: settings.responseSpeed,
      });

      // 2. replace placeholder with finished answer
      setSession(prev => ({
        ...prev,
        questions: prev.questions.map(item =>
          item.id === tempId
            ? {
                id: tempId,
                question: q,
                timestamp: result.timestamp,
                answer: result.answer,
                category: result.category,
                confidence: result.confidence,
                isProcessing: false,
              }
            : item
        ),
      }));

      showNotification('success', 'Answer ready ✓');
      setActiveTab('live');
    } catch {
      setSession(prev => ({
        ...prev,
        questions: prev.questions.map(item =>
          item.id === tempId
            ? { ...item, isProcessing: false, answer: '❌ Failed to generate answer. Try again.' }
            : item
        ),
      }));
      showNotification('error', 'Failed to generate answer');
    }
  }, [generateAnswer, settings]);

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    isSupported,
    error: speechError,
  } = useSpeechRecognition(handleQuestionDetected);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to bottom when questions change (if in live tab)
  useEffect(() => {
    if (activeTab === 'live') {
      questionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session.questions, activeTab]);

  const scrollToTop = () => {
    // Desktop/Main container
    const mainContainer = contentRef.current || document.getElementById('dashboard-scroll-container');
    // Mobile container (from index.css override)
    const mobileContainer = document.getElementById('mobile-scroll-container');
    
    if (mainContainer) mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    if (mobileContainer) mobileContainer.scrollTo({ top: 0, behavior: 'smooth' });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.code === 'Space' && e.ctrlKey) {
        e.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }
      if (e.code === 'Escape') {
        if (isListening) stopListening();
        if (isProcessing) cancelProcessing();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, isProcessing, startListening, stopListening, cancelProcessing]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualQuestion.trim() && !isProcessing) {
      handleQuestionDetected(manualQuestion.trim());
      setManualQuestion('');
    }
  };

  const handleCancelListening = () => {
    stopListening();
    showNotification('info', 'Stopped listening');
  };

  const handleCancelProcessing = () => {
    cancelProcessing();
    // Remove the last processing question
    setSession(prev => ({
      ...prev,
      questions: prev.questions.filter(q => !q.isProcessing),
    }));
    showNotification('info', 'Cancelled processing');
  };

  const clearHistory = () => {
    setSession(prev => ({ ...prev, questions: [] }));
    showNotification('success', 'History cleared');
  };

  const exportSession = () => {
    const data = session.questions.map((q, i) => (
      `Q${i + 1}: ${q.question}\n\nA: ${q.answer || 'No answer'}\n\n---\n`
    )).join('\n');
    
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-session-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('success', 'Session exported!');
  };


  // Smart window resizing for stealth pop-out
  useEffect(() => {
    if (stealthMode) {
      const lastQuestion = session.questions[session.questions.length - 1];
      const hasActiveResult = lastQuestion && !lastQuestion.isProcessing;
      
      try {
        if (hasActiveResult) {
          // Expand to show answer
          window.resizeTo(window.outerWidth, 800);
        } else {
          // Shrink to thin bar
          window.resizeTo(window.outerWidth, 150);
        }
      } catch (e) {
        // resizeTo might be blocked or not a popup
      }
    }
  }, [session.questions, stealthMode]);

  const practiceQuestions = [
    "Tell me about yourself",
    "What are closures in JavaScript?",
    "Explain the event loop",
    "What is the virtual DOM in React?",
    "Describe a challenging project you worked on",
    "What's the difference between SQL and NoSQL?",
    "Explain RESTful API design principles",
    "How does prototypal inheritance work?",
    "What are React hooks and why were they introduced?",
    "Describe your approach to system design",
    "What is your greatest strength?",
    "How do you handle conflicts in a team?",
    "Explain TypeScript and its benefits",
    "What is Docker and why is it useful?",
    "How do you optimize web application performance?",
  ];

  // Stealth Bar Mode - Thin horizontal bar at the top
  if (stealthMode && !isScreenSharing) {
    const lastQuestion = session.questions[session.questions.length - 1];
    const isLatestProcessing = lastQuestion?.isProcessing;

    return (
      <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 w-full h-14 glass border-b border-white/5 flex items-center px-3 sm:px-6 gap-2 sm:gap-6 shadow-2xl backdrop-blur-3xl pointer-events-auto">
          <form onSubmit={handleManualSubmit} className="flex-1 flex gap-2 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                value={manualQuestion}
                onChange={e => setManualQuestion(e.target.value)}
                placeholder="Ask anything..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-2 text-xs sm:text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary-500/50 transition-all shadow-inner"
              />
              {isLatestProcessing && (
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!manualQuestion.trim() || isProcessing}
              className="p-2 sm:p-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-30 text-white rounded-xl transition-all shadow-lg shadow-primary-600/20"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => isListening ? stopListening() : startListening()}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                isListening ? 'bg-red-500 shadow-red-500/20' : 'bg-surface-800 hover:bg-surface-700 shadow-black/20'
              }`}
            >
              {isListening ? <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
            </button>
          </div>
        </div>

        {/* Half-Screen Center Panel for Result (Webcam Alignment) */}
        <AnimatePresence>
          {lastQuestion && !isLatestProcessing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-14 left-1/2 -translate-x-1/2 w-full sm:w-[600px] max-w-[98vw] pointer-events-auto"
            >
              <div className="bg-surface-950/98 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-b-3xl flex flex-col overflow-hidden max-h-[70vh]">
                <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-primary-600/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Live Eye-Contact Mode</span>
                  </div>
                  <button 
                    onClick={() => setSession(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== lastQuestion.id) }))} 
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-white/40 hover:text-white" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-primary-400 mb-1 uppercase opacity-50 tracking-widest text-center">Detected Question</p>
                    <p className="text-sm text-white/80 font-medium leading-relaxed text-center italic">"{lastQuestion.question}"</p>
                  </div>
                  <div className="w-1/4 h-px bg-primary-500/20 mx-auto mb-6" />
                  <div>
                    <AnswerCard item={lastQuestion} index={session.questions.length - 1} isLatest={true} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Simple transcript line */}
        {isListening && (interimTranscript || transcript) && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 px-6 py-2 bg-primary-600/10 backdrop-blur-md rounded-b-2xl border-x border-b border-primary-500/20 max-w-xl w-full">
            <p className="text-xs text-primary-300 truncate text-center font-medium italic">
              {interimTranscript || transcript}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Hidden during screen share
  if (isScreenSharing) {
    return null;
  }

  const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
  const buildHasKeys = !!(import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GROQ_API_KEY);
  const isUsingPlaceholder = settings.apiKey === 'AIzaSyAbcgpDCJ2YFknf7zyhEXJb8CQ0T68IiPs' || settings.apiKey === '' || !settings.apiKey;
  const hasNoRealKey = isUsingPlaceholder;

  const handleReset = () => {
    localStorage.removeItem('interviewai-settings');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col relative pb-20 lg:pb-0">
      {/* Scroll to Top Button - ALWAYS VISIBLE - Mobile Optimized */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] p-3 sm:p-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl shadow-2xl shadow-primary-600/40 border border-white/20 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
        title="Scroll to top"
      >
        <ArrowUp className="w-6 h-6" />
      </button>
      {/* Production Setup Warning */}
      {isProduction && hasNoRealKey && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-200 font-medium">
            <strong className="text-amber-400">Setup Required:</strong> 
            {!buildHasKeys ? ' Vercel Keys Not Found. ' : ' AI limited. '}
            <button 
              onClick={() => setShowSettings(true)}
              className="mx-1.5 underline underline-offset-2 hover:text-white transition-colors"
            >
              Add Key
            </button> 
            or 
            <button 
              onClick={handleReset}
              className="mx-1.5 underline underline-offset-2 hover:text-white transition-colors"
            >
              Reset & Sync
            </button>
          </p>
        </div>
      )}

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg ${
              notification.type === 'success' ? 'bg-green-500/90 text-white' :
              notification.type === 'error' ? 'bg-red-500/90 text-white' :
              'bg-primary-500/90 text-white'
            }`}>
              {notification.type === 'success' && <CheckCircle className="w-4 h-4" />}
              {notification.type === 'error' && <AlertTriangle className="w-4 h-4" />}
              {notification.type === 'info' && <Brain className="w-4 h-4" />}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            settings={settings}
            onSave={setSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <header className="glass border-b border-surface-700/30 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 z-50 sticky top-0 backdrop-blur-xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2">
              InterviewAI <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-500/30">PRO</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-surface-400">Co-Pilot Active • {session.role || 'General Interview'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onBack}
            className="p-2 sm:p-2.5 bg-surface-800 border border-surface-700 text-surface-400 hover:border-primary-500/50 hover:text-primary-400 rounded-lg sm:rounded-xl transition-all"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] uppercase text-surface-500 font-bold tracking-widest">Session Time</span>
            <span className="text-sm font-mono text-white">{formatDuration(elapsedTime)}</span>
          </div>

          <div className={`hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${
            settings.apiKey ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${settings.apiKey ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="hidden sm:inline">
              {settings.apiKey 
                ? (settings.aiModel === 'groq' ? '⚡ Groq' : settings.aiModel === 'gemini' ? '🌟 Gemini' : '✓ AI')
                : '📚 Local'}
            </span>
          </div>

          <button
            onClick={() => setStealthMode(!stealthMode)}
            className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl border transition-all ${
              stealthMode 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/20' 
                : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-primary-500/50 hover:text-primary-400'
            }`}
            title={stealthMode ? "Disable Stealth Mode" : "Enable Stealth Mode"}
          >
            {stealthMode ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 sm:p-2.5 bg-surface-800 border border-surface-700 text-surface-400 hover:border-primary-500/50 hover:text-primary-400 rounded-lg sm:rounded-xl transition-all"
            title="Settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all"
          >
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">End Session</span>
          </button>
        </div>
      </header>

      <div id="mobile-scroll-container" className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Panel - Controls & Live Feed - Scrollable on mobile, fixed on desktop */}
        <div className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-surface-700/30 flex flex-col bg-surface-950/50 backdrop-blur-md z-10 overflow-y-auto lg:overflow-visible shrink-0 max-h-[40vh] lg:max-h-none">
          {/* Main Control Buttons */}
          <div className="p-4 border-b border-surface-700/30">
            <div className="space-y-3">
              {/* START / STOP Button */}
              {!isListening ? (
                <button
                  onClick={startListening}
                  disabled={!isSupported}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-600/20 hover:shadow-green-500/30"
                >
                  <Play className="w-6 h-6" />
                  START LISTENING
                </button>
              ) : (
                <button
                  onClick={handleCancelListening}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-red-600/20 hover:shadow-red-500/30 animate-pulse"
                >
                  <Square className="w-6 h-6" />
                  STOP LISTENING
                </button>
              )}

              {/* Cancel Processing Button */}
              {isProcessing && (
                <button
                  onClick={handleCancelProcessing}
                  className="w-full py-3 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all border border-surface-600/50"
                >
                  <X className="w-5 h-5" />
                  Cancel Processing
                </button>
              )}

              {/* Status indicators */}
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className={`flex items-center gap-1.5 ${isListening ? 'text-green-400' : 'text-surface-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-400 animate-pulse' : 'bg-surface-600'}`} />
                  {isListening ? 'Listening' : 'Idle'}
                </div>
                <div className={`flex items-center gap-1.5 ${isProcessing ? 'text-primary-400' : 'text-surface-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-primary-400 animate-pulse' : 'bg-surface-600'}`} />
                  {isProcessing ? 'Processing' : 'Ready'}
                </div>
              </div>

              {!isSupported && (
                <div className="flex flex-col gap-2 text-xs text-red-400 bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-bold">Speech Not Supported</span>
                  </div>
                  <p className="opacity-80">
                    Your browser doesn't support live voice detection. 
                    <br />• <strong>iOS:</strong> Use Safari.
                    <br />• <strong>Android:</strong> Use Chrome.
                    <br />• <strong>Desktop:</strong> Use Chrome or Edge.
                  </p>
                </div>
              )}

              {speechError && (
                <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 px-3 py-2 rounded-lg">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  <span>{speechError}</span>
                </div>
              )}

              {/* Gemini API prompt */}
            </div>

            {/* Waveform */}
            <div className="mt-4 flex justify-center">
              <Waveform isActive={isListening} barCount={30} height={32} />
            </div>
          </div>

          {/* Live Transcript */}
          <div className="p-4 border-b border-surface-700/30">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-semibold text-surface-300">Live Transcript</span>
              {isListening && (
                <span className="flex items-center gap-1 ml-auto">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs text-red-400">LIVE</span>
                </span>
              )}
            </div>
            <div className="glass-light rounded-xl p-3 min-h-[60px] max-h-[100px] overflow-y-auto">
              {interimTranscript || transcript ? (
                <p className="text-sm text-surface-300 leading-relaxed">
                  {transcript && <span className="text-white">{transcript} </span>}
                  {interimTranscript && <span className="text-surface-500 italic">{interimTranscript}</span>}
                </p>
              ) : (
                <p className="text-xs text-surface-600 italic">
                  {isListening ? 'Waiting for speech...' : 'Click "Start Listening" to begin'}
                </p>
              )}
            </div>
          </div>

          {/* Manual Question Input - DESKTOP ONLY */}
          <div className="hidden lg:block p-4 border-b border-surface-700/30">
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-semibold text-surface-300">Type a Question</span>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualQuestion}
                onChange={e => setManualQuestion(e.target.value)}
                placeholder="Ask AI anything..."
                className="flex-1 bg-surface-800/50 border border-surface-600/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-surface-600 focus:outline-none focus:border-primary-500/50 transition-all"
              />
              <button
                type="submit"
                disabled={!manualQuestion.trim() || isProcessing}
                className="p-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all"
              >
                <Zap className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Keyboard shortcuts */}
          <div className="p-4 border-b border-surface-700/30 hidden lg:block">
            <p className="text-xs text-surface-500 mb-2 font-semibold">Keyboard Shortcuts:</p>
            <div className="space-y-3 text-xs text-surface-500">
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-surface-800 rounded-md text-surface-400 font-mono border border-surface-700">Ctrl + Space</kbd>
                <span>Toggle listening</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-surface-800 rounded-md text-surface-400 font-mono border border-surface-700">Esc</kbd>
                <span>Stop / Cancel</span>
              </div>
            </div>
          </div>

          {/* Session Actions */}
          <div className="p-4 mt-auto space-y-2">
            <button
              onClick={exportSession}
              disabled={session.questions.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-surface-400 hover:text-white bg-surface-800/50 hover:bg-surface-700/50 rounded-xl transition-all disabled:opacity-30"
            >
              <Download className="w-4 h-4" />
              Export Session
            </button>
            <button
              onClick={clearHistory}
              disabled={session.questions.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-red-400/70 hover:text-red-400 bg-surface-800/50 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-30"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </button>
            <div className="pt-2 text-center">
              <p className="text-[10px] text-surface-600 font-medium tracking-widest uppercase">
                Created by <span className="text-primary-500/50">Utkarsh Srivastava</span>
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-surface-950">
          {/* Tabs */}
          <div className="flex border-b border-surface-700/30 px-4">
            {[
              { id: 'live' as const, label: 'Current Result', icon: <Zap className="w-4 h-4" /> },
              { id: 'history' as const, label: 'History', icon: <Clock className="w-4 h-4" /> },
              { id: 'practice' as const, label: 'Practice', icon: <BookOpen className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'text-primary-400 border-primary-500'
                    : 'text-surface-500 border-transparent hover:text-surface-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'history' && session.questions.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center">
                    {session.questions.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div 
            id="dashboard-scroll-container"
            ref={contentRef} 
            className="flex-1 overflow-y-auto relative"
          >
            {activeTab === 'live' && (
              <div className="p-3 space-y-3">
                {session.questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="w-20 h-20 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-6">
                      <Brain className="w-10 h-10 text-primary-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Ready for Your Interview</h3>
                    <p className="text-surface-400 max-w-md mb-6 leading-relaxed">
                      Click <strong className="text-green-400">"START LISTENING"</strong> to capture questions from your interview call, 
                      or type a question manually below.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <span className="text-surface-300">Voice Detection Ready</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm">
                        <div className={`w-2 h-2 rounded-full ${settings.apiKey ? 'bg-green-400' : 'bg-yellow-400'}`} />
                        <span className="text-surface-300">{settings.apiKey ? 'Gemini AI Active' : 'Built-in AI Active'}</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <span className="text-surface-300">Screen Share Safe</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {session.questions.map((q, idx) => (
                      <AnswerCard
                        key={q.id}
                        item={q}
                        index={idx}
                        isLatest={idx === session.questions.length - 1}
                      />
                    ))}
                  </div>
                )}
                <div ref={questionsEndRef} />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="p-4 space-y-4">
                {session.questions.length === 0 ? (
                  <div className="text-center py-20 text-surface-500 italic">No history yet.</div>
                ) : (
                  [...session.questions].reverse().map((q, i) => (
                    <AnswerCard
                      key={q.id}
                      item={q}
                      index={session.questions.length - 1 - i}
                      isLatest={false}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'practice' && (
              <div className="p-4">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-2">Practice Questions</h3>
                  <p className="text-sm text-surface-400">
                    Click any question to see the AI-generated answer. Great for interview preparation!
                  </p>
                </div>

                <div className="grid gap-3">
                  {practiceQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        handleQuestionDetected(q);
                        setActiveTab('live');
                      }}
                      disabled={isProcessing}
                      className="glass rounded-xl p-4 text-left hover:border-primary-500/30 transition-all group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400 text-sm font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <span className="text-surface-300 group-hover:text-white transition-colors text-sm">
                          {q}
                        </span>
                        <Zap className="w-4 h-4 text-surface-600 group-hover:text-primary-400 transition-colors ml-auto flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Input Bar - MOBILE ONLY FIXED */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full glass border-t border-surface-700/30 p-3 pb-safe backdrop-blur-xl z-[9998]">
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualQuestion}
            onChange={e => setManualQuestion(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-primary-500/50"
          />
          <button
            type="submit"
            disabled={!manualQuestion.trim() || isProcessing}
            className="w-11 h-11 flex items-center justify-center bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-600/20 shrink-0 active:scale-95 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Processing indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: -80 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="glass rounded-full px-6 py-3 flex items-center gap-3 shadow-2xl shadow-black/50">
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-white font-medium">
                {settings.apiKey 
                  ? (settings.aiModel === 'groq' ? '⚡ Asking Groq...' : settings.aiModel === 'gemini' ? '🌟 Asking Gemini...' : settings.aiModel === 'cohere' ? '🔮 Asking Cohere...' : 'Generating...')
                  : '📚 Searching knowledge base...'}
              </span>
              <button
                onClick={handleCancelProcessing}
                className="ml-2 p-1 hover:bg-surface-700/50 rounded-full text-surface-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to Top Button */}
    </div>
  );
}
