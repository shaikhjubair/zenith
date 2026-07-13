import { Search, Bell, Settings, Menu } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useUserProfile } from '../context/UserProfileContext';
import { AccountHubModal } from './AccountHubModal';
import { useState } from 'react';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
  onOpenSettings?: () => void;
  onOpenSearch?: () => void;
}

export function TopBar({ title, subtitle, onMenuClick, onOpenSettings, onOpenSearch }: TopBarProps) {
  const { notifications, hasUnread, clearUnread } = useNotifications();
  const { profile } = useUserProfile();
  const [showAccountHub, setShowAccountHub] = useState(false);
  const [accountHubTab, setAccountHubTab] = useState<'personal' | 'study' | 'integrations'>('personal');
  const [showNotifications, setShowNotifications] = useState(false);

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

        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (hasUnread) clearUnread();
            }} 
            className="relative shrink-0 aspect-square min-w-[40px] w-10 h-10 rounded-full bg-surface-container/50 border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors hover:bg-white/5"
          >
            <Bell className="w-5 h-5" />
            {hasUnread && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error animate-pulse border border-background"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-4 w-80 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <h3 className="font-bold text-on-surface">Notifications</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-on-surface-variant text-sm">
                    No new notifications
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map(n => (
                      <div key={n.id} className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors" onClick={() => {
                        window.dispatchEvent(new CustomEvent('NAVIGATE_MODULE', { detail: n.path }));
                        setShowNotifications(false);
                      }}>
                        <p className="text-sm font-bold text-on-surface mb-1">{n.title}</p>
                        <p className="text-xs text-on-surface-variant">{n.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button onClick={() => { setAccountHubTab('integrations'); setShowAccountHub(true); }} className="shrink-0 aspect-square min-w-[40px] w-10 h-10 rounded-full bg-surface-container/50 border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors hover:bg-white/5">
          <Settings className="w-5 h-5" />
        </button>

        <button 
          onClick={() => { setAccountHubTab('personal'); setShowAccountHub(true); }}
          className="shrink-0 aspect-square min-w-[40px] w-10 h-10 rounded-full bg-gradient-to-tr from-[#651fff] to-[#00e676] p-[2px] shadow-[0_0_15px_rgba(101,31,255,0.4)] hover:scale-105 transition-transform"
        >
          <div className="w-full h-full rounded-full bg-surface/80 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/20">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover aspect-square shrink-0" />
            ) : (
              <span className="text-[14px] font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#651fff] to-[#00e676]">SJ</span>
            )}
          </div>
        </button>
      </div>

      <AccountHubModal isOpen={showAccountHub} onClose={() => setShowAccountHub(false)} defaultTab={accountHubTab} />
    </header>
  );
}
