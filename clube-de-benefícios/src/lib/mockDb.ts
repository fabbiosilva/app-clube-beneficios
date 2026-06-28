import { Category, Company, Benefit } from '../types';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Alimentação', icon: 'Utensils', description: 'Restaurantes, cafés, bares e confeitarias' },
  { id: 'cat-2', name: 'Saúde e Bem-Estar', icon: 'HeartPulse', description: 'Academias, clínicas, farmácias e spas' },
  { id: 'cat-3', name: 'Educação', icon: 'GraduationCap', description: 'Cursos de idiomas, faculdades, escolas e mentorias' },
  { id: 'cat-4', name: 'Lazer e Cultura', icon: 'Film', description: 'Cinemas, shows, teatros e parques de diversão' },
  { id: 'cat-5', name: 'Serviços', icon: 'Wrench', description: 'Mecânicos, pet shops, chaveiros e lavanderias' },
  { id: 'cat-6', name: 'Compras', icon: 'ShoppingBag', description: 'E-commerces, vestuário, eletrônicos e presentes' },
];

const INITIAL_COMPANIES: Company[] = [
  {
    id: 'co-1',
    name: 'FitLife Academia',
    logo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&h=200&fit=crop',
    city: 'São Paulo',
    neighborhood: 'Pinheiros',
    website: 'https://fitlife-demo.com',
    phone: '(11) 98765-4321',
    email: 'parcerias@fitlife.com',
    description: 'Academia completa com musculação, natação, crossfit e pilates.'
  },
  {
    id: 'co-2',
    name: 'Sushi Prime',
    logo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=200&h=200&fit=crop',
    city: 'São Paulo',
    neighborhood: 'Vila Mariana',
    website: 'https://sushiprime-demo.com',
    phone: '(11) 97654-3210',
    email: 'contato@sushiprime.com',
    description: 'O melhor rodízio de comida japonesa contemporânea.'
  },
  {
    id: 'co-3',
    name: 'TalkEasy Idiomas',
    logo: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=200&h=200&fit=crop',
    city: 'Online',
    neighborhood: 'Nacional',
    website: 'https://talkeasy-demo.com',
    phone: '0800 555 1234',
    email: 'atendimento@talkeasy.com',
    description: 'Aulas de inglês, espanhol e francês com instrutores nativos.'
  },
  {
    id: 'co-4',
    name: 'Dr. Sorriso Clínicas',
    logo: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=200&h=200&fit=crop',
    city: 'Belo Horizonte',
    neighborhood: 'Savassi',
    website: 'https://drsorriso-demo.com',
    phone: '(31) 3456-7890',
    email: 'savassi@drsorriso.com',
    description: 'Referência em tratamentos estéticos e ortodontia.'
  },
  {
    id: 'co-5',
    name: 'CineMultiplex',
    logo: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=200&h=200&fit=crop',
    city: 'Rio de Janeiro',
    neighborhood: 'Copacabana',
    website: 'https://cinemulti-demo.com',
    phone: '(21) 2544-3322',
    email: 'cine@multiplex.com',
    description: 'Salas de cinema com tecnologia 4D e as melhores pipocas gourmet.'
  },
  {
    id: 'co-6',
    name: 'TechWorld Store',
    logo: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=200&h=200&fit=crop',
    city: 'Curitiba',
    neighborhood: 'Centro',
    website: 'https://techworld-demo.com',
    phone: '(41) 3012-9999',
    email: 'vendas@techworld.com',
    description: 'Eletrônicos, smartphones, notebooks e acessórios gamer.'
  }
];

const INITIAL_BENEFITS: Benefit[] = [
  {
    id: 'b-1',
    companyId: 'co-1',
    categoryId: 'cat-2',
    title: 'Isenção de taxa de adesão + 15% de desconto nas mensalidades',
    description: 'Válido para o plano Gold sem restrição de horário nas unidades participantes.',
    discountValue: '15% OFF',
    howToRedeem: 'Apresente o cupom gerado na recepção da academia no momento da matrícula presencial.',
    type: 'service',
    featured: true,
    validUntil: '2026-12-31'
  },
  {
    id: 'b-2',
    companyId: 'co-2',
    categoryId: 'cat-1',
    title: 'Ganhe 20% de desconto em todo o cardápio (A la Carte ou Rodízio)',
    description: 'Aproveite o melhor da gastronomia japonesa com um desconto exclusivo para associados. Válido de segunda a quinta-feira.',
    discountValue: '20% OFF',
    howToRedeem: 'No fechamento da conta, apresente o cupom e o documento de identidade ao garçom.',
    type: 'product',
    featured: true,
    validUntil: '2026-10-15'
  },
  {
    id: 'b-3',
    companyId: 'co-3',
    categoryId: 'cat-3',
    title: 'Bolsa de estudos de 30% em todo o curso de idiomas online',
    description: 'Aprenda um novo idioma no seu ritmo com professores qualificados e material didático incluso digitalmente.',
    discountValue: '30% DE DESCONTO',
    howToRedeem: 'Insira o código de cupom no campo promocional da página de checkout no site da TalkEasy.',
    type: 'service',
    featured: true,
    validUntil: '2026-12-31'
  },
  {
    id: 'b-4',
    companyId: 'co-4',
    categoryId: 'cat-2',
    title: 'Consulta de avaliação + Limpeza Gratuita (Profilaxia)',
    description: 'Mantenha sua saúde bucal em dia com atendimento premium e as melhores ferramentas diagnósticas sem custos adicionais.',
    discountValue: 'GRÁTIS',
    howToRedeem: 'Agende seu horário por telefone ou WhatsApp e informe que é beneficiário do clube.',
    type: 'service',
    featured: false,
    validUntil: '2026-08-30'
  },
  {
    id: 'b-5',
    companyId: 'co-5',
    categoryId: 'cat-4',
    title: 'Ingresso Meia-Entrada em qualquer dia da semana',
    description: 'Desconto de 50% no valor do ingresso inteiro para sessões 2D, 3D ou salas VIP do CineMultiplex.',
    discountValue: '50% MEIA-ENTRADA',
    howToRedeem: 'Selecione "Meia-Entrada Clube de Benefícios" na bilheteria física ou digite o código ao comprar pelo site/app.',
    type: 'service',
    featured: true,
    validUntil: '2026-11-30'
  },
  {
    id: 'b-6',
    companyId: 'co-6',
    categoryId: 'cat-6',
    title: '10% OFF em acessórios gamer e periféricos selecionados',
    description: 'Equipe o seu setup de jogos com as marcas mais recomendadas do mercado e garanta um preço campeão.',
    discountValue: '10% OFF',
    howToRedeem: 'Copie o código promocional gerado e cole no carrinho de compras da loja online.',
    type: 'product',
    featured: false,
    validUntil: '2026-09-01'
  }
];

export class MockStorageDatabase {
  static getStorageItem<T>(key: string, initialData: T): T {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(initialData));
      return initialData;
    }
    try {
      return JSON.parse(item) as T;
    } catch {
      return initialData;
    }
  }

  static setStorageItem<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  static getCategories(): Category[] {
    return this.getStorageItem<Category[]>('benefits_club_categories', INITIAL_CATEGORIES);
  }

  static getCompanies(): Company[] {
    return this.getStorageItem<Company[]>('benefits_club_companies', INITIAL_COMPANIES);
  }

  static getBenefits(): Benefit[] {
    return this.getStorageItem<Benefit[]>('benefits_club_benefits', INITIAL_BENEFITS);
  }

  static saveCategories(categories: Category[]): void {
    this.setStorageItem('benefits_club_categories', categories);
  }

  static saveCompanies(companies: Company[]): void {
    this.setStorageItem('benefits_club_companies', companies);
  }

  static saveBenefits(benefits: Benefit[]): void {
    this.setStorageItem('benefits_club_benefits', benefits);
  }

  // Create or Update operations
  static saveCompany(company: Company): void {
    const list = this.getCompanies();
    const index = list.findIndex(c => c.id === company.id);
    if (index >= 0) {
      list[index] = company;
    } else {
      list.push(company);
    }
    this.saveCompanies(list);
  }

  static deleteCompany(id: string): void {
    const companies = this.getCompanies().filter(c => c.id !== id);
    this.saveCompanies(companies);
    // Cascade delete benefits belonging to that company
    const benefits = this.getBenefits().filter(b => b.companyId !== id);
    this.saveBenefits(benefits);
  }

  static saveCategory(category: Category): void {
    const list = this.getCategories();
    const index = list.findIndex(c => c.id === category.id);
    if (index >= 0) {
      list[index] = category;
    } else {
      list.push(category);
    }
    this.saveCategories(list);
  }

  static deleteCategory(id: string): void {
    const categories = this.getCategories().filter(c => c.id !== id);
    this.saveCategories(categories);
    // Cascade delete/re-assign benefits
    const benefits = this.getBenefits().filter(b => b.categoryId !== id);
    this.saveBenefits(benefits);
  }

  static saveBenefit(benefit: Benefit): void {
    const list = this.getBenefits();
    const index = list.findIndex(b => b.id === benefit.id);
    if (index >= 0) {
      list[index] = benefit;
    } else {
      list.push(benefit);
    }
    this.saveBenefits(list);
  }

  static deleteBenefit(id: string): void {
    const benefits = this.getBenefits().filter(b => b.id !== id);
    this.saveBenefits(benefits);
  }
}
