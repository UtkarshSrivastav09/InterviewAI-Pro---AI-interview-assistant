import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from './components/LandingPage';
import InterviewDashboard from './components/InterviewDashboard';

type Page = 'landing' | 'dashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  return (
    <AnimatePresence mode="wait">
      {currentPage === 'landing' ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LandingPage onGetStarted={() => setCurrentPage('dashboard')} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <InterviewDashboard onBack={() => setCurrentPage('landing')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
