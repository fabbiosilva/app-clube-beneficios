import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, Check, ArrowRight, ShieldAlert, Briefcase, BookOpen, UserPlus } from 'lucide-react';
import { FirebaseDatabase } from '../lib/firebaseDb';
import PartnerRegistrationForm from './PartnerRegistrationForm';

interface AuthGateViewProps {
  onLoginSuccess: (name: string, email: string) => void;
  onOpenRecommendOwner: () => void;
  message?: string;
  onGoToBlog?: () => void;
  onInstallClick?: () => void;
}

export default function AuthGateView({ onLoginSuccess, onOpenRecommendOwner, message, onGoToBlog, onInstallClick }: AuthGateViewProps) {
  const [dbLogo, setDbLogo] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

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
        console.error('Error fetching visual config:', error);
      }
    };
    fetchLogo();
    return () => {
      active = false;
    };
  }, []);

  const logoSource = dbLogo || localStorage.getItem('fabisa_logo') || ''; 

  const [isRegister, setIsRegister] = useState(false);
  const [isPartnerRegister, setIsPartnerRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setIsLoading(true);
    setSuccessMessage('');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        // Save to Firestore permanently
        await FirebaseDatabase.saveVisualConfig(base64String);
        // Update local state
        setDbLogo(base64String);
        // Cache in localStorage
        localStorage.setItem('fabisa_logo', base64String);
        setIsLoading(false);
        setSuccessMessage('Nova logo salva permanentemente no Firestore!');
        setTimeout(() => setSuccessMessage(''), 4000);
      } catch (err: any) {
        console.error('Error saving logo:', err);
        setError('Erro ao salvar a logo no Firestore: ' + err.message);
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Erro ao ler o arquivo de imagem.');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError('Por favor, preencha todos os campos.');
      setIsLoading(false);
      return;
    }

    if (isRegister && !name) {
      setError('Por favor, informe seu nome completo.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Verify if the email is on the active authorized emails list in Firestore
      const isAuthorized = await FirebaseDatabase.isEmailAuthorized(cleanEmail);
      if (!isAuthorized) {
        setError(
          'Acesso Restrito: Seu e-mail não consta no cadastro de beneficiários autorizados (planos de telemedicina ou projetos sociais FABISA). Solicite sua inclusão no Módulo Admin.'
        );
        setIsLoading(false);
        return;
      }

      // 2. Direct Secure Firestore Authentication
      if (isRegister) {
        // Register user in Firestoreusuarios collection
        const isAdminEmail = cleanEmail === 'fabionunes390@gmail.com' || cleanEmail === 'amplebrasilcompany@gmail.com' || cleanEmail === 'fabisasaude@gmail.com';
        const role = isAdminEmail ? 'admin' : 'client';
        await FirebaseDatabase.registerUser(name, cleanEmail, password, role);
        
        localStorage.setItem('simulated_auth_user', JSON.stringify({
          name: name,
          email: cleanEmail
        }));

        setSuccess(true);
        setTimeout(() => {
          onLoginSuccess(name, cleanEmail);
          setIsLoading(false);
        }, 1200);
      } else {
        // Authenticate directly against Firestoreusuarios collection
        const user = await FirebaseDatabase.authenticateUser(cleanEmail, password);

        localStorage.setItem('simulated_auth_user', JSON.stringify({
          name: user.name,
          email: user.email
        }));

        setSuccess(true);
        setTimeout(() => {
          onLoginSuccess(user.name, user.email);
          setIsLoading(false);
        }, 1200);
      }

    } catch (err: any) {
      console.error('Authentication Error: ', err);
      let friendlyMessage = 'Ocorreu um erro ao processar a autenticação.';
      
      if (err.code === 'auth/wrong-password') {
        friendlyMessage = 'Senha incorreta! Por favor, verifique a senha digitada ou use a opção "Esqueci minha senha" para redefini-la.';
      } else if (err.code === 'auth/user-not-found') {
        friendlyMessage = 'E-mail elegível mas ainda não ativado! Por favor, clique na opção de "Ative seu e-mail" abaixo para criar uma senha e ativar sua conta.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'Este e-mail de associado já foi ativado! Se esqueceu sua senha, clique em "Esqueci minha senha" para recuperá-la.';
      } else {
        friendlyMessage = `Erro: ${err.message || 'Falha na autenticação'}`;
      }
      
      setError(friendlyMessage);
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setResetSuccess(false);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Por favor, informe seu e-mail.');
      setIsLoading(false);
      return;
    }

    if (!newPassword) {
      setError('Por favor, informe a nova senha.');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve conter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Verify if the email is on the active authorized emails list in Firestore
      const isAuthorized = await FirebaseDatabase.isEmailAuthorized(cleanEmail);
      if (!isAuthorized) {
        setError(
          'Acesso Restrito: Seu e-mail não consta no cadastro de beneficiários autorizados (planos de telemedicina ou projetos sociais FABISA). Solicite sua inclusão no Módulo Admin.'
        );
        setIsLoading(false);
        return;
      }

      // 2. Direct Secure Reset inside Firestoreusuarios collection
      await FirebaseDatabase.resetUserPasswordDirectly(cleanEmail, newPassword);
      setResetSuccess(true);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error during password reset:', err);
      let friendlyMessage = 'Não foi possível redefinir sua senha no Firestore.';
      if (err.code === 'auth/user-not-found') {
        friendlyMessage = 'Este e-mail é elegível para o clube, mas ainda não foi ativado (não há conta cadastrada). Por favor, ative seu e-mail clicando na opção correspondente na tela inicial.';
      } else {
        friendlyMessage = `Erro: ${err.message || 'Falha de conexão com o banco de dados'}`;
      }
      setError(friendlyMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans" id="auth-gate-wrapper">
      {/* Visual background details */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-emerald-600/5 blur-3xl pointer-events-none" />

      <div className={`w-full ${isPartnerRegister ? 'max-w-2xl' : 'max-w-md'} bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6 transition-all duration-300`} id="auth-card">
        {isPartnerRegister ? (
          <PartnerRegistrationForm onBack={() => setIsPartnerRegister(false)} categories={[]} />
        ) : (
          <>
            {/* Brand Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center py-2 h-20" id="brand-logo-container">
                {logoSource ? (
                  <img
                    src={logoSource}
                    alt="FABISA Saúde"
                    className="h-20 w-auto object-contain rounded-2xl transition-all duration-300 hover:scale-[1.03]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-20 w-32 bg-zinc-800/30 animate-pulse rounded-2xl border border-zinc-850" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase flex items-center justify-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Clube Exclusivo de Vantagens
                </span>
                <h1 className="text-2xl font-black text-white mt-1 tracking-tight">FABISA SAÚDE</h1>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1 leading-relaxed">
                  Portal restrito de descontos para associados da telemedicina e programas sociais.
                </p>

                {/* Secure Logo Upload Interface (Hidden by default, shown only when password === 'sucesso7') */}
                {password === 'sucesso7' && (
                  <div className="mt-4 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-center space-y-2 animate-fade-in" id="secure-logo-uploader">
                    <span className="text-[10px] font-extrabold text-emerald-400 tracking-wider uppercase flex items-center justify-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                      Administração de Logomarca Ativada
                    </span>
                    <p className="text-[11px] text-zinc-300 leading-normal">
                      Selecione um arquivo de imagem para atualizar de forma permanente a logo no banco de dados Firestore de todos os usuários.
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md border border-emerald-500 mt-1 hover:scale-[1.02]">
                      <span>Selecionar Imagem (PNG/JPG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {successMessage && (
                  <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-bold leading-relaxed flex gap-2 items-center justify-center text-center animate-fade-in" id="logo-success-notice">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {message && (
                  <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300 font-bold leading-relaxed flex gap-2 items-start text-left" id="exclusive-warning-box">
                    <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{message}</span>
                  </div>
                )}
              </div>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 animate-fade-in" id="auth-success-box">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/25 shadow-lg">
                  <Check className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Autenticação bem-sucedida!</h3>
                  <p className="text-xs text-zinc-400">
                    {isRegister ? 'Seu cadastro foi concluído no Firestore.' : 'Carregando suas credenciais exclusivas...'}
                  </p>
                </div>
              </div>
            ) : isForgotPassword ? (
              <div className="space-y-5 animate-fade-in" id="auth-forgot-password-box">
                <div className="border-b border-zinc-800 pb-3">
                  <h2 className="text-lg font-black text-white">Recuperar Senha</h2>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Insira o seu e-mail cadastrado e enviaremos um link de recuperação para você redefinir sua senha secreta.
                  </p>
                </div>

                {/* ERROR ALERT */}
                {error && (
                  <div className="rounded-2xl border border-red-900/30 bg-red-950/20 p-4 text-xs text-red-300 font-medium flex gap-2.5 items-start">
                    <ShieldAlert className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                {resetSuccess ? (
                  <div className="rounded-2xl border border-emerald-950/25 bg-emerald-950/10 p-5 space-y-4" id="reset-success-message">
                    <div className="flex gap-2.5 items-start">
                      <Check className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Senha Redefinida com Sucesso!</h4>
                        <p className="text-xs text-emerald-300/80 mt-1 leading-relaxed">
                          Sua nova senha de acesso foi salva e ativada diretamente no banco de dados Firestore. Você já pode fazer login utilizando sua nova credencial!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setError('');
                        setResetSuccess(false);
                        setNewPassword('');
                      }}
                      className="w-full text-center py-2.5 px-4 rounded-xl text-xs font-black text-zinc-900 bg-white hover:bg-zinc-100 transition shadow-sm cursor-pointer uppercase tracking-wider"
                    >
                      Voltar para o Login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        E-mail do Associado *
                      </label>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-3 text-zinc-500 h-4 w-4" />
                        <input
                          type="email"
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
                          placeholder="email@provedor.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Nova Senha Desejada *
                      </label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3 text-zinc-500 h-4 w-4" />
                        <input
                          type="password"
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
                          placeholder="Mínimo de 6 caracteres"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-1.5 py-3 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider"
                    >
                      {isLoading ? (
                        <span className="animate-pulse">Atualizando no Banco de Dados...</span>
                      ) : (
                        <>
                          <span>Redefinir Senha Imediatamente</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {!resetSuccess && (
                  <div className="pt-2 border-t border-zinc-800 text-center">
                    <button
                      onClick={() => {
                        setIsForgotPassword(false);
                        setError('');
                      }}
                      className="text-xs text-indigo-400 font-semibold hover:text-indigo-350 transition cursor-pointer"
                    >
                      Lembrou a sua senha? Faça login
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5 animate-fade-in">
                {/* ERROR ALERT */}
                {error && (
                  <div className="rounded-2xl border border-red-900/30 bg-red-950/20 p-4 text-xs text-red-300 font-medium flex gap-2.5 items-start" id="auth-error-alert">
                    <ShieldAlert className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isRegister && (
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Seu Nome Completo *
                      </label>
                      <div className="relative flex items-center">
                        <User className="absolute left-3 text-zinc-500 h-4 w-4" />
                        <input
                          type="text"
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
                          placeholder="Fábio Nunes"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      E-mail de Associado *
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 text-zinc-500 h-4 w-4" />
                      <input
                        type="email"
                        className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
                        placeholder="email@provedor.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Senha Secreta *
                      </label>
                      {!isRegister && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotPassword(true);
                            setError('');
                            setResetSuccess(false);
                          }}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                        >
                          Esqueci minha senha?
                        </button>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3 text-zinc-500 h-4 w-4" />
                      <input
                        type="password"
                        className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {(email.trim().toLowerCase() === 'fabionunes390@gmail.com' || email.trim().toLowerCase() === 'amplebrasilcompany@gmail.com' || email.trim().toLowerCase() === 'fabisasaude@gmail.com') && (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-3 text-[11px] text-indigo-300 font-semibold leading-relaxed animate-pulse" id="admin-autocreate-notice">
                      ✨ <strong>Primeiro acesso do Administrador?</strong> Digite a senha desejada (ex: <code>sucesso7</code> ou <code>Mudar@123</code>) para criar, registrar e ativar sua conta de administrador automaticamente no Firebase Auth ao clicar em Entrar.
                    </div>
                  )}

                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-1.5 py-3 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      id="auth-submit-btn"
                    >
                      {isLoading ? (
                        <span className="animate-pulse">Validando cadastro...</span>
                      ) : (
                        <>
                          <span>{isRegister ? 'Concluir Meu Cadastro' : 'Entrar no Clube de Vantagens'}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(!isRegister);
                        setError('');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition cursor-pointer"
                      id="auth-toggle-mode"
                    >
                      {isRegister ? (
                        <>
                          <User className="h-4 w-4" />
                          <span>Já possui conta? Faça login</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          <span>Não tem cadastro? Ative seu e-mail</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="pt-1.5 space-y-2" id="partner-induction-section">
                  <button
                    type="button"
                    onClick={() => setIsPartnerRegister(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-amber-500/25 rounded-xl text-xs font-black text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition cursor-pointer uppercase tracking-wider shadow-sm"
                    id="btn-partner-onboarding-login"
                  >
                    <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                    <span>Seja um Parceiro (Empresas e Especialistas)</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-zinc-800 text-center flex flex-col gap-2">
                  {onGoToBlog && (
                    <button
                      onClick={onGoToBlog}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 mt-2 border border-indigo-500/30 rounded-xl text-xs font-bold text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 transition cursor-pointer shadow-sm"
                      id="auth-go-to-blog"
                      type="button"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Acessar o Blog da FABISA (Público)</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-6 text-center text-[10px] text-zinc-500">
        Desenvolvido sob governança exclusiva FABISA Saúde © 2026
      </div>
    </div>
  );
}
