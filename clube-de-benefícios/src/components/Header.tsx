import React from 'react';
import { Sparkles, Shield, User, LogOut, Ticket } from 'lucide-react';
import { FirebaseDatabase } from '../lib/firebaseDb';

interface HeaderProps {
  currentRole: 'client' | 'admin';
  onChangeRole: (role: 'client' | 'admin') => void;
  onOpenLogin: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
  activeView: 'clube' | 'blog' | 'blog-post';
  onChangeView: (view: 'clube' | 'blog') => void;
}

export default function Header({
  currentRole,
  onChangeRole,
  onOpenLogin,
  isLoggedIn,
  onLogout,
  userName,
  userEmail,
  activeView,
  onChangeView,
}: HeaderProps) {
  const isAdmin = userEmail?.trim().toLowerCase() === 'fabionunes390@gmail.com' || userEmail?.trim().toLowerCase() === 'amplebrasilcompany@gmail.com' || userEmail?.trim().toLowerCase() === 'fabisasaude@gmail.com';
  
  const [dbLogo, setDbLogo] = React.useState<string>('');

  React.useEffect(() => {
    let active = true;
    const fetchLogo = async () => {
      try {
        const config = await FirebaseDatabase.getVisualConfig();
        if (config && config.logoBase64 && active) {
          setDbLogo(config.logoBase64);
          localStorage.setItem('fabisa_logo', config.logoBase64);
        }
      } catch (error) {
        console.error('Error fetching visual config in header:', error);
      }
    };
    fetchLogo();
    return () => {
      active = false;
    };
  }, []);

  const logoSource = dbLogo || localStorage.getItem('fabisa_logo') || '';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/95 backdrop-blur-md" id="app-header">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* LOGO */}
        <div className="flex items-center h-10" id="header-logo-container">
          {logoSource ? (
            <img
              src={logoSource}
              alt="Clube de Benefícios Logo"
              className="h-10 w-auto object-contain rounded-md cursor-pointer"
              id="header-brand-logo"
              referrerPolicy="no-referrer"
              onClick={() => onChangeView('clube')}
            />
          ) : (
            <div className="h-10 w-16 bg-zinc-100 animate-pulse rounded-md" />
          )}
          <div className="mx-3 h-6 w-[1px] bg-zinc-200" id="header-brand-separator"></div>
          <span 
            className="text-base font-medium tracking-wide text-zinc-700 antialiased mr-4 sm:mr-6 hidden md:inline-block cursor-pointer hover:text-indigo-650 transition" 
            id="header-brand-text"
            onClick={() => onChangeView('clube')}
          >
            Clube de Benefícios
          </span>

          {/* PUBLIC NAVIGATION TABS */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => onChangeView('clube')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeView === 'clube'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
              }`}
              id="header-tab-clube"
            >
              Clube
            </button>
            <button
              onClick={() => onChangeView('blog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeView === 'blog' || activeView === 'blog-post'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
              }`}
              id="header-tab-blog"
            >
              Blog
            </button>
          </nav>
        </div>

        {/* ROLE SWITCHER & USER BUTTONS */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Visual Role Selector - Crucial for Preview Testing - Only render if admin */}
          {isAdmin && (
            <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1">
              <button
                id="switch-client"
                onClick={() => onChangeRole('client')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  currentRole === 'client'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline">Portal do</span> Cliente
              </button>
              <button
                id="switch-admin"
                onClick={() => onChangeRole('admin')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  currentRole === 'admin'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-zinc-600 hover:text-indigo-600'
                }`}
              >
                <Shield className="h-3.5 w-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Módulo</span> Admin
              </button>
            </div>
          )}

          {/* User Section */}
          <div className="flex items-center gap-2 border-l border-zinc-200 pl-3 sm:pl-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-col text-right">
                  <span className="hidden text-xs font-medium text-zinc-700 sm:block">
                    {userName || 'Associado'}
                  </span>
                  <span className="hidden text-[10px] text-zinc-400 sm:block">
                    Conta Ativa
                  </span>
                </div>
                <button
                  id="user-logout"
                  onClick={onLogout}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-red-500"
                  title="Fazer Logout"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <button
                id="user-login"
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                <User className="h-3.5 w-3.5 text-zinc-500" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
