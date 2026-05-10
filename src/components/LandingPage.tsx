import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  Shield,
  Zap,
  Brain,
  MonitorOff,
  Clock,
  ChevronRight,
  Sparkles,
  Volume2,
  Eye,
  EyeOff,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  ArrowUp,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onNavigateToAbout: () => void;
}

export default function LandingPage({ onGetStarted, onNavigateToAbout }: LandingPageProps) {
  const [, setHoveredFeature] = useState<number | null>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const features = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: 'Real-Time Voice Detection',
      description: 'Instantly captures audio from Google Meet, Zoom, or any platform. Detects interviewer questions in real-time.',
      color: 'from-blue-500 to-cyan-400',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: '2-Second AI Response',
      description: 'Analyzes the question and generates a comprehensive, interview-ready answer within 2 seconds.',
      color: 'from-yellow-500 to-orange-400',
    },
    {
      icon: <MonitorOff className="w-6 h-6" />,
      title: 'Screen Share Safe',
      description: 'Automatically detects screen sharing and hides the interface. Your secret assistant stays invisible.',
      color: 'from-red-500 to-pink-400',
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'AI-Powered Answers',
      description: 'Built-in knowledge base covering DSA, System Design, React, Node.js, SQL, behavioral questions, and more.',
      color: 'from-purple-500 to-violet-400',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Stealth Mode',
      description: 'Compact overlay mode that sits on top of your meeting window. Toggle visibility with a hotkey.',
      color: 'from-green-500 to-emerald-400',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Session History',
      description: 'Records all questions and answers during your interview session for later review and preparation.',
      color: 'from-indigo-500 to-blue-400',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Open Your Meeting',
      description: 'Join your Google Meet, Zoom, or Teams interview call as usual.',
      icon: <Volume2 className="w-8 h-8" />,
    },
    {
      step: '02',
      title: 'Activate Listening',
      description: 'Click the mic button to start capturing audio. The AI listens to the interviewer.',
      icon: <Mic className="w-8 h-8" />,
    },
    {
      step: '03',
      title: 'Get Instant Answers',
      description: 'Within 2 seconds of detecting a question, get a detailed, well-structured answer.',
      icon: <MessageSquare className="w-8 h-8" />,
    },
    {
      step: '04',
      title: 'Stay Undetected',
      description: 'Screen share detection auto-hides the app. Use stealth mode for maximum safety.',
      icon: <EyeOff className="w-8 h-8" />,
    },
  ];

  const openPopout = () => {
    const width = window.screen.width;
    const height = 150;
    const left = 0;
    const top = 0;
    // We add a 'launch=true' param to tell the app to go straight to dashboard in stealth
    window.open(
      window.location.href + '?mode=stealth&launch=true',
      'InterviewAI-Stealth',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );
  };

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 sm:py-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-base sm:text-xl font-bold text-white tracking-tight">
            InterviewAI<span className="text-primary-400">Pro</span>
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-surface-400 text-sm">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#tech" className="hover:text-white transition-colors">Technology</a>
          <button onClick={() => onNavigateToAbout()} className="hover:text-white transition-colors">About</button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Mobile Only About Button */}
          <button 
            onClick={() => onNavigateToAbout()} 
            className="md:hidden text-xs sm:text-sm font-semibold text-surface-300 hover:text-white transition-colors px-2"
          >
            About
          </button>
          <button
            onClick={onGetStarted}
            className="px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary-600/20"
          >
            Launch <span className="hidden sm:inline">App</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center px-6 pt-16 pb-24"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm mb-8"
        >
          <Sparkles className="w-4 h-4" />
          AI-Powered Interview Assistant
          <Sparkles className="w-4 h-4" />
        </motion.div>

        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight max-w-5xl mx-auto mb-6">
          Ace Every Interview with{' '}
          <span className="gradient-text">AI-Powered</span>{' '}
          Real-Time Answers
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed px-4">
          Your invisible AI co-pilot for online interviews. Detects questions from your meeting audio,
          generates expert answers in 2 seconds, and stays completely hidden during screen sharing.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onGetStarted}
            className="group px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white rounded-2xl text-lg font-bold transition-all hover:shadow-xl hover:shadow-primary-600/30 flex items-center gap-3"
          >
            Start Interview Assistant
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={openPopout}
            className="group px-8 py-4 bg-surface-800/50 hover:bg-surface-700/50 border border-surface-700/50 text-white rounded-2xl text-lg font-bold transition-all flex items-center gap-3"
          >
            Launch Stealth Bar
            <ExternalLink className="w-5 h-5 text-primary-400" />
          </button>

          <div className="flex items-center gap-2 text-surface-400 text-sm">
            <Shield className="w-4 h-4 text-green-400" />
            100% Private • No Data Stored
          </div>
        </div>

        {/* Demo visualization */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-12 sm:mt-16 max-w-4xl mx-auto px-4 sm:px-0"
        >
          <div className="glass rounded-2xl p-4 sm:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-6">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
              <span className="text-surface-500 text-[10px] sm:text-sm ml-1 sm:ml-2">InterviewAI Pro — Live Session</span>
            </div>

            <div className="space-y-4">
              {/* Question */}
              <div className="flex gap-2 sm:gap-3 items-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                </div>
                <div className="glass-light rounded-xl p-3 sm:p-4 flex-1 text-left">
                  <p className="text-[10px] text-red-400 font-semibold mb-1 uppercase">Detected Question</p>
                  <p className="text-surface-200 text-sm sm:text-base">"Can you explain what closures are in JavaScript and give a practical example?"</p>
                </div>
              </div>

              {/* Answer */}
              <div className="flex gap-2 sm:gap-3 items-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400" />
                </div>
                <div className="glass-light rounded-xl p-3 sm:p-4 flex-1 text-left border border-primary-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[10px] text-primary-400 font-semibold uppercase">AI Answer</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 hidden xs:inline">95% confidence</span>
                  </div>
                  <p className="text-surface-200 text-xs sm:text-sm leading-relaxed">
                    A <strong>closure</strong> is a function that retains access to variables from its outer scope even after the outer function has returned...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 lg:px-12 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-surface-400 text-lg max-w-2xl mx-auto">
            Everything you need to confidently navigate any technical or behavioral interview.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              className="glass rounded-2xl p-6 hover:border-primary-500/30 transition-all duration-300 cursor-default group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-surface-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 px-6 lg:px-12 py-24 bg-surface-900/30">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-surface-400 text-lg">Four simple steps to interview success</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="relative mx-auto w-20 h-20 rounded-2xl glass flex items-center justify-center text-primary-400 mb-6">
                {step.icon}
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-lg bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                  {step.step}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-surface-400 text-sm leading-relaxed">{step.description}</p>
              {i < 3 && (
                <ChevronRight className="hidden lg:block w-6 h-6 text-surface-600 absolute right-0 top-1/2 -translate-y-1/2" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="relative z-10 px-6 lg:px-12 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Built With Modern Tech</h2>
          <p className="text-surface-400 text-lg">Full-stack MERN architecture with AI/ML integration</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { name: 'React', desc: 'Frontend UI', icon: '⚛️' },
            { name: 'Node.js', desc: 'Backend Runtime', icon: '🟢' },
            { name: 'MongoDB', desc: 'Database', icon: '🍃' },
            { name: 'Express', desc: 'API Server', icon: '🚀' },
            { name: 'Web Speech API', desc: 'Voice Recognition', icon: '🎤' },
            { name: 'AI/ML Engine', desc: 'Answer Generation', icon: '🧠' },
            { name: 'TypeScript', desc: 'Type Safety', icon: '📘' },
            { name: 'Tailwind CSS', desc: 'Styling', icon: '🎨' },
          ].map((tech, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 text-center hover:border-primary-500/30 transition-all"
            >
              <div className="text-3xl mb-2">{tech.icon}</div>
              <h4 className="text-white font-semibold text-sm">{tech.name}</h4>
              <p className="text-surface-500 text-xs">{tech.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 lg:px-12 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center glass rounded-3xl p-12 border border-primary-500/20"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-surface-400 text-lg mb-8">
            Join thousands of developers who use InterviewAI Pro to land their dream jobs.
          </p>
          <button
            onClick={onGetStarted}
            className="group px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white rounded-2xl text-lg font-bold transition-all hover:shadow-xl hover:shadow-primary-600/30 flex items-center gap-3 mx-auto"
          >
            Launch Interview Assistant
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-8 border-t border-surface-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary-400" />
            <span className="text-white font-semibold">InterviewAI Pro</span>
          </div>
          <p className="text-surface-500 text-sm">
            © {new Date().getFullYear()} InterviewAI Pro • Developed by <span className="text-primary-400 font-semibold italic">Utkarsh Srivastav</span>
          </p>
          <div className="flex items-center gap-4 text-surface-500 text-sm">
            <Eye className="w-4 h-4" />
            <span>Screen Share Safe</span>
          </div>
        </div>
      </footer>
      {/* Scroll to Top Button - ALWAYS VISIBLE - Mobile Optimized */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] p-3 sm:p-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl shadow-2xl shadow-primary-600/40 border border-white/20 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
        title="Scroll to top"
      >
        <ArrowUp className="w-6 h-6" />
      </button>
    </div>
  );
}
