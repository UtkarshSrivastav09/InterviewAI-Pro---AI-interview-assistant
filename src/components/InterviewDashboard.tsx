import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Brain,
  MonitorOff,
  Monitor,
  Minimize2,
  Maximize2,
  ArrowLeft,
  Clock,
  Trash2,
  Download,
  Volume2,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Send,
  Zap,
  Square,
  Play,
  X,
  CheckCircle,
  Key,
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
  apiKey: '',
  aiModel: 'gemini',
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
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [stealthMode, setStealthMode] = useState(false);
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
  const [activeTab, setActiveTab] = useState<'live' | 'practice'>('live');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const questionsEndRef = useRef<HTMLDivElement>(null);
  const { isScreenSharing, setIsScreenSharing } = useScreenShareDetection();
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

  // Auto scroll
  useEffect(() => {
    questionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.questions]);

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

  // Stealth mode - show minimal overlay
  if (stealthMode && !isScreenSharing) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="glass rounded-2xl p-3 shadow-2xl shadow-black/50"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => isListening ? stopListening() : startListening()}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-primary-600 hover:bg-primary-500'
              }`}
            >
              {isListening ? (
                <Square className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" />
              )}
            </button>
            <div className="text-xs">
              <p className="text-white font-semibold">{isListening ? 'Listening...' : 'Paused'}</p>
              <p className="text-surface-500">{session.questions.length} answers</p>
            </div>
            <button
              onClick={() => setStealthMode(false)}
              className="p-1.5 hover:bg-surface-700/50 rounded-lg"
            >
              <Maximize2 className="w-4 h-4 text-surface-500" />
            </button>
          </div>
          
          {(interimTranscript || transcript) && isListening && (
            <div className="mt-2 pt-2 border-t border-surface-700/50 max-w-xs">
              <p className="text-xs text-surface-400 truncate">
                {interimTranscript || transcript}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Hidden during screen share
  if (isScreenSharing) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
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
      <header className="glass border-b border-surface-700/30 px-4 py-3 flex items-center gap-4 sticky top-0 z-40">
        <button
          onClick={onBack}
          className="p-2 hover:bg-surface-700/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-surface-400" />
        </button>

        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary-400" />
          <span className="font-bold text-white hidden sm:inline">InterviewAI Pro</span>
        </div>

        {/* API Status */}
        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${
          settings.apiKey ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${settings.apiKey ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {settings.apiKey 
            ? (settings.aiModel === 'groq' ? '⚡ Groq' : settings.aiModel === 'gemini' ? '🌟 Gemini' : settings.aiModel === 'cohere' ? '🔮 Cohere' : '✓ AI')
            : '📚 Built-in'}
        </div>

        <div className="flex-1" />

        {/* Timer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800/50 text-surface-300 text-sm font-mono">
          <Clock className="w-3.5 h-3.5 text-primary-400" />
          {formatDuration(elapsedTime)}
        </div>

        {/* Question count */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800/50 text-surface-300 text-sm">
          <BookOpen className="w-3.5 h-3.5 text-primary-400" />
          <span>{session.questions.length} Q&A</span>
        </div>

        {/* Screen share toggle */}
        <button
          onClick={() => setIsScreenSharing(!isScreenSharing)}
          className={`p-2 rounded-lg transition-all ${
            isScreenSharing
              ? 'bg-red-500/20 text-red-400'
              : 'hover:bg-surface-700/50 text-surface-400'
          }`}
          title={isScreenSharing ? 'Screen share detected - App hidden' : 'Simulate screen share'}
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </button>

        {/* Stealth mode */}
        <button
          onClick={() => setStealthMode(true)}
          className="p-2 hover:bg-surface-700/50 rounded-lg transition-colors text-surface-400"
          title="Stealth mode"
        >
          <Minimize2 className="w-5 h-5" />
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 hover:bg-surface-700/50 rounded-lg transition-colors text-surface-400"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Panel - Controls & Live Feed */}
        <div className="lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-surface-700/30 flex flex-col">
          {/* Main Control Buttons */}
          <div className="p-6 border-b border-surface-700/30">
            <div className="space-y-4">
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
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  <span>Speech recognition not supported. Use Chrome or Edge.</span>
                </div>
              )}

              {speechError && (
                <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 px-3 py-2 rounded-lg">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  <span>{speechError}</span>
                </div>
              )}

              {/* Gemini API prompt */}
              {!settings.apiKey && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full py-2.5 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 text-primary-300 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Key className="w-4 h-4" />
                  Add Gemini API Key for Best Answers
                </button>
              )}
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

          {/* Manual Question Input */}
          <div className="p-4 border-b border-surface-700/30">
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-semibold text-surface-300">Type a Question</span>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualQuestion}
                onChange={e => setManualQuestion(e.target.value)}
                placeholder="Type or paste a question..."
                className="flex-1 bg-surface-800/50 border border-surface-600/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-surface-600 focus:outline-none focus:border-primary-500/50"
              />
              <button
                type="submit"
                disabled={!manualQuestion.trim() || isProcessing}
                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                <Zap className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Keyboard shortcuts */}
          <div className="p-4 border-b border-surface-700/30">
            <p className="text-xs text-surface-500 mb-2 font-semibold">Keyboard Shortcuts:</p>
            <div className="space-y-1 text-xs text-surface-500">
              <div><kbd className="px-1.5 py-0.5 bg-surface-800 rounded text-surface-400">Ctrl + Space</kbd> Toggle listening</div>
              <div><kbd className="px-1.5 py-0.5 bg-surface-800 rounded text-surface-400">Esc</kbd> Stop / Cancel</div>
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
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Tabs */}
          <div className="flex border-b border-surface-700/30 px-4">
            {[
              { id: 'live' as const, label: 'Live Q&A', icon: <Sparkles className="w-4 h-4" /> },
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
                {tab.id === 'live' && session.questions.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center">
                    {session.questions.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'live' && (
              <div className="p-4 space-y-4">
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
                  session.questions.map((q, i) => (
                    <AnswerCard
                      key={q.id}
                      item={q}
                      index={i}
                      isLatest={i === session.questions.length - 1}
                    />
                  ))
                )}
                <div ref={questionsEndRef} />
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

      {/* Processing indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
    </div>
  );
}
