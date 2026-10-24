import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './features/home/HomeView';
import { SpeechToSignView } from './features/speechToSign/SpeechToSignView';
import { SignToSpeechView } from './features/signToSpeech/SignToSpeechView';
import { ConversationView } from './features/conversation/ConversationView';
import { LearnView } from './features/learn/LearnView';
import { MemoryView } from './features/memory/MemoryView';
import { SettingsView } from './features/settings/SettingsView';
import { initializeDatabase, db, DEFAULT_SETTINGS } from './lib/storage';

export const App: React.FC = () => {
  useEffect(() => {
    // 1. Initialize Dexie schema & default seed phrases
    initializeDatabase().then(async () => {
      // 2. Load and apply initial app settings
      const row = await db.settings.get('app_settings');
      const cfg = row?.value || DEFAULT_SETTINGS;
      document.documentElement.style.setProperty('--app-font-scale', String(cfg.textSize));
      document.documentElement.classList.add(`theme-${cfg.theme}`);
      if (cfg.reducedMotion) {
        document.body.classList.add('reduced-motion');
      }
    });
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {/* Skip to Main Content link for keyboard & screen-reader accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Global Accessible Navbar & Hardware Indicators */}
        <Navbar />

        {/* Main Content Area */}
        <main id="main-content" className="flex-1 pb-24 outline-none" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/speech-to-sign" element={<SpeechToSignView />} />
            <Route path="/sign-to-speech" element={<SignToSpeechView />} />
            <Route path="/conversation" element={<ConversationView />} />
            <Route path="/learn" element={<LearnView />} />
            <Route path="/memory" element={<MemoryView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>

        {/* Bottom Thumb Navigation Bar */}
        <BottomNav />
      </div>
    </BrowserRouter>
  );
};

export default App;
