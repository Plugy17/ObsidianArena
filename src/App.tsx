// ============================================
// Obsidian Arena — Main App Component
// ============================================

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TonProvider } from './context/TonProvider';
import { TelegramProvider } from './context/TelegramProvider';
import { UserProvider, useUser } from './context/UserContext';
import { Header } from './components/layout/Header';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { SplashScreen } from './components/ui/SplashScreen';
import { Dashboard } from './pages/Dashboard';
import { Arena } from './pages/Arena';
import { Inventory } from './pages/Inventory';
import { Market } from './pages/Market';
import { Guilds } from './pages/Guilds';
import type { TabType } from './types';

// --- Page Renderer ---
const PageRenderer: React.FC = () => {
  const { activeTab, isLoading, isInitialized } = useUser();

  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-purple-neon/30 border-t-purple-neon rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-text-secondary">Загрузка Obsidian Arena...</p>
        </motion.div>
      </div>
    );
  }

  const renderPage = (tab: TabType) => {
    switch (tab) {
      case 'arena':
        return <Arena />;
      case 'inventory':
        return <Inventory />;
      case 'market':
        return <Market />;
      case 'guilds':
        return <Guilds />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex-1 w-full pb-24"
      >
        {renderPage(activeTab)}
      </motion.main>
    </AnimatePresence>
  );
};

// --- App Layout ---
const AppLayout: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Splash Screen with auto-auth */}
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen
            key="splash"
            onComplete={handleSplashComplete}
            duration={2000}
          />
        )}
      </AnimatePresence>

      {/* Main App (shown after splash) */}
      <AnimatePresence>
        {!showSplash && (
          <motion.div
            key="main-app"
            className="min-h-screen flex flex-col relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Animated background particles */}
            <div className="fixed inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-neon/5 rounded-full blur-3xl animate-pulse" />
              <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-gold/5 rounded-full blur-3xl animate-pulse delay-1000" />
              <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-purple-neon/5 rounded-full blur-3xl animate-pulse delay-500" />
            </div>

            {/* Header */}
            <Header />

            {/* Main Content */}
            <PageRenderer />

            {/* Bottom Navigation */}
            <BottomNavigation />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Root App with Providers ---
function App() {
  return (
    <TonProvider>
      <TelegramProvider>
        <UserProvider>
          <AppLayout />
        </UserProvider>
      </TelegramProvider>
    </TonProvider>
  );
}

export default App;