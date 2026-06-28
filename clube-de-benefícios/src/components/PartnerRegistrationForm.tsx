import React, { useState, useEffect } from 'react';
import { Building, Upload, X, Check, ArrowLeft, Phone, Mail, Globe, Tag, Sparkles, RefreshCw, Briefcase, FileText, Percent } from 'lucide-react';
import { FirebaseDatabase } from '../lib/firebaseDb';
import { Category, PartnerRegistration } from '../types';

interface PartnerRegistrationFormProps {
  onBack: () => void;
  categories: Category[];
}

export default function PartnerRegistrationForm({ onBack, categories: initialCategories }: PartnerRegistrationFormProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    tipo_parceiro: 'Empresa',
    companyName: '',
    logo: '',
    city: '',
    neighborhood: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    benefitTitle: '',
    benefitDescription: '',
    benefitValue: '',
    benefitType: 'service' as 'product' | 'service',
    categoryId: '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Load categories if they are empty
  useEffect(() => {
    if (categories.length === 0) {
      setIsLoadingCategories(true);
      FirebaseDatabase.getCategories()
        .then((cats) => {
          setCategories(cats);
          if (cats.length > 0) {
            setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
          }
        })
        .catch((e) => console.error('Error fetching categories in partner form', e))
        .finally(() => setIsLoadingCategories(false));
    } else {
      setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
    }
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type limit to JPG and PNG
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Apenas arquivos JPG ou PNG são permitidos.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize logo to max 200px for lightness
        const maxDim = 200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.85);
          setFormData(prev => ({ ...prev, logo: base64 }));
        } else {
          setFormData(prev => ({ ...prev, logo: event.target?.result as string }));
        }
        setIsUploading(false);
      };
      img.onerror = () => {
        setUploadError('Erro ao carregar a imagem. Tente outro arquivo.');
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const { companyName, city, neighborhood, email, phone, benefitTitle, benefitDescription, benefitValue, categoryId, tipo_parceiro } = formData;

    if (!companyName || !city || !neighborhood || !email || !phone || !benefitTitle || !benefitDescription || !benefitValue || !categoryId) {
      setError('Por favor, preencha todos os campos obrigatórios (*).');
      setIsSubmitting(false);
      return;
    }

    try {
      const regId = `reg-${Date.now()}`;
      await FirebaseDatabase.submitPartnerRegistration({
        id: regId,
        companyName,
        logo: formData.logo,
        city,
        neighborhood,
        phone,
        email,
        website: formData.website,
        description: formData.description,
        benefitTitle,
        benefitDescription,
        benefitValue,
        benefitType: formData.benefitType,
        categoryId,
        tipo_parceiro,
      });

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Error submitting partner registration form:', err);
      setError(`Ocorreu um erro ao salvar o cadastro: ${err.message || 'Erro de rede'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 animate-fade-in p-2 text-center" id="partner-reg-success">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 mx-auto shadow-lg animate-bounce">
          <Check className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white">Solicitação Enviada!</h2>
          <p className="text-sm text-zinc-300 leading-relaxed max-w-sm mx-auto">
            Obrigado pelo seu interesse em fazer parte do nosso clube de benefícios! O cadastro da sua empresa está aguardando análise pela equipe da <strong>FABISA Saúde</strong>.
          </p>
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-400 max-w-sm mx-auto space-y-2 text-left mt-4">
            <p className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" /> Próximos passos:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Análise de compatibilidade do benefício;</li>
              <li>Aprovação técnica pelo painel administrativo;</li>
              <li>Você receberá um contato no telefone/e-mail informado assim que aprovado.</li>
            </ul>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="w-full max-w-xs mt-4 inline-flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-xs font-bold text-zinc-900 bg-white hover:bg-zinc-100 transition shadow-sm cursor-pointer uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para o Login</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in text-left max-h-[85vh] overflow-y-auto pr-1" id="partner-reg-form">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          title="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-black text-white">Quero ser Parceiro</h2>
          <p className="text-[11px] text-zinc-400">Preencha os dados da sua empresa para enviar à aprovação.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-900/30 bg-red-950/20 p-4 text-xs text-red-300 font-medium flex gap-2.5 items-start">
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SECTION 1: DADOS DA EMPRESA */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="h-4 w-4" />
            1. Dados do Estabelecimento
          </h3>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Tipo de Cadastro *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipo_parceiro"
                  value="Empresa"
                  checked={formData.tipo_parceiro === 'Empresa'}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo_parceiro: e.target.value }))}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-600 bg-zinc-950 border-zinc-800"
                />
                <span className="text-xs text-white">Empresa</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipo_parceiro"
                  value="Profissional Liberal"
                  checked={formData.tipo_parceiro === 'Profissional Liberal'}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo_parceiro: e.target.value }))}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-600 bg-zinc-950 border-zinc-800"
                />
                <span className="text-xs text-white">Especialista (Profissional Liberal)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Nome da Empresa / Nome Fantasia *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
              placeholder="Ex: Clínica Sorriso Perfeito"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Cidade *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
                placeholder="Ex: Rio de Janeiro"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Bairro *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
                placeholder="Ex: Copacabana"
                value={formData.neighborhood}
                onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                WhatsApp / Telefone *
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3 text-zinc-500 h-3.5 w-3.5" />
                <input
                  type="text"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
                  placeholder="(21) 99999-8888"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                E-mail de Contato *
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 text-zinc-500 h-3.5 w-3.5" />
                <input
                  type="email"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
                  placeholder="comercial@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Categoria / Segmento *
              </label>
              {isLoadingCategories ? (
                <div className="text-xs text-zinc-500 animate-pulse py-2">Carregando categorias...</div>
              ) : (
                <select
                  required
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Website URL (Opcional)
              </label>
              <div className="relative flex items-center">
                <Globe className="absolute left-3 text-zinc-500 h-3.5 w-3.5" />
                <input
                  type="url"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
                  placeholder="https://suaempresa.com"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Logo da Empresa * (JPEG ou PNG)
            </label>
            {formData.logo ? (
              <div className="relative mt-1 flex items-center gap-3 p-3 border border-zinc-800 rounded-xl bg-zinc-950/50" id="logo-preview-box">
                <img
                  src={formData.logo}
                  alt="Logo Preview"
                  className="h-10 w-10 rounded-lg object-contain border border-zinc-800 bg-white"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=200&h=200&fit=crop';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">Logo carregada com sucesso</p>
                  <p className="text-[10px] text-zinc-500">Pronta para envio ao banco</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                  className="p-1 px-2 rounded-lg text-xs font-bold bg-zinc-900 border border-zinc-800 text-red-400 hover:bg-red-950 hover:text-red-300 transition cursor-pointer"
                >
                  Remover
                </button>
              </div>
            ) : (
              <div className="relative mt-1 border-2 border-dashed border-zinc-800 rounded-xl hover:border-indigo-500 transition-colors bg-zinc-950/20" id="logo-upload-box">
                <input
                  type="file"
                  accept=".png, .jpg, .jpeg, image/png, image/jpeg"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                />
                <div className="p-4 flex flex-col items-center justify-center text-center space-y-1.5">
                  <div className="p-2 rounded-lg bg-zinc-900 text-zinc-500">
                    {isUploading ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                    ) : (
                      <Upload className="h-4 w-4 text-zinc-400" />
                    )}
                  </div>
                  {isUploading ? (
                    <p className="text-xs font-bold text-indigo-400 animate-pulse">Convertendo logo...</p>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-zinc-300">Toque ou clique para carregar logo</p>
                      <p className="text-[10px] text-zinc-500">PNG ou JPG até 1MB</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {uploadError && (
              <div className="mt-2 text-xs text-red-400 font-medium p-2 bg-red-950/20 border border-red-900/30 rounded-lg">
                {uploadError}
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Breve Descrição do Negócio (Opcional)
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
              placeholder="Fale um pouco sobre as especialidades ou produtos da sua empresa..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>

        {/* SECTION 2: BENEFÍCIO PROPOSTO */}
        <div className="space-y-3 pt-2 border-t border-zinc-800">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="h-4 w-4" />
            2. Benefício / Desconto Oferecido
          </h3>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Título do Benefício Oferecido *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
              placeholder="Ex: 20% OFF em todas as consultas ou exames"
              value={formData.benefitTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, benefitTitle: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Valor do Desconto Resumido *
              </label>
              <div className="relative flex items-center">
                <Percent className="absolute left-3 text-zinc-500 h-3.5 w-3.5" />
                <input
                  type="text"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
                  placeholder="Ex: 20% OFF ou R$ 50 OFF"
                  value={formData.benefitValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, benefitValue: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Tipo do Benefício *
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, benefitType: 'service' }))}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                    formData.benefitType === 'service'
                      ? 'bg-indigo-650 text-white border-indigo-500'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  Serviço
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, benefitType: 'product' }))}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                    formData.benefitType === 'product'
                      ? 'bg-indigo-650 text-white border-indigo-500'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  Produto
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Como usufruir ou Regras do Benefício *
            </label>
            <textarea
              rows={3}
              required
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition"
              placeholder="Ex: Válido para consultas particulares de segunda a sexta-feira. Agendar previamente informando convênio FABISA Saúde."
              value={formData.benefitDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, benefitDescription: e.target.value }))}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-1.5 py-3 px-4 border border-transparent rounded-xl shadow-md text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider"
          id="partner-reg-submit-btn"
        >
          {isSubmitting ? (
            <span className="animate-pulse">Enviando Solicitação...</span>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Enviar Cadastro para Aprovação</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
