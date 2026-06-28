import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>((window as any).deferredPWAInstallPrompt || null);
  const [isVisible, setIsVisible] = useState(!!(window as any).deferredPWAInstallPrompt);

  useEffect(() => {
    if ((window as any).deferredPWAInstallPrompt) {
      setDeferredPrompt((window as any).deferredPWAInstallPrompt);
      setIsVisible(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPWAInstallPrompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-zinc-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <img 
            src="https://i.ibb.co/6YV3Zk7X/FABISA-logo.png" 
            alt="FABISA Logo" 
            className="w-12 h-12 rounded-xl object-cover shadow-sm bg-indigo-50 shrink-0"
          />
          <div>
            <h4 className="text-sm font-bold text-zinc-900 leading-tight">
              Instalar Aplicativo Clube FABISA
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
              Acesse todos os benefícios e parceiros da sua rede local com um clique.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
          <button
            onClick={handleDismiss}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition"
            aria-label="Dispensar banner de instalação"
          >
            <X className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleInstallClick}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm"
          >
            <Download className="h-4 w-4" />
            INSTALAR AGORA
          </button>
        </div>

      </div>
    </div>
  );
}
