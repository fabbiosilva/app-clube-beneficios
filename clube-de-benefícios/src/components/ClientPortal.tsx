import React, { useState, useMemo } from 'react';
import { Search, MapPin, Tag, ShoppingBag, Sparkles, Filter, RefreshCw, X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Benefit, Company, Category } from '../types';

// Helper to Safely render dynamic Lucide Icons from string database fields
export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent className={className || "h-5 w-5"} />;
}

interface ClientPortalProps {
  benefits: Benefit[];
  companies: Company[];
  categories: Category[];
  onSelectBenefit: (benefit: Benefit) => void;
  totalSaved?: number;
}

export default function ClientPortal({
  benefits,
  companies,
  categories,
  onSelectBenefit,
  totalSaved = 0,
}: ClientPortalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'product' | 'service'>('all');

  const validCompanies = useMemo(() => companies.filter(co => co.tipo_parceiro !== 'Profissional Liberal'), [companies]);

  // Dynamically find all unique regions (City - Neighborhood) available in active partners
  const uniqueRegions = useMemo(() => {
    const regionsSet = new Set<string>();
    validCompanies.forEach((co) => {
      const label = `${co.city} - ${co.neighborhood}`;
      regionsSet.add(label);
    });
    return Array.from(regionsSet).sort();
  }, [validCompanies]);

  // Compute stats for current listing
  const stats = useMemo(() => {
    return {
      totalOffers: benefits.length,
      partners: validCompanies.length,
      onlineOffers: benefits.filter(b => {
        const co = validCompanies.find(c => c.id === b.companyId);
        return co?.city.toLowerCase() === 'online';
      }).length,
    };
  }, [benefits, validCompanies]);

  // Combined Search and Filter Engine
  const filteredBenefits = useMemo(() => {
    return benefits.filter((b) => {
      const company = validCompanies.find((co) => co.id === b.companyId);
      const category = categories.find((cat) => cat.id === b.categoryId);
      if (!company) return false;

      // Filter 1: Search keyword (matches title, description, discount, or company name)
      const textMatch =
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.discountValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter 2: Category
      const categoryMatch = !selectedCategory || b.categoryId === selectedCategory;

      // Filter 3: Region
      const regionLabel = `${company.city} - ${company.neighborhood}`;
      const regionMatch = selectedRegion === 'all' || regionLabel === selectedRegion;

      // Filter 4: Type (Product / Service)
      const typeMatch = selectedType === 'all' || b.type === selectedType;

      return textMatch && categoryMatch && regionMatch && typeMatch;
    });
  }, [benefits, companies, categories, searchTerm, selectedCategory, selectedRegion, selectedType]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedRegion('all');
    setSelectedType('all');
  };

  const hasActiveFilters = searchTerm !== '' || selectedCategory !== null || selectedRegion !== 'all' || selectedType !== 'all';

  return (
    <div className="space-y-8 pb-16 animate-fade-in" id="client-portal">
      {/* HERO BANNER SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white" id="client-hero">
        {/* Background Decorative Gradient Radial */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_45%)]"></div>
        <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"></div>

        <div className="relative px-6 py-12 sm:px-12 sm:py-16 md:py-20 lg:px-16 max-w-4xl">
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 w-fit text-xs font-semibold text-amber-300">
            <Sparkles className="h-3.5 w-3.5 animate-spin-slow" />
            <span>EXCLUSIVO PARA ASSOCIADOS</span>
          </div>
          
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl leading-tight">
            Descubra descontos de até <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">50% OFF</span> nas melhores empresas
          </h1>
          <p className="mt-4 text-sm sm:text-base text-zinc-300 max-w-xl font-normal leading-relaxed">
            Seu portal oficial para economizar em alimentação, saúde, educação, serviços locais e e-commerce de forma prática. Seu benefício está a um clique!
          </p>

          {/* Quick Metrics */}
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-xs text-zinc-400">
            <div>
              <strong className="text-white text-base font-bold block">{stats.partners}</strong>
              Empresas Parceiras
            </div>
            <div className="border-l border-white/10 h-8 hidden sm:block"></div>
            <div>
              <strong className="text-white text-base font-bold block">{stats.totalOffers}</strong>
              Benefícios Ativos
            </div>
            <div className="border-l border-white/10 h-8 hidden sm:block"></div>
            <div>
              <strong className="text-white text-base font-bold block">{stats.onlineOffers}</strong>
              Ofertas Online / Nacional
            </div>
          </div>
        </div>
      </section>

      {/* MINHA ECONOMIA DASHBOARD CARD */}
      <section className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden" id="minha-economia-card">
        {/* Background micro accents */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_35%)]"></div>
        
        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md text-emerald-300">
            <Icons.TrendingUp className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-wider text-emerald-200 uppercase">Minha Economia</h3>
            <p className="text-2xl sm:text-3xl font-extrabold mt-1">
              R$ {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="text-center md:text-right relative z-10 w-full md:w-auto">
          <p className="text-sm sm:text-base font-bold text-emerald-100 leading-relaxed">
            Você já economizou <span className="text-amber-300 font-extrabold text-lg">R$ {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> com a FABISA Saúde!
          </p>
          <p className="text-[10px] text-emerald-250/80 mt-1 font-medium bg-black/10 px-2 py-1 rounded inline-block">
            Cada cupom ou benefício gerado acumula mais economia na sua conta.
          </p>
        </div>
      </section>

      {/* FEATURED PARTNERS / DESTAQUE DA SEMANA SECTION */}
      {validCompanies.some((co) => co.featured) && (
        <section className="space-y-4" id="secao-destaques-clube">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <span className="text-lg">🔥</span>
              <span>Destaques do Clube</span>
            </h2>
            <span className="bg-amber-400/10 text-amber-850 border border-amber-400/20 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Parceiros da Semana
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validCompanies
              .filter((co) => co.featured)
              .map((company) => {
                const companyBenefits = benefits.filter((b) => b.companyId === company.id);
                const displayDiscount =
                  companyBenefits.length > 0
                    ? companyBenefits[0].discountValue
                    : company.discountedPrice !== undefined &&
                      company.regularPrice !== undefined &&
                      company.regularPrice > 0
                    ? `${Math.round(((company.regularPrice - company.discountedPrice) / company.regularPrice) * 100)}% OFF`
                    : 'Oferta Especial';

                const representativeBenefit = companyBenefits[0] || null;

                return (
                  <div
                    key={company.id}
                    onClick={() => {
                      if (representativeBenefit) {
                        onSelectBenefit(representativeBenefit);
                      }
                    }}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-indigo-950 p-4 border border-zinc-850 hover:border-amber-500/40 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-row items-center gap-4"
                  >
                    {/* Background blur flare */}
                    <div className="absolute top-0 right-0 h-28 w-28 rounded-full bg-indigo-500/5 blur-xl group-hover:bg-amber-500/10 transition-all duration-300"></div>

                    <img
                      src={company.logo}
                      alt={company.name}
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover shrink-0 border border-zinc-800 bg-white group-hover:scale-102 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=200&h=200&fit=crop';
                      }}
                    />

                    <div className="flex-1 min-w-0 z-10 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-[8px] font-black tracking-wider text-amber-350 uppercase bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">Destaque</span>
                          <span className="text-[9px] font-semibold text-zinc-400">{company.neighborhood}, {company.city}</span>
                        </div>
                        <h3 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition duration-150 truncate">
                          {company.name}
                        </h3>
                        <p className="text-[10px] text-zinc-300 line-clamp-2 mt-0.5 leading-relaxed font-normal">
                          {company.description || 'Aproveite essa oferta exclusiva para associados do clube de vantagens FABISA Saúde.'}
                        </p>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="bg-gradient-to-r from-rose-600 to-pink-500 px-2.5 py-0.5 rounded-lg text-center shadow-lg text-[10px] font-black uppercase tracking-wider text-white">
                          {displayDiscount}
                        </div>
                        {representativeBenefit && (
                          <span className="text-[9.5px] font-bold text-zinc-400 group-hover:text-amber-200 transition flex items-center gap-0.5">
                            Quero meu cupom →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* QUICK CATEGORY RIBBON CARDS */}
      <section className="space-y-3" id="categories-filter-section">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Filtrar por Categoria</h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Ver Todas
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600'
                    : 'border-zinc-100 bg-white hover:border-zinc-300 shadow-xs'
                }`}
              >
                <div className={`p-2 rounded-lg mb-3 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-700'}`}>
                  <CategoryIcon name={cat.icon} />
                </div>
                <span className="text-xs font-bold text-zinc-900 leading-tight block">{cat.name}</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5 mt-auto">Filtrar benefícios</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SEARCH AND FILTERS CONTROLLER - Robust requirements */}
      <section className="rounded-2xl border border-zinc-100 bg-white shadow-xs p-5 space-y-4" id="filters-panel">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Keyword Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 h-4.5 w-4.5" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-zinc-50/50"
              placeholder="Digite o nome do parceiro ou palavra-chave (ex: academia, japonês)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Region Dropdown Filter - City/Neighborhood */}
          <div className="w-full md:w-64 relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 h-4.5 w-4.5" />
            <select
              className="w-full pl-10 pr-8 py-2.5 text-xs text-zinc-800 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-zinc-50/50 appearance-none cursor-pointer"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="all">Todas as Regiões (Nacional & Local)</option>
              {uniqueRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Type Selector Tabs (Products vs Services) */}
          <div className="flex rounded-xl bg-zinc-100 p-1 self-start md:self-auto shrink-0">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedType === 'all'
                  ? 'bg-white text-zinc-800 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedType('product')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedType === 'product'
                  ? 'bg-white text-zinc-800 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Produtos
            </button>
            <button
              onClick={() => setSelectedType('service')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedType === 'service'
                  ? 'bg-white text-zinc-800 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Serviços
            </button>
          </div>
        </div>

        {/* Clear filters banner */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-zinc-400 font-medium">Filtros ativos:</span>
              {searchTerm && <span className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded-md font-medium">Busca: "{searchTerm}"</span>}
              {selectedCategory && (
                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">
                  Categoria: {categories.find(c => c.id === selectedCategory)?.name}
                </span>
              )}
              {selectedRegion !== 'all' && (
                <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md font-medium">Região: {selectedRegion}</span>
              )}
              {selectedType !== 'all' && (
                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-medium">Tipo: {selectedType === 'product' ? 'Prods' : 'Servs'}</span>
              )}
            </div>
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-red-600 font-semibold hover:underline"
            >
              <X className="h-3.5 w-3.5" />
              Limpar Filtros
            </button>
          </div>
        )}
      </section>

      {/* OFFERS GRID LISTING */}
      <section className="space-y-4" id="offers-list">
        <h3 className="text-sm font-bold text-zinc-850 uppercase tracking-widest flex items-center justify-between">
          <span>Benefícios Encontrados ({filteredBenefits.length})</span>
          {searchTerm && <span className="text-[11px] font-normal text-zinc-400 p-1">Mostrando resultados para "{searchTerm}"</span>}
        </h3>

        {filteredBenefits.length === 0 ? (
          <div className="rounded-2xl border border-zinc-100 bg-white p-12 text-center max-w-md mx-auto space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
              <Filter className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-zinc-950">Nenhum benefício encontrado!</h4>
            <p className="text-xs text-zinc-500">
              Não encontramos ofertas para a seleção atual. Tente buscar termos genéricos ou limpe os filtros para recomeçar.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-2 text-xs font-semibold px-4 py-2 border rounded-xl hover:bg-zinc-55 flex items-center gap-1.5 mx-auto"
            >
              <RefreshCw className="h-3 w-3" />
              Ver Todas as Ofertas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBenefits.map((benefit) => {
              const company = validCompanies.find((co) => co.id === benefit.companyId);
              const category = categories.find((cat) => cat.id === benefit.categoryId);

              if (!company) return null;

              return (
                <div
                  key={benefit.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-xs hover:shadow-md transition duration-200"
                >
                  {/* Card Visual Header */}
                  <div className="relative h-28 bg-gradient-to-tr from-slate-50 to-zinc-100/40 p-4 flex justify-between items-start border-b border-zinc-100">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="h-12 w-12 rounded-xl object-cover border border-zinc-200/50 shadow-sm bg-white"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=200&h=200&fit=crop';
                      }}
                    />

                    {/* Category Label Badge */}
                    {category && (
                      <span className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-1 text-[10px] font-bold flex items-center gap-1">
                        <CategoryIcon name={category.icon} className="h-3 w-3 text-indigo-600" />
                        {category.name}
                      </span>
                    )}

                    {/* Discount banner badge */}
                    <div className="absolute bottom-3 left-4 rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-black text-white uppercase tracking-wider shadow-sm">
                      {benefit.discountValue}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{company.name}</span>
                      <h4 className="text-sm font-extrabold text-zinc-950 group-hover:text-amber-600 transition tracking-tight line-clamp-2 leading-snug">
                        {benefit.title}
                      </h4>
                      <p className="text-xs text-zinc-500 font-normal line-clamp-2 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>

                    {/* Meta info footer */}
                    <div className="border-t border-zinc-100/60 pt-3 mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[120px]">{company.city} - {company.neighborhood}</span>
                      </span>
                      <span className="font-semibold uppercase text-zinc-400 text-[10px]">
                        {benefit.type === 'service' ? 'Serviço' : 'Produto'}
                      </span>
                    </div>

                    {/* Active Button */}
                    <button
                      onClick={() => onSelectBenefit(benefit)}
                      className="w-full mt-2 cursor-pointer flex items-center justify-center gap-1 rounded-xl bg-zinc-900 group-hover:bg-indigo-600 py-2.5 text-center text-xs font-bold text-white transition tracking-wide shadow-2xs"
                    >
                      <span>Resgatar Desconto</span>
                      <Tag className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Featured ribbon effect */}
                  {benefit.featured && (
                    <div className="absolute top-0 right-0 h-11 w-11 overflow-hidden">
                      <div className="absolute top-2 right-[-24px] rotate-45 bg-amber-500 text-white text-[8px] font-black uppercase py-0.5 px-6 tracking-wide shadow-xs flex items-center justify-center">
                        ★ Destaque
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
