import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Target, Zap, ChevronRight, Mail, ArrowUp } from 'lucide-react';
import { useState } from 'react';

interface AboutPageProps {
  onBack: () => void;
}

export default function AboutPage({ onBack }: AboutPageProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <div className="min-h-screen bg-surface-950 text-white relative selection:bg-primary-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-20 flex items-center justify-between px-6 lg:px-12 py-5 glass border-b border-white/5 sticky top-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl transition-all text-surface-300 hover:text-white group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary-400" />
          <span className="text-xl font-bold tracking-tight">
            InterviewAI<span className="text-primary-400">Pro</span>
          </span>
        </div>
        <div className="w-20" /> {/* Spacer for centering */}
      </nav>

      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-6 py-16 lg:py-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div className="text-center mb-24" variants={itemVariants}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-semibold mb-6 uppercase tracking-widest"
          >
            The Vision
          </motion.div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight tracking-tight">
            Revolutionizing <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-400 to-indigo-400">
              Technical Interviews
            </span>
          </h1>
          <p className="text-lg md:text-xl text-surface-400 max-w-2xl mx-auto leading-relaxed">
            We built InterviewAI Pro to level the playing field. Our mission is to empower developers with real-time, AI-driven confidence during high-stakes technical interviews.
          </p>
        </motion.div>

        {/* Lead Architect Section */}
        <motion.div variants={itemVariants} className="mb-24 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-[3rem] blur-xl transform -rotate-1 scale-105 opacity-50" />
          <div className="relative glass border border-white/10 rounded-[2.5rem] p-8 md:p-12 overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-colors duration-700" />
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16">
              {/* Image Container */}
              <div className="shrink-0 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 to-purple-500 rounded-3xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
                <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-3xl overflow-hidden border border-white/20 z-10 shadow-2xl">
                  <img
                    src="/images/Utkarsh Image.png"
                    alt="Utkarsh Srivastava"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      // Fallback if image not found
                      e.currentTarget.src = 'https://ui-avatars.com/api/?name=Utkarsh+Srivastava&background=6366f1&color=fff&size=512';
                    }}
                  />
                </div>
              </div>

              {/* Bio Content */}
              <div className="flex-1 text-center md:text-left z-10">
                <div className="inline-block px-3 py-1 rounded-lg bg-surface-800/80 border border-surface-700 text-xs font-semibold text-primary-400 tracking-widest uppercase mb-4">
                  Lead Architect & Founder
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                  Utkarsh Srivastav
                </h2>
                <p className="text-lg text-surface-400 mb-6 font-medium">
                  Full-Stack Engineer & AI Enthusiast
                </p>
                <p className="text-surface-300 leading-relaxed mb-8">
                  Passionate about bridging the gap between complex AI capabilities and seamless user experiences. Utkarsh designed InterviewAI Pro to solve the "blank mind" problem during high-pressure technical interviews, combining bleeding-edge web speech APIs with lightning-fast LLM processing.
                </p>
                
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <a
                    href="https://www.linkedin.com/in/utkarsh-srivastav-b433bb33a/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-surface-800 hover:bg-[#0077b5]/20 text-surface-300 hover:text-[#0077b5] rounded-xl transition-all border border-surface-700 hover:border-[#0077b5]/50 shadow-lg hover:-translate-y-1"
                    title="LinkedIn"
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                  </a>
                  <a
                    href="https://github.com/UtkarshSrivastav09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-surface-800 hover:bg-white/10 text-surface-300 hover:text-white rounded-xl transition-all border border-surface-700 hover:border-white/30 shadow-lg hover:-translate-y-1"
                    title="GitHub"
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                  </a>
                  <a
                    href="mailto:utkarshsrivastav2206@gmail.com?subject=Hello%20Utkarsh%20-%20InterviewAI%20Pro"
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-600/20 hover:shadow-primary-500/40 hover:-translate-y-1 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Contact Me
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Core Values / Features Grid */}
        <motion.div variants={itemVariants} className="mb-24">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Built on Core Principles</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-6 h-6 text-yellow-400" />,
                title: 'Ultra-Low Latency',
                desc: 'Sub-second processing time from voice capture to AI response delivery.',
                bg: 'bg-yellow-500/10',
                border: 'border-yellow-500/20',
              },
              {
                icon: <Brain className="w-6 h-6 text-purple-400" />,
                title: 'Contextual Intelligence',
                desc: 'Structured, interview-ready answers formatted exactly how hiring managers expect.',
                bg: 'bg-purple-500/10',
                border: 'border-purple-500/20',
              },
              {
                icon: <Target className="w-6 h-6 text-emerald-400" />,
                title: 'Absolute Stealth',
                desc: 'Designed specifically to bypass screen-share detection and remain invisible.',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`glass ${feature.border} rounded-2xl p-8 transition-all duration-300 cursor-default group`}
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
                <p className="text-surface-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div variants={itemVariants} className="text-center pb-12">
          <button
            onClick={onBack}
            className="group px-8 py-4 bg-white hover:bg-surface-200 text-surface-950 rounded-2xl text-lg font-bold transition-all hover:shadow-xl hover:shadow-white/20 flex items-center gap-3 mx-auto"
          >
            Start Your Interview Prep
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </motion.div>
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
