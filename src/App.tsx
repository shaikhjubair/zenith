import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { AuthGate } from './components/AuthGate';
import { seedIfEmpty } from './db';

// Import modules
import { StudyModule } from './modules/StudyModule';
import { SkillsModule } from './modules/SkillsModule';
import { TasksModule } from './modules/TasksModule';
import { ExpenseModule } from './modules/ExpenseModule';
import { DietModule } from './modules/DietModule';
import { SpiritualModule } from './modules/SpiritualModule';
import { SportsModule } from './modules/SportsModule';
import { LibraryModule } from './modules/LibraryModule';
import { DashboardModule } from './modules/DashboardModule';
import { GlobalTimerProvider } from './context/GlobalTimerContext';
import { NotificationProvider } from './context/NotificationContext';
import { UserProfileProvider } from './context/UserProfileContext';
import { SettingsModal } from './components/SettingsModal';
import { CommandPalette } from './components/CommandPalette';
import { SecureModuleWrapper } from './components/SecureModuleWrapper';

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const renderModule = () => {
    switch (activeModule) {
      case 'study': return <SecureModuleWrapper moduleName="Study"><StudyModule /></SecureModuleWrapper>;
      case 'skills': return <SkillsModule />;
      case 'tasks': return <TasksModule />;
      case 'expense': return <SecureModuleWrapper moduleName="Expense"><ExpenseModule /></SecureModuleWrapper>;
      case 'diet': return <SecureModuleWrapper moduleName="Diet"><DietModule /></SecureModuleWrapper>;
      case 'spiritual': return <SpiritualModule />;
      case 'sports': return <SportsModule />;
      case 'library': return <LibraryModule />;
      case 'dashboard': return <DashboardModule />;
      default: return <DashboardModule />;
    }
  };

  return (
    <UserProfileProvider>
      <NotificationProvider>
        <GlobalTimerProvider>
          <AuthGate>
            <div className="flex flex-col md:flex-row min-h-screen bg-background relative selection:bg-primary/30 selection:text-primary-fixed">
              <div className="aurora-bg"></div>
              
              <Sidebar 
                activeModule={activeModule} 
                setActiveModule={(mod) => {
                  setActiveModule(mod);
                  setSidebarOpen(false);
                }} 
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
              <TopBar 
                onMenuClick={() => setSidebarOpen(true)} 
                onOpenSettings={() => setShowSettings(true)}
                onOpenSearch={() => {
                  const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                  window.dispatchEvent(event);
                }}
              />
              
              <main className="flex flex-1 w-full h-full block relative z-10">
                <motion.div
                  key={activeModule}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex-1 flex flex-col w-full h-full min-h-screen pt-24 px-8 pb-12 overflow-y-auto block"
                >
                  {renderModule()}
                </motion.div>
              </main>
              
              <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
              <CommandPalette onNavigate={setActiveModule} />
            </div>
          </AuthGate>
        </GlobalTimerProvider>
      </NotificationProvider>
    </UserProfileProvider>
  );
}
