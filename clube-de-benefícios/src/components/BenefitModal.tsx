import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, ExternalLink, Phone, Mail, Ticket, Copy, Check, ShieldAlert, Sparkles, Clock, CreditCard, CheckCircle } from 'lucide-react';
import { Benefit, Company, Category } from '../types';

interface BenefitModalProps {
  benefit: Benefit | null;
  company: Company | null;
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onOpenLogin: () => void;
  userName?: string;
  onRedeemBenefit?: (saving: number) => void;
}

export default function BenefitModal({
  benefit,
  company,
  category,
  isOpen,
  onClose,
  isLoggedIn,
  onOpenLogin,
  userName,
  onRedeemBenefit
}: BenefitModalProps) {
  const [copied, setCopied] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [couponGenerated, setCouponGenerated] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes countdown
  const [showAssociatesCard, setShowAssociatesCard] = useState(false);
  const [hasConfirmedPurchase, setHasConfirmedPurchase] = useState(false);

  const logoSource = localStorage.getItem('fabisa_logo') || '';

  useEffect(() => {
    if (!isOpen) {
      setCouponGenerated(false);
      setVoucherCode('');
      setCopied(false);
      setShowAssociatesCard(false);
      setHasConfirmedPurchase(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: any;
    if (couponGenerated && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [couponGenerated, timeLeft]);

  if (!isOpen || !benefit || !company) return null;

  const handleGenerateCoupon = () => {
    setIsRedeeming(true);
    setTimeout(() => {
      const code = `CLUB-${company.name.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setVoucherCode(code);
      setCouponGenerated(true);
      setShowAssociatesCard(true); // Open the digital pop-up card automatically!
      setIsRedeeming(false);
      setTimeLeft(3600); // Reset timer
      setHasConfirmedPurchase(false); // Reset confirmation state for new coupon
    }, 1000);
  };

  const handleConfirmPurchase = () => {
    if (hasConfirmedPurchase) return;

    if (company.regularPrice !== undefined && company.discountedPrice !== undefined) {
      const difference = company.regularPrice - company.discountedPrice;
      if (difference > 0 && onRedeemBenefit) {
        onRedeemBenefit(difference);
      }
    }
    setHasConfirmedPurchase(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/55 backdrop-blur-sm" id="benefit-modal-overlay">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl transition-all" id="benefit-modal">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
          id="benefit-close-btn"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Header Hero Banner */}
        <div className="relative h-44 w-full bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 px-6 py-6 flex flex-col justify-end text-white">
          <div className="absolute top-4 left-4 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-xs font-semibold tracking-wider text-amber-300">
            {category?.name || 'Clube de Vantagens'}
          </div>
          <div className="flex items-center gap-4">
            <img
              src={company.logo}
              alt={company.name}
              className="h-16 w-16 rounded-xl border-2 border-white bg-white object-cover shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=200&h=200&fit=crop';
              }}
            />
            <div>
              <p className="text-xs font-medium text-indigo-200 uppercase tracking-widest">{company.name}</p>
              <h3 className="text-lg font-extrabold sm:text-xl tracking-tight leading-tight mt-0.5">{benefit.title}</h3>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Details */}
            <div className="md:col-span-2 space-y-5">
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Descrição do Benefício</h4>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed font-normal">{benefit.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Como Resgatar</h4>
                <div className="mt-2 rounded-xl bg-indigo-50/50 border border-indigo-100 p-3.5">
                  <p className="text-xs text-indigo-950 leading-relaxed font-medium">{benefit.howToRedeem}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-zinc-500 border-t border-zinc-100 pt-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  Válido até: <strong>{new Date(benefit.validUntil).toLocaleDateString('pt-BR')}</strong>
                </span>
                <span className="flex items-center gap-1 uppercase">
                  <span className={`inline-block h-2 w-2 rounded-full ${benefit.type === 'service' ? 'bg-sky-500' : 'bg-emerald-500'}`}></span>
                  {benefit.type === 'service' ? 'Cupom de Serviço' : 'Cupom de Produto'}
                </span>
              </div>
            </div>

            {/* Partner Info Sidebar */}
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 space-y-3.5">
              <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Sobre a Empresa</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">{company.description || 'Parceira autorizada do nosso clube.'}</p>
              
              <div className="space-y-2 border-t border-zinc-200/50 pt-3 text-xs text-zinc-600">
                <div className="flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400 mt-0.5 shrink-0" />
                  <span>{company.neighborhood}, {company.city}</span>
                </div>
                {company.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="break-all">{company.email}</span>
                  </div>
                )}
              </div>

              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-1 w-full rounded-lg bg-white border border-zinc-200 py-1.5 text-center text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-100"
                >
                  <span>Visitar Website</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {/* ACTIVE REDEEM ACTION PANEL */}
          <div className="border-t border-zinc-100 pt-6">
            {!isLoggedIn ? (
              /* User NOT logged in */
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 flex flex-col sm:flex-row items-center gap-4 justify-between" id="rescue-unauth">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-amber-950">Autenticação Necessária</h5>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Você precisa estar logado na sua conta cadastrada no Supabase para gerar ingressos e descontos.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onOpenLogin}
                  className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700 shadow-sm cursor-pointer"
                >
                  Entrar no Clube
                </button>
              </div>
            ) : couponGenerated ? (
              /* Voucher Created Success UI */
              <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/20 p-5 text-center space-y-4" id="rescue-success">
                <div className="flex items-center justify-center gap-1 text-xs font-bold text-indigo-700 uppercase tracking-widest animate-pulse">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Esse cupom expira em {formatTime(timeLeft)}</span>
                </div>

                <div className="mx-auto max-w-sm rounded-xl border border-zinc-200 bg-white p-4 shadow-md relative overflow-hidden flex flex-col items-center">
                  {/* Ticket Notch Decorations */}
                  <div className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full border border-zinc-200 bg-zinc-50"></div>
                  <div className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full border border-zinc-200 bg-zinc-50"></div>

                  <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">{company.name}</span>
                  <span className="text-lg font-black text-rose-500 mt-1 select-all">{benefit.discountValue}</span>
                  
                  {company.regularPrice !== undefined && company.discountedPrice !== undefined && (
                    <div className="mt-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Você economizou: R$ {(company.regularPrice - company.discountedPrice).toFixed(2)}!</span>
                    </div>
                  )}
                  
                  <div className="my-3 flex items-center justify-center gap-2 border-y border-dashed border-zinc-200 py-2.5 px-4 w-full">
                    <code className="text-base font-black tracking-widest text-zinc-800">{voucherCode}</code>
                    <button
                      onClick={copyToClipboard}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                        copied
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                          : 'border-zinc-200 bg-zinc-55 hover:bg-zinc-100 text-zinc-500'
                      }`}
                      title="Copiar Código"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  {copied && (
                    <span className="text-[10px] font-semibold text-emerald-600 tracking-wider">
                      Copiado para a área de transferência!
                    </span>
                  )}
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Apresente esse código no parceiro para garantir o desconto.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAssociatesCard(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                    id="btn-reopen-associates-card"
                  >
                    <CreditCard className="h-4 w-4" />
                    Abrir Cartão Digital do Associado FABISA
                  </button>
                </div>
              </div>
            ) : (
              /* Generate CTA */
              <div className="flex items-center justify-between" id="rescue-cta">
                <div className="hidden sm:block">
                  <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Garanta sua Oferta</h5>
                  <p className="text-xs text-zinc-400">Cupom 100% digital e gratuito.</p>
                </div>
                <button
                  onClick={handleGenerateCoupon}
                  disabled={isRedeeming}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-indigo-100 hover:opacity-90 active:scale-[0.98] transition cursor-pointer"
                >
                  <Ticket className="h-4 w-4" />
                  {isRedeeming ? 'Gerando Código...' : 'Resgatar Cupom de Desconto'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GORGEOUS FABISA ASSOCIATE DIGITAL CARD MODAL POPUP */}
      {showAssociatesCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in" id="associates-card-overlay">
          <div className="relative w-full max-w-sm rounded-[24px] bg-zinc-900 border border-zinc-800 shadow-2xl p-6 text-white overflow-hidden" id="associates-card-popup">
            {/* Design accents - background linear gradients */}
            <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
            
            {/* Glossy line effect */}
            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />

            {/* Header / Title */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                {logoSource ? (
                  <img 
                    src={logoSource} 
                    alt="FABISA Saúde" 
                    className="h-8 w-auto object-contain bg-white rounded-md px-1.5 py-0.5" 
                    id="card-fabisa-logo"
                  />
                ) : (
                  <div className="h-8 w-12 bg-zinc-800 animate-pulse rounded-md" />
                )}
                <div>
                  <h4 className="text-sm font-black tracking-wider text-white">FABISA SAÚDE</h4>
                  <p className="text-[9px] uppercase tracking-widest text-[#3b82f6] font-extrabold">Clube de Benefícios</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
                Associado Ativo
              </span>
            </div>

            {/* Card Body */}
            <div className="my-5 p-5 rounded-2xl bg-gradient-to-br from-zinc-850 to-zinc-900 border border-zinc-800 shadow-inner relative space-y-4">
              {/* Gold Chip / NFC Simulation */}
              <div className="flex justify-between items-start">
                <div className="w-10 h-7 rounded-md bg-gradient-to-br from-[#eab308]/40 to-[#eab308]/10 border border-[#eab308]/30 flex flex-col justify-between p-1.5">
                  <div className="grid grid-cols-3 gap-0.5 w-6 h-4 opacity-75">
                    <div className="border border-[#eab308]/20"></div>
                    <div className="border border-[#eab308]/20"></div>
                    <div className="border border-[#eab308]/20"></div>
                  </div>
                </div>
                {/* Visual indicator */}
                <div className="text-[10px] font-mono text-zinc-500 font-medium tracking-wide">FABISA-MEMBER-2026</div>
              </div>

              {/* Associate Name */}
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Nome do Associado</span>
                <p className="text-base font-extrabold text-white tracking-wide mt-0.5 capitalize">{userName || 'Associado Virtual'}</p>
              </div>

              {/* Partner Company */}
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Empresa Parceira</span>
                <div className="flex items-center gap-2 mt-1">
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="h-6 w-6 rounded-md object-cover bg-white"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=100&h=100&fit=crop';
                    }}
                  />
                  <p className="text-xs font-bold text-zinc-200">{company.name}</p>
                </div>
              </div>

              {/* Highlighted Discount */}
              <div className="p-3 bg-zinc-800/80 border border-zinc-750 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Benefício Ativado</span>
                  <p className="text-[11px] text-zinc-300 font-semibold truncate max-w-[150px]">{benefit.title}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-black text-[#eab308] tracking-tight block drop-shadow-md">{benefit.discountValue}</span>
                  {company.regularPrice !== undefined && company.discountedPrice !== undefined && (
                    <span className="text-[8.5px] font-bold text-[#4ade80] block mt-0.5">
                      R$ {(company.regularPrice - company.discountedPrice).toFixed(2)} OFF
                    </span>
                  )}
                </div>
              </div>

              {/* Simulated Barcode with Code */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-center items-center gap-[2px] h-10 bg-white px-3 py-1.5 rounded-lg" id="visual-card-barcode">
                  {[1.5, 3, 1, 2, 4, 1.5, 2, 3, 1, 4, 2, 1.5, 3, 1, 2, 4, 1.5, 2, 3, 1, 4, 2].map((w, idx) => (
                    <div key={idx} className="bg-zinc-950 h-full" style={{ width: `${w}px` }}></div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-1">
                  <code className="text-xs font-mono font-bold tracking-widest text-[#60a5fa]">{voucherCode}</code>
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#eab308] hover:text-[#facc15] transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copiante!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Purchase Action inside Card Body */}
              <div className="pt-3 border-t border-zinc-800/80" id="purchase-confirmation-panel">
                {!hasConfirmedPurchase ? (
                  <button
                    type="button"
                    onClick={handleConfirmPurchase}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-extrabold text-xs text-white shadow-lg shadow-emerald-950/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 border border-emerald-500/25"
                    id="btn-confirm-purchase"
                  >
                    <CheckCircle className="h-4 w-4 text-white" />
                    Confirmar Compra Realizada
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 font-bold text-xs text-center flex items-center justify-center gap-1.5 animate-pulse">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Benefício Registrado na sua Economia!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Instruction Warning / Notice Box */}
            <div className="p-4 rounded-2xl bg-[#eab308]/10 border border-[#eab308]/20 space-y-1" id="card-instructions">
              <p className="text-[10px] font-black text-[#eab308] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Apresentação no Balcão
              </p>
              <p className="text-[10px] leading-relaxed text-zinc-300 font-medium">
                Por favor, <strong>apresente esta tela diretamente no balcão do estabelecimento</strong> para que o gerente ou recepcionista valide seu desconto do associado FABISA.
              </p>
            </div>

            {/* Expire indicator & Close Action */}
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-zinc-800 pt-4">
              <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                <Clock className="h-3.5 w-3.5 text-[#3b82f6]" />
                <span>Expira em: <strong className="text-zinc-205">{formatTime(timeLeft)}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setShowAssociatesCard(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-extrabold text-white transition cursor-pointer"
                id="btn-close-card"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
