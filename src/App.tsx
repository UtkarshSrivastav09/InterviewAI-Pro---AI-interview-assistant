import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from './components/LandingPage';
import InterviewDashboard from './components/InterviewDashboard';

type Page = 'landing' | 'dashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('launch') === 'true' ? 'dashboard' : 'landing';
  });

  return (
    <AnimatePresence>
      {currentPage === 'landing' ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <LandingPage onGetStarted={() => setCurrentPage('dashboard')} />
        </motion.div>
      ) : (
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
    </AnimatePresence>
  );
}
