import React, { useState } from 'react';
import { X, Building2, MapPin, Briefcase, Send, Check, Phone } from 'lucide-react';

interface RecommendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (recommendation: { 
    companyName: string; 
    location: string; 
    sector: string; 
    type: string; 
    whatsapp?: string;
    origem?: string;
  }) => Promise<void>;
  userEmail?: string;
  initialTypeOverride?: 'cliente' | 'proprietario';
  origemOverride?: string;
}

export default function RecommendModal({
  isOpen,
  onClose,
  onSubmit,
  userEmail,
  initialTypeOverride,
  origemOverride,
}: RecommendModalProps) {
  const [userType, setUserType] = useState<'cliente' | 'proprietario'>('cliente');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [sector, setSector] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setUserType(initialTypeOverride || 'cliente');
    }
  }, [isOpen, initialTypeOverride]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!companyName.trim() || !location.trim() || !sector.trim()) {
      setErrorMsg('Por favor, preencha todos os campos do formulário.');
      return;
    }

    if (userType === 'proprietario' && !whatsapp.trim()) {
      setErrorMsg('Por favor, informe o WhatsApp de contato Comercial.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        companyName: companyName.trim(),
        location: location.trim(),
        sector: sector.trim(),
        type: userType === 'proprietario' ? 'Proprietário' : 'Cliente',
        whatsapp: userType === 'proprietario' ? whatsapp.trim() : '',
        origem: origemOverride || 'Interno'
      });
      setIsDone(true);
      setCompanyName('');
      setLocation('');
      setSector('');
      setWhatsapp('');
      setTimeout(() => {
        setIsDone(false);
        onClose();
      }, 2500);
    } catch (e: any) {
      console.error(e);
      setErrorMsg('Ocorreu um erro ao enviar sua indicação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="recommend-modal-overlay">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
         className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-zinc-100 transition-all z-10 p-6 flex flex-col gap-4"
         id="recommend-modal-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <span className="text-[9px] font-black tracking-wider text-indigo-600 uppercase">Parcerias</span>
            <h3 className="text-base font-black text-zinc-900 mt-0.5">Indique uma Empresa</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isDone ? (
          <div className="py-8 flex flex-col items-center text-center gap-3 animate-fade-in" id="recommend-success-view">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto scale-110 shadow-sm">
              <Check className="h-6 w-6 stroke-[3]" />
            </div>
            <div>
              <p className="text-sm font-black text-zinc-900">Indicação Enviada!</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[280px] leading-relaxed">
                {userType === 'proprietario' 
                  ? 'Agradecemos o interesse! Nossa equipe analisará sua empresa e entrará em contato comercial via WhatsApp muito em breve.'
                  : 'Muito obrigado por ajudar a expandir o clube! Entraremos em contato com a empresa para propor uma parceria exclusiva.'
                }
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" id="recommend-form">
            {/* Classification selector */}
            <div className="space-y-1.5" id="user-type-selector-container">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Sua relação com a empresa:
              </label>
              <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-1 rounded-xl border border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    setUserType('cliente');
                    setErrorMsg('');
                  }}
                  className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
                    userType === 'cliente'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50'
                  }`}
                >
                  Sou Cliente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserType('proprietario');
                    setErrorMsg('');
                  }}
                  className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
                    userType === 'proprietario'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50'
                  }`}
                  id="btn-select-owner"
                >
                  Sou proprietário(a)
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              {userType === 'proprietario'
                ? 'Preencha os dados da sua empresa abaixo para que possamos analisar e cadastrá-la no clube de benefícios da FABISA Saúde.'
                : 'Gostaria de ver algum estabelecimento, clínica ou restaurante específico no nosso clube? Indique abaixo e entraremos em contato com eles.'}
            </p>

            {errorMsg && (
              <p className="text-xs bg-rose-50 text-rose-700 border border-rose-100 px-3 py-2 rounded-xl font-medium animate-pulse">
                ⚠️ {errorMsg}
              </p>
            )}

            {/* Nome da Empresa */}
            <div className="space-y-1">
              <label htmlFor="rec-companyName" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Nome da Empresa *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  id="rec-companyName"
                  className="block w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl text-xs placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  placeholder="Ex: Pizzaria Bella Italia"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Ramo / Segmento */}
            <div className="space-y-1">
              <label htmlFor="rec-sector" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Ramo de Atuação / Segmento *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Briefcase className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  id="rec-sector"
                  className="block w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl text-xs placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  placeholder="Ex: Alimentação, Odontologia, Academia"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Bairro / Cidade */}
            <div className="space-y-1">
              <label htmlFor="rec-location" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Bairro / Cidade *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  id="rec-location"
                  className="block w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl text-xs placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  placeholder="Ex: Copacabana, Rio de Janeiro"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* WhatsApp de contato Comercial (Adaptive, only shown for Owner) */}
            {userType === 'proprietario' && (
              <div className="space-y-1 animate-slide-down">
                <label htmlFor="rec-whatsapp" className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                  WhatsApp Comercial *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    id="rec-whatsapp"
                    className="block w-full pl-9 pr-3 py-2 border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl text-xs placeholder:text-zinc-400 outline-none transition bg-emerald-50/10"
                    placeholder="Ex: (21) 98688-9446"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            )}

            <div className="border-t border-zinc-100 pt-3.5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-50 rounded-xl transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-98"
                id="btn-submit-recommend"
              >
                {isSubmitting ? (
                  <span>Enviando...</span>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Enviar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
