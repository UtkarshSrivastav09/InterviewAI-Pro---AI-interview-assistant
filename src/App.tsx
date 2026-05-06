import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from './components/LandingPage';
import InterviewDashboard from './components/InterviewDashboard';
import AboutPage from './components/AboutPage';

type Page = 'landing' | 'dashboard' | 'about';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('launch') === 'true' ? 'dashboard' : 'landing';
  });

  return (
    <AnimatePresence>
      {currentPage === 'landing' && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <LandingPage 
            onGetStarted={() => setCurrentPage('dashboard')} 
            onNavigateToAbout={() => setCurrentPage('about')}
          />
        </motion.div>
      )}
      {currentPage === 'dashboard' && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <InterviewDashboard onBack={() => setCurrentPage('landing')} />
        </motion.div>
      )}
      {currentPage === 'about' && (
        <motion.div
          key="about"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <AboutPage onBack={() => setCurrentPage('landing')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
