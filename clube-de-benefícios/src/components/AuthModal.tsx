import React, { useState } from 'react';
import { X, Mail, Lock, User, Sparkles, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (name: string, email: string) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (isRegister && !name) {
      setError('Nome é obrigatório para cadastro.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onLoginSuccess(isRegister ? name : email.split('@')[0], email);
      setSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm" id="auth-modal-overlay">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all" id="auth-modal-content">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
          id="auth-close-btn"
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-zinc-950">Autenticação bem-sucedida!</h3>
            <p className="mt-1 text-sm text-zinc-500">
              {isRegister ? 'Sua conta foi criada no Supabase.' : 'Acessando recursos exclusivos de membro...'}
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold tracking-widest text-amber-600 uppercase">Acesso Associado</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-zinc-950">
              {isRegister ? 'Crie sua Conta no Clube' : 'Entre no seu Clube de Vantagens'}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Tenha acesso a cupons, descontos em serviços e ofertas imperdíveis.
            </p>

            {/* ERROR */}
            {error && (
              <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {isRegister && (
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                    Nome Completo
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3 text-zinc-400 h-4 w-4" />
                    <input
                      type="text"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Fábio Nunes"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                  E-mail institucional / pessoal
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 text-zinc-400 h-4 w-4" />
                  <input
                    type="email"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                  Senha segura
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 text-zinc-400 h-4 w-4" />
                  <input
                    type="password"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                id="auth-submit-btn"
              >
                {isRegister ? 'Finalizar Cadastro' : 'Entrar no Clube'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs text-indigo-600 font-medium hover:underline"
                id="auth-toggle-mode"
              >
                {isRegister ? 'Já possui conta? Faça Login' : 'Ainda não é associado? Cadastre-se'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
