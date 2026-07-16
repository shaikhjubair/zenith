import { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { AuthGate } from './components/AuthGate';

// Import modules dynamically
const StudyModule = lazy(() => import('./modules/StudyModule').then(module => ({ default: module.StudyModule })));
const SkillsModule = lazy(() => import('./modules/SkillsModule').then(module => ({ default: module.SkillsModule })));
const TasksModule = lazy(() => import('./modules/TasksModule').then(module => ({ default: module.TasksModule })));
const ExpenseModule = lazy(() => import('./modules/ExpenseModule').then(module => ({ default: module.ExpenseModule })));
const DietModule = lazy(() => import('./modules/DietModule').then(module => ({ default: module.DietModule })));
const SpiritualModule = lazy(() => import('./modules/SpiritualModule').then(module => ({ default: module.SpiritualModule })));
const SportsModule = lazy(() => import('./modules/SportsModule').then(module => ({ default: module.SportsModule })));
const LibraryModule = lazy(() => import('./modules/LibraryModule').then(module => ({ default: module.LibraryModule })));
const DashboardModule = lazy(() => import('./modules/DashboardModule').then(module => ({ default: module.DashboardModule })));
import { GlobalTimerProvider } from './context/GlobalTimerContext';
import { NotificationProvider } from './context/NotificationContext';
import { UserProfileProvider } from './context/UserProfileContext';
import { CommandPalette } from './components/CommandPalette';
import { SecureModuleWrapper } from './components/SecureModuleWrapper';

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
                onOpenSearch={() => {
                  const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                  window.dispatchEvent(event);
                }}
              />
              
              <main className="flex flex-1 w-full h-full block relative z-10 max-w-[100vw] overflow-x-hidden">
                <motion.div
                  key={activeModule}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex-1 flex flex-col w-full h-full min-h-screen pt-24 px-4 md:px-8 pb-12 overflow-y-auto overflow-x-hidden block"
                >
                  <Suspense fallback={<div className="flex items-center justify-center w-full h-full min-h-[50vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
                    {renderModule()}
                  </Suspense>
                </motion.div>
              </main>
              

              <CommandPalette onNavigate={setActiveModule} />
            </div>
          </AuthGate>
        </GlobalTimerProvider>
      </NotificationProvider>
    </UserProfileProvider>
  );
}
