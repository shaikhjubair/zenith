import { Search, Bell, Settings, Menu } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
  onOpenSettings?: () => void;
  onOpenSearch?: () => void;
}

export function TopBar({ title, subtitle, onMenuClick, onOpenSettings, onOpenSearch }: TopBarProps) {
  const { hasUnread, clearUnread } = useNotifications();

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-280px)] h-20 px-6 flex justify-between items-center bg-background/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none z-30">
      <div className="flex items-center gap-4 w-1/3">
        <button 
          onClick={onMenuClick}
          className="md:hidden w-10 h-10 rounded-xl bg-surface-container/50 border border-white/10 flex items-center justify-center text-on-surface hover:text-primary transition-colors hover:bg-white/5"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && <h2 className="text-2xl font-bold text-on-surface hidden md:block">{title}</h2>}
      </div>
      
      <div className="flex items-center gap-6 w-1/3 justify-end pointer-events-auto">
        <div className="relative hidden md:block w-64 group cursor-pointer" onClick={onOpenSearch}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
          <div className="w-full bg-surface-container/30 border border-white/10 rounded-full py-2 pl-10 pr-4 text-[16px] text-on-surface-variant/50 hover:border-primary/50 hover:bg-surface-container/50 transition-all backdrop-blur-md flex items-center justify-between">
            <span>Search modules...</span>
            <span className="text-[10px] font-bold border border-white/10 px-1.5 py-0.5 rounded bg-white/5">⌘K</span>
          </div>
        </div>

        <button 
          onClick={clearUnread} 
          className="relative w-10 h-10 rounded-full bg-surface-container/50 border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors hover:bg-white/5"
        >
          <Bell className="w-5 h-5" />
          {hasUnread && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error animate-pulse border border-background"></span>
          )}
        </button>
        <button onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-surface-container/50 border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors hover:bg-white/5">
          <Settings className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#651fff] to-[#00e676] p-[2px] shadow-[0_0_15px_rgba(101,31,255,0.4)]">
          <div className="w-full h-full rounded-full bg-surface/80 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/20">
            <span className="text-[14px] font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#651fff] to-[#00e676]">SJ</span>
          </div>
        </div>
      </div>
    </header>
  );
}
