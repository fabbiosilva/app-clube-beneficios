/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, Ticket, Settings, Info, CloudLightning, PlusCircle, Phone } from 'lucide-react';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import BenefitModal from './components/BenefitModal';
import ClientPortal from './components/ClientPortal';
import AdminPortal from './components/AdminPortal';
import AuthGateView from './components/AuthGateView';
import RecommendModal from './components/RecommendModal';
import BlogPortal from './components/BlogPortal';
import InstallBanner from './components/InstallBanner';
import { FirebaseDatabase } from './lib/firebaseDb';
import { Benefit, Company, Category, BlogPost, BeforeInstallPromptEvent } from './types';

export default function App() {
  const [activeRole, setActiveRole] = useState<'client' | 'admin'>('client');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>((window as any).deferredPWAInstallPrompt || null);

  useEffect(() => {
    // Sync with global in case it was caught before mount
    if ((window as any).deferredPWAInstallPrompt) {
      setDeferredPrompt((window as any).deferredPWAInstallPrompt);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPWAInstallPrompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);
  const [totalSaved, setTotalSaved] = useState<number>(0);
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [recommendTypeOverride, setRecommendTypeOverride] = useState<'cliente' | 'proprietario' | undefined>(undefined);
  const [origemOverride, setOrigemOverride] = useState<string | undefined>(undefined);

  // Reactive Database States (initialized from localStorage cache if available for instant feel)
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('cached_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [companies, setCompanies] = useState<Company[]>(() => {
    try {
      const saved = localStorage.getItem('cached_companies');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [benefits, setBenefits] = useState<Benefit[]>(() => {
    try {
      const saved = localStorage.getItem('cached_benefits');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Selection state for opening Benefit Detail modals
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);

  // Blog and Public Routing State
  const [activeView, setActiveView] = useState<'clube' | 'blog' | 'blog-post'>('clube');
  const [selectedBlogPostId, setSelectedBlogPostId] = useState<string | null>(null);
  const [adminInitialTab, setAdminInitialTab] = useState<'companies' | 'categories' | 'benefits' | 'blog' | undefined>(undefined);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => {
    try {
      const saved = localStorage.getItem('cached_blogposts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync with Cloud Firestore Database
  const [isLoading, setIsLoading] = useState(true);

  const refreshLocalDatabase = async () => {
    const hasCache = categories.length > 0 && companies.length > 0 && benefits.length > 0 && blogPosts.length > 0;
    if (!hasCache) {
      setIsLoading(true);
    }
    try {
      const [fetchedCategories, fetchedCompanies, fetchedBenefits, fetchedBlogPosts] = await Promise.all([
        FirebaseDatabase.getCategories(),
        FirebaseDatabase.getCompanies(),
        FirebaseDatabase.getBenefits(),
        FirebaseDatabase.getBlogPosts()
      ]);
      setCategories(fetchedCategories);
      setCompanies(fetchedCompanies);
      setBenefits(fetchedBenefits);
      setBlogPosts(fetchedBlogPosts);

      // Persist in localStorage for instant load next time
      localStorage.setItem('cached_categories', JSON.stringify(fetchedCategories));
      localStorage.setItem('cached_companies', JSON.stringify(fetchedCompanies));
      localStorage.setItem('cached_benefits', JSON.stringify(fetchedBenefits));
      localStorage.setItem('cached_blogposts', JSON.stringify(fetchedBlogPosts));
    } catch (e) {
      console.error("Error refreshing database from Firestore", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshLocalDatabase();

    // Analisar caminhos de URL iniciais para suportar links diretos do blog
    const initialPath = window.location.pathname;
    if (initialPath.startsWith('/blog/')) {
      const postId = initialPath.replace('/blog/', '');
      if (postId) {
        setActiveView('blog-post');
        setSelectedBlogPostId(postId);
      }
    } else if (initialPath === '/blog') {
      setActiveView('blog');
      setSelectedBlogPostId(null);
    } else if (initialPath === '/servicos' || initialPath === '/profissionais') {
      setActiveView('profissionais');
      setSelectedBlogPostId(null);
    }

    // Escutar eventos de voltar/avançar no navegador
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/blog/')) {
        const postId = currentPath.replace('/blog/', '');
        setActiveView('blog-post');
        setSelectedBlogPostId(postId);
      } else if (currentPath === '/blog') {
        setActiveView('blog');
        setSelectedBlogPostId(null);
      } else if (currentPath === '/servicos' || currentPath === '/profissionais') {
        setActiveView('profissionais');
        setSelectedBlogPostId(null);
      } else {
        setActiveView('clube');
        setSelectedBlogPostId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);

    // Fetch and cache visual configuration (logo)
    FirebaseDatabase.getVisualConfig().then((config) => {
      if (config && config.logoBase64) {
        localStorage.setItem('fabisa_logo', config.logoBase64);
      }
    }).catch(e => {
      console.error("Error fetching visual config on app load:", e);
    });

    // Auto-create/provision the main admin account in Firestore if it does not exist yet
    FirebaseDatabase.provisionAdminUser();

    // Check for simulated local session first
    const savedSimulatedUser = localStorage.getItem('simulated_auth_user');
    if (savedSimulatedUser) {
      try {
        const parsed = JSON.parse(savedSimulatedUser);
        if (parsed && parsed.email) {
          const cleanEmail = parsed.email.trim().toLowerCase();
          
          // Verify that this email is indeed still on the authorized list in Firestore
          FirebaseDatabase.isEmailAuthorized(cleanEmail).then((isAuthorized) => {
            if (isAuthorized) {
              setUserProfile(parsed);
              setIsLoggedIn(true);
              if (cleanEmail === 'fabionunes390@gmail.com' || cleanEmail === 'amplebrasilcompany@gmail.com' || cleanEmail === 'fabisasaude@gmail.com') {
                setActiveRole('admin');
              } else {
                setActiveRole('client');
              }
            } else {
              // No longer authorized! Clear session
              localStorage.removeItem('simulated_auth_user');
              setUserProfile(null);
              setIsLoggedIn(false);
              setActiveRole('client');
            }
          }).catch(e => {
            console.error("Error verifying authorized email, using cached session", e);
            // Fallback: keep active anyway
            setUserProfile(parsed);
            setIsLoggedIn(true);
            if (cleanEmail === 'fabionunes390@gmail.com' || cleanEmail === 'amplebrasilcompany@gmail.com' || cleanEmail === 'fabisasaude@gmail.com') {
              setActiveRole('admin');
            } else {
              setActiveRole('client');
            }
          });
        }
      } catch (err) {
        console.error("Failed to restore simulated user from localStorage:", err);
      }
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleLoginSuccess = (name: string, email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setUserProfile({ name, email: cleanEmail });
    setIsLoggedIn(true);
    if (cleanEmail === 'fabionunes390@gmail.com' || cleanEmail === 'amplebrasilcompany@gmail.com' || cleanEmail === 'fabisasaude@gmail.com') {
      setActiveRole('admin');
    } else {
      setActiveRole('client');
    }
    setActiveView('clube');
  };

  const handleLogout = async () => {
    localStorage.removeItem('simulated_auth_user');
    setUserProfile(null);
    setIsLoggedIn(false);
    setActiveRole('client');
    setActiveView('blog');
  };

  useEffect(() => {
    if (isLoggedIn && userProfile?.email) {
      FirebaseDatabase.getUserSavings(userProfile.email).then((savings) => {
        setTotalSaved(savings);
      });
    } else {
      setTotalSaved(0);
    }
  }, [isLoggedIn, userProfile?.email]);

  const handleRedeemBenefit = async (savingAmount: number) => {
    if (!userProfile?.email) return;
    const newTotal = totalSaved + savingAmount;
    setTotalSaved(newTotal);
    await FirebaseDatabase.saveUserSavings(userProfile.email, newTotal);
  };

  const handleRecommendSubmit = async (recommendation: { 
    companyName: string; 
    location: string; 
    sector: string; 
    type: string; 
    whatsapp?: string; 
    origem?: string;
  }) => {
    await FirebaseDatabase.submitPartnerRecommendation({
      ...recommendation,
      submittedBy: userProfile?.email || 'Anônimo'
    });
  };

  // Find related properties for selected benefit details
  const selectedProductCompany = selectedBenefit
    ? companies.find((co) => co.id === selectedBenefit.companyId) || null
    : null;

  const selectedProductCategory = selectedBenefit
    ? categories.find((cat) => cat.id === selectedBenefit.categoryId) || null
    : null;

  // Determine if we should show the full screen Auth Gate (login screen)
  const showLoginScreen = !isLoggedIn && activeView === 'clube';

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('O navegador ainda não validou o aplicativo para instalação. Verifique o Manifesto ou se você está no iOS.');
    }
  };

  if (showLoginScreen) {
    return (
      <>
        <AuthGateView 
          onLoginSuccess={handleLoginSuccess} 
          message="Esta é uma área exclusiva para membros da FABISA. Por favor, faça login ou registre-se para acessar os cupons, descontos, parcerias e vantagens exclusivas do nosso clube!"
          onGoToBlog={() => setActiveView('blog')}
          onInstallClick={handleInstallClick}
          onOpenRecommendOwner={() => {
            setRecommendTypeOverride('proprietario');
            setOrigemOverride('Origem: Tela de Login');
            setIsRecommendOpen(true);
          }}
        />
        <RecommendModal
          isOpen={isRecommendOpen}
          onClose={() => {
            setIsRecommendOpen(false);
            setRecommendTypeOverride(undefined);
            setOrigemOverride(undefined);
          }}
          onSubmit={handleRecommendSubmit}
          userEmail={userProfile?.email}
          initialTypeOverride={recommendTypeOverride}
          origemOverride={origemOverride || 'Origem: Tela de Login'}
        />
      </>
    );
  }

  const isAdmin = userProfile?.email?.trim().toLowerCase() === 'fabionunes390@gmail.com' || userProfile?.email?.trim().toLowerCase() === 'amplebrasilcompany@gmail.com' || userProfile?.email?.trim().toLowerCase() === 'fabisasaude@gmail.com';

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 flex flex-col font-sans" id="app-root">
      {/* 1. STICKY APPBAR HEADER */}
      <Header
        currentRole={activeRole}
        onChangeRole={(role) => {
          setActiveRole(role);
          if (role === 'admin') {
            setAdminInitialTab('companies');
          }
        }}
        onOpenLogin={() => setIsAuthOpen(true)}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        userName={userProfile?.name}
        userEmail={userProfile?.email}
        activeView={activeView}
        onChangeView={(view) => {
          setActiveView(view);
          setSelectedBlogPostId(null);
          setAdminInitialTab(undefined);
          if (view === 'blog') {
            window.history.pushState({}, '', '/blog');
          } else if (view === 'profissionais') {
            window.history.pushState({}, '', '/servicos');
          } else {
            window.history.pushState({}, '', '/');
          }
        }}
      />

      {/* 2. DYNAMIC WORKSPACE SCREEN VIEW */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative min-h-[400px]">
        {isLoading && benefits.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs z-50 rounded-2xl" id="firestore-loading-screen">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 animate-bounce">
              <Ticket className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-semibold text-zinc-600">Sincronizando com o Firebase Firestore...</p>
            <p className="text-xs text-zinc-400">Isso pode levar alguns segundos na primeira inicialização.</p>
          </div>
        ) : null}

        {activeView === 'blog' || activeView === 'blog-post' ? (
          /* PUBLIC BLOG AREA */
          <BlogPortal
            posts={blogPosts}
            selectedPostId={activeView === 'blog-post' ? selectedBlogPostId : null}
            onSelectPost={(id) => {
              setSelectedBlogPostId(id);
              setActiveView(id ? 'blog-post' : 'blog');
              if (id) {
                window.history.pushState({}, '', `/blog/${id}`);
              } else {
                window.history.pushState({}, '', '/blog');
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToClube={() => {
              setActiveView('clube');
              window.history.pushState({}, '', '/');
            }}
            isAdmin={isAdmin}
            onGoToAdminBlog={() => {
              setActiveRole('admin');
              setAdminInitialTab('blog');
              setActiveView('clube');
              window.history.pushState({}, '', '/');
            }}
          />
        ) : activeRole === 'client' ? (
          /* CLIENT-FACING SEARCH / FILTERS VIEW */
          <ClientPortal
            benefits={benefits}
            companies={companies}
            categories={categories}
            onSelectBenefit={setSelectedBenefit}
            totalSaved={totalSaved}
          />
        ) : (
          /* ADMINISTRATIVE CRUD CONTROLS WORKSPACE */
          <AdminPortal
            companies={companies}
            categories={categories}
            benefits={benefits}
            blogPosts={blogPosts}
            onRefreshData={refreshLocalDatabase}
            userEmail={userProfile?.email}
            initialTab={adminInitialTab}
          />
        )}
      </main>

      {/* 3. CLEAN FOOTER */}
      <footer className="border-t border-zinc-200 bg-white py-8" id="app-footer">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left side copyright */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Ticket className="h-4 w-4" />
              </div>
              <span className="text-xs font-black text-zinc-800 tracking-wide">
                ClubVantagens © 2026 • Todos os direitos reservados
              </span>
            </div>

            {/* Right side support + referral buttons */}
            <div className="flex flex-wrap items-center gap-3" id="footer-action-buttons">
              <button
                type="button"
                onClick={() => setIsRecommendOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-650 hover:bg-indigo-50/50 hover:text-indigo-700 bg-white transition shadow-xs active:scale-98 cursor-pointer"
                id="btn-footer-recommend"
              >
                <PlusCircle className="h-4 w-4 text-indigo-500" />
                <span>Indique uma Empresa</span>
              </button>

              <a
                href="https://wa.me/5521986889446?text=Ol%C3%A1!%20Sou%20associado%20da%20FABISA%20Sa%C3%BAde%20e%20preciso%20de%20suporte%20com%20o%20aplicativo."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs hover:shadow-sm active:scale-98 cursor-pointer"
                id="btn-footer-support"
              >
                <Phone className="h-4 w-4" />
                <span>Preciso de Ajuda / Suporte</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* 4. DIALOG MODAL LAYOUTS */}
      {/* A. Auth Portal Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* B. Benefits details modal */}
      <BenefitModal
        benefit={selectedBenefit}
        company={selectedProductCompany}
        category={selectedProductCategory}
        isOpen={selectedBenefit !== null}
        onClose={() => setSelectedBenefit(null)}
        isLoggedIn={isLoggedIn}
        onOpenLogin={() => setIsAuthOpen(true)}
        userName={userProfile?.name}
        onRedeemBenefit={handleRedeemBenefit}
      />

      {/* C. Recommend Partner Modal */}
      <RecommendModal
        isOpen={isRecommendOpen}
        onClose={() => {
          setIsRecommendOpen(false);
          setRecommendTypeOverride(undefined);
          setOrigemOverride(undefined);
        }}
        onSubmit={handleRecommendSubmit}
        userEmail={userProfile?.email}
        initialTypeOverride={recommendTypeOverride}
        origemOverride={origemOverride || 'Interno'}
      />

      <InstallBanner />
    </div>
  );
}
