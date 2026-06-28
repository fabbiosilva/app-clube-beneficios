/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Category, Company, Benefit, AuthorizedEmail, PartnerRegistration, BlogPost } from '../types';

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
    description: 'Academia completa com musculação, natação, crossfit e pilates.',
    regularPrice: 150,
    discountedPrice: 120,
    featured: true
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
    description: 'O melhor rodízio de comida japonesa contemporânea.',
    regularPrice: 100,
    discountedPrice: 80,
    featured: true
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
    description: 'Aulas de inglês, espanhol e francês com instrutores nativos.',
    regularPrice: 300,
    discountedPrice: 210,
    featured: false
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
    description: 'Referência em tratamentos estéticos e ortodontia.',
    regularPrice: 180,
    discountedPrice: 0,
    featured: true
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
    description: 'Salas de cinema com tecnologia 4D e as melhores pipocas gourmet.',
    regularPrice: 40,
    discountedPrice: 20,
    featured: false
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
    description: 'Eletrônicos, smartphones, notebooks e acessórios gamer.',
    regularPrice: 500,
    discountedPrice: 450,
    featured: false
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

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function cleanUndefined<T>(obj: T): T {
  // Deep-serialize object to completely strip undefined keys, preventing Firestore crashes
  return JSON.parse(JSON.stringify(obj));
}

export class FirebaseDatabase {
  static async getCategories(): Promise<Category[]> {
    const path = 'categories';
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) {
        // Se estiver vazio, realiza seeds em lote e retorna INITIAL_CATEGORIES
        const batch = writeBatch(db);
        INITIAL_CATEGORIES.forEach((cat) => {
          const docRef = doc(db, path, cat.id);
          batch.set(docRef, cleanUndefined(cat));
        });
        await batch.commit();
        return INITIAL_CATEGORIES;
      }
      return snap.docs.map((doc) => doc.data() as Category);
    } catch (e) {
      console.error('Error fetching categories from Firestore, falling back', e);
      // Let's fallback gracefully to provide seamless previewing but log detailed info
      try {
        handleFirestoreError(e, OperationType.GET, path);
      } catch (err) {
        return INITIAL_CATEGORIES;
      }
    }
  }

  static async getCompanies(): Promise<Company[]> {
    const path = 'companies';
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) {
        // Se estiver vazio, realiza seeds em lote
        const batch = writeBatch(db);
        INITIAL_COMPANIES.forEach((co) => {
          const docRef = doc(db, path, co.id);
          batch.set(docRef, cleanUndefined(co));
        });
        await batch.commit();
        return INITIAL_COMPANIES;
      }
      return snap.docs.map((doc) => doc.data() as Company);
    } catch (e) {
      console.error('Error fetching companies from Firestore, falling back', e);
      try {
        handleFirestoreError(e, OperationType.GET, path);
      } catch (err) {
        return INITIAL_COMPANIES;
      }
    }
  }

  static async getBenefits(): Promise<Benefit[]> {
    const path = 'benefits';
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) {
        // Se estiver vazio, realiza seeds em lote
        const batch = writeBatch(db);
        INITIAL_BENEFITS.forEach((b) => {
          const docRef = doc(db, path, b.id);
          batch.set(docRef, cleanUndefined(b));
        });
        await batch.commit();
        return INITIAL_BENEFITS;
      }
      return snap.docs.map((doc) => doc.data() as Benefit);
    } catch (e) {
      console.error('Error fetching benefits from Firestore, falling back', e);
      try {
        handleFirestoreError(e, OperationType.GET, path);
      } catch (err) {
        return INITIAL_BENEFITS;
      }
    }
  }

  static async saveCategory(category: Category): Promise<void> {
    const path = `categories/${category.id}`;
    try {
      await setDoc(doc(db, 'categories', category.id), cleanUndefined(category));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  static async deleteCategory(id: string): Promise<void> {
    const path = `categories/${id}`;
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  static async saveCompany(company: Company): Promise<void> {
    const path = `companies/${company.id}`;
    try {
      await setDoc(doc(db, 'companies', company.id), cleanUndefined(company));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  static async deleteCompany(id: string): Promise<void> {
    const path = `companies/${id}`;
    try {
      // Excluir empresa parceira do Firestore
      await deleteDoc(doc(db, 'companies', id));
      
      // Cascatear exclusão de benefícios para evitar órfãos
      const q = query(collection(db, 'benefits'), where('companyId', '==', id));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  static async saveBenefit(benefit: Benefit): Promise<void> {
    const path = `benefits/${benefit.id}`;
    try {
      await setDoc(doc(db, 'benefits', benefit.id), cleanUndefined(benefit));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  static async deleteBenefit(id: string): Promise<void> {
    const path = `benefits/${id}`;
    try {
      await deleteDoc(doc(db, 'benefits', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  static async getAuthorizedEmails(): Promise<AuthorizedEmail[]> {
    const path = 'authorized_emails';
    const INITIAL_AUTHORIZED_EMAILS: AuthorizedEmail[] = [
      { id: 'fabionunes390_gmail_com', email: 'fabionunes390@gmail.com', addedAt: new Date().toISOString() },
      { id: 'amplebrasilcompany_gmail_com', email: 'amplebrasilcompany@gmail.com', addedAt: new Date().toISOString() },
      { id: 'fabisasaude_gmail_com', email: 'fabisasaude@gmail.com', addedAt: new Date().toISOString() },
      { id: 'cliente_teste_com', email: 'cliente@teste.com', addedAt: new Date().toISOString() },
      { id: 'fabio_nunes_empresa_com', email: 'fabio.nunes@empresa.com', addedAt: new Date().toISOString() }
    ];
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) {
        const batch = writeBatch(db);
        INITIAL_AUTHORIZED_EMAILS.forEach((item) => {
          const docRef = doc(db, path, item.id);
          batch.set(docRef, cleanUndefined(item));
        });
        await batch.commit();
        return INITIAL_AUTHORIZED_EMAILS;
      }
      return snap.docs.map((doc) => doc.data() as AuthorizedEmail);
    } catch (e) {
      console.error('Error fetching authorized emails, falling back', e);
      try {
        handleFirestoreError(e, OperationType.GET, path);
      } catch (err) {
        return INITIAL_AUTHORIZED_EMAILS;
      }
    }
  }

  static async saveAuthorizedEmail(emailObj: AuthorizedEmail): Promise<void> {
    const path = `authorized_emails/${emailObj.id}`;
    try {
      await setDoc(doc(db, 'authorized_emails', emailObj.id), cleanUndefined(emailObj));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  static async deleteAuthorizedEmail(id: string): Promise<void> {
    const path = `authorized_emails/${id}`;
    try {
      await deleteDoc(doc(db, 'authorized_emails', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  static async isEmailAuthorized(email: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'fabionunes390@gmail.com' || cleanEmail === 'amplebrasilcompany@gmail.com' || cleanEmail === 'fabisasaude@gmail.com') return true;
    try {
      const all = await this.getAuthorizedEmails();
      return all.some(item => item.email.trim().toLowerCase() === cleanEmail);
    } catch (e) {
      console.error('Check authorization failed, falling back to basic checks', e);
      return cleanEmail === 'fabionunes390@gmail.com' || cleanEmail === 'amplebrasilcompany@gmail.com' || cleanEmail === 'fabisasaude@gmail.com' || cleanEmail.endsWith('@empresa.com');
    }
  }

  static async getUserSavings(email: string): Promise<number> {
    const cleanEmail = email.trim().toLowerCase();
    const id = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    try {
      // First try to check localStorage as simple fallback cache
      const localVal = localStorage.getItem(`savings_${cleanEmail}`);
      const fallbackAmount = localVal ? parseFloat(localVal) : 0;

      const snap = await getDocs(collection(db, 'user_savings'));
      const matching = snap.docs.find(d => d.id === id);
      if (matching) {
        const cloudVal = matching.data().total_economizado || 0;
        // Keep the larger of the two in case local cached saves are ahead
        return Math.max(cloudVal, fallbackAmount);
      }
      return fallbackAmount;
    } catch (e) {
      console.error('Error fetching user savings from Firestore:', e);
      try {
        const localVal = localStorage.getItem(`savings_${cleanEmail}`);
        return localVal ? parseFloat(localVal) : 0;
      } catch {
        return 0;
      }
    }
  }

  static async saveUserSavings(email: string, total: number): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    const id = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Always persist to localStorage for instant client fallback
    try {
      localStorage.setItem(`savings_${cleanEmail}`, total.toString());
    } catch (err) {
      console.error(err);
    }

    try {
      await setDoc(doc(db, 'user_savings', id), {
        email: cleanEmail,
        total_economizado: total,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error saving user savings to Firestore:', e);
    }
  }

  static async submitPartnerRecommendation(recommendation: {
    companyName: string;
    location: string;
    sector: string;
    submittedBy?: string;
    type?: string;
    whatsapp?: string;
    origem?: string;
  }): Promise<void> {
    const id = `rec-${Date.now()}`;
    const path = `indicacoes_parceiros/${id}`;
    try {
      await setDoc(doc(db, 'indicacoes_parceiros', id), {
        id,
        companyName: recommendation.companyName,
        location: recommendation.location,
        sector: recommendation.sector,
        submittedBy: recommendation.submittedBy || 'Anônimo',
        submittedAt: new Date().toISOString(),
        type: recommendation.type || 'cliente',
        whatsapp: recommendation.whatsapp || '',
        origem: recommendation.origem || 'Interno'
      });
    } catch (e) {
      console.error('Error submitting partner recommendation:', e);
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  static async getPartnerRecommendations(): Promise<any[]> {
    const path = 'indicacoes_parceiros';
    try {
      const q = query(collection(db, path), orderBy('submittedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      console.error('Error fetching partner recommendations, trying without order:', e);
      try {
        const snapshot = await getDocs(collection(db, path));
        const items = snapshot.docs.map(doc => doc.data());
        return items.sort((a: any, b: any) => {
          const ad = a.submittedAt || '';
          const bd = b.submittedAt || '';
          return bd.localeCompare(ad);
        });
      } catch (innerError) {
        handleFirestoreError(innerError, OperationType.GET, path);
        return [];
      }
    }
  }

  static async submitPartnerRegistration(reg: Omit<PartnerRegistration, 'status' | 'submittedAt'>): Promise<void> {
    const id = reg.id || `reg-${Date.now()}`;
    const path = `partner_registrations/${id}`;
    const newReg: PartnerRegistration = {
      ...reg,
      id,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'partner_registrations', id), cleanUndefined(newReg));
    } catch (e) {
      console.error('Error submitting partner registration:', e);
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  static async createProfissional(data: any): Promise<void> {
    const id = `prof-${Date.now()}`;
    const path = `profissionais_parceiros/${id}`;
    const newProf = {
      ...data,
      id,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'profissionais_parceiros', id), cleanUndefined(newProf));
    } catch (e) {
      console.error('Error submitting profissional:', e);
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  }

  static async getProfissionais(publicOnly: boolean = false): Promise<any[]> {
    try {
      const companiesSnap = await getDocs(collection(db, 'companies'));
      const benefitsSnap = await getDocs(collection(db, 'benefits'));
      
      const companies = companiesSnap.docs.map(doc => doc.data() as Company);
      const benefits = benefitsSnap.docs.map(doc => doc.data() as Benefit);
      
      const profissionais = companies
        .filter(co => co.tipo_parceiro === 'Profissional Liberal')
        .map(co => {
          const benefit = benefits.find(b => b.companyId === co.id);
          let categoryStr = 'Outros';
          let descStr = co.description || '';
          
          if (descStr.startsWith('Categoria: ')) {
             const lines = descStr.split('\n');
             categoryStr = lines[0].replace('Categoria: ', '').trim();
             descStr = lines.slice(1).join('\n').trim();
          }

          return {
            id: co.id,
            name: co.name,
            category: categoryStr,
            location: co.city,
            phone: co.phone,
            benefit: benefit ? (benefit.title || benefit.discountValue) : 'Benefício exclusivo',
            description: descStr,
            imageUrl: co.logo,
            status: 'approved',
            submittedAt: new Date().toISOString()
          }
        });
        
      return profissionais;
    } catch (e) {
      console.error('Error fetching profissionais:', e);
      handleFirestoreError(e, OperationType.LIST, 'companies');
      return [];
    }
  }

  static async updateProfissionalStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    const path = `profissionais_parceiros/${id}`;
    try {
      const docRef = doc(db, 'profissionais_parceiros', id);
      await updateDoc(docRef, { status });
    } catch (e) {
      console.error('Error updating profissional status:', e);
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  }

  static async deleteProfissional(id: string): Promise<void> {
    const path = `profissionais_parceiros/${id}`;
    try {
      await deleteDoc(doc(db, 'profissionais_parceiros', id));
    } catch (e) {
      console.error('Error deleting profissional:', e);
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  static async getPartnerRegistrations(): Promise<PartnerRegistration[]> {
    const path = 'partner_registrations';
    try {
      const snap = await getDocs(collection(db, path));
      const list = snap.docs.map(doc => doc.data() as PartnerRegistration);
      return list.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    } catch (e) {
      console.error('Error fetching partner registrations:', e);
      try {
        handleFirestoreError(e, OperationType.GET, path);
      } catch (err) {
        return [];
      }
    }
  }

  static async updatePartnerRegistrationStatus(
    id: string,
    status: 'approved' | 'rejected',
    feedback?: string,
    registrationData?: PartnerRegistration
  ): Promise<void> {
    const path = `partner_registrations/${id}`;
    try {
      const docRef = doc(db, 'partner_registrations', id);
      const updatePayload: any = { status };
      if (feedback !== undefined) {
        updatePayload.feedback = feedback;
      }
      await setDoc(docRef, updatePayload, { merge: true });

      // If approved, create Company and Benefit
      if (status === 'approved' && registrationData) {
        const companyId = `co-reg-${registrationData.id}`;
        const benefitId = `b-reg-${registrationData.id}`;

        const companyPayload: Company = {
          id: companyId,
          name: registrationData.companyName,
          logo: registrationData.logo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=200&h=200&fit=crop',
          city: registrationData.city,
          neighborhood: registrationData.neighborhood,
          website: registrationData.website || '',
          phone: registrationData.phone,
          email: registrationData.email,
          description: registrationData.description || `Empresa parceira parceira registrada através da solicitação direta no clube.`,
          tipo_parceiro: registrationData.tipo_parceiro || 'Empresa',
          regularPrice: 0,
          discountedPrice: 0,
          featured: false
        };

        const benefitPayload: Benefit = {
          id: benefitId,
          companyId: companyId,
          categoryId: registrationData.categoryId,
          title: registrationData.benefitTitle,
          description: registrationData.benefitDescription,
          discountValue: registrationData.benefitValue,
          howToRedeem: 'Apresente o comprovante de associado do Clube FABISA no momento do contato/atendimento para usufruir do benefício.',
          type: registrationData.benefitType,
          featured: false,
          validUntil: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0] // Dec 31 of next year
        };

        // Save company and benefit
        await this.saveCompany(companyPayload);
        await this.saveBenefit(benefitPayload);
      }
    } catch (e) {
      console.error('Error updating partner registration status:', e);
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  // ---------------- BLOG POSTS METHODS ----------------

  static async getBlogPosts(): Promise<BlogPost[]> {
    const path = 'blog_posts';
    const INITIAL_BLOG_POSTS: BlogPost[] = [
      {
        id: 'post-1',
        title: 'Como economizar até 40% com saúde preventiva no Brasil',
        subtitle: 'Dicas práticas para utilizar seu plano de telemedicina e usufruir de consultas online sem sair de casa.',
        content: `Cuidar da saúde não precisa ser sinônimo de altos custos ou longas filas de espera. Com a expansão da telemedicina e a evolução dos clubes de benefícios integrados, os brasileiros têm agora à disposição ferramentas incríveis para economizar enquanto mantêm a prevenção em dia.

Neste artigo, vamos explorar como você pode extrair o máximo valor do seu ecossistema FABISA Saúde:

### 1. Consultas Rápidas e Triagem Digital
Evite ir ao pronto-socorro para sintomas leves. O atendimento online de clínica geral ou pediatria permite resolver até 85% dos casos comuns de forma imediata, poupando deslocamento e coparticipações desnecessárias.

### 2. O Poder do Clube de Vantagens
Você sabia que exames de laboratório e medicamentos de uso contínuo podem ter descontos de até 60% se comprados em parceiros credenciados? Sempre consulte a lista de parceiros do seu clube antes de pagar o preço cheio.

### 3. A Importância do Acompanhamento Regular
A prevenção custa menos do que o tratamento. Manter contato frequente com seu médico de família online evita complicações de condições crônicas como hipertensão e diabetes.

Utilize o Clube de Benefícios da FABISA Saúde a seu favor e proteja quem você ama com inteligência e economia!`,
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&h=450&fit=crop',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Equipe Editorial FABISA'
      },
      {
        id: 'post-2',
        title: 'Guia definitivo de descontos: Academias e Nutrição',
        subtitle: 'Descubra como montar uma rotina saudável economizando em mensalidades de academias e consultas nutricionais.',
        content: `Adotar hábitos saudáveis de vida, como a prática regular de exercícios e alimentação balanceada, é um dos melhores investimentos para o seu futuro. No entanto, muitas pessoas acreditam que manter esse estilo de vida custa caro.

Felizmente, com o Clube de Vantagens da FABISA Saúde, você tem acesso a parceiros de primeira linha no setor fitness e de bem-estar:

### Atividade Física com Desconto Real
Academias parceiras como a FitLife oferecem descontos de até 15% nas mensalidades e isenções exclusivas na taxa de matrícula. Ao longo de um ano, essa economia pode pagar múltiplos meses do plano!

### Alimentação e Suplementos
Lojas de produtos naturais e restaurantes com foco em culinária saudável também estão no radar. Ter acesso a descontos de 10% a 20% nesses estabelecimentos facilita muito a fidelidade à dieta sem estourar o orçamento doméstico.

Consulte o mapa e as categorias em nosso aplicativo e ative seus benefícios hoje mesmo!`,
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&h=450&fit=crop',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Fábio Mendes - Consultor de Bem-estar'
      }
    ];

    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) {
        const batch = writeBatch(db);
        INITIAL_BLOG_POSTS.forEach((post) => {
          const docRef = doc(db, path, post.id);
          batch.set(docRef, cleanUndefined(post));
        });
        await batch.commit();
        return INITIAL_BLOG_POSTS;
      }
      const list = snap.docs.map((doc) => doc.data() as BlogPost);
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (e) {
      console.error('Error fetching blog posts from Firestore, falling back', e);
      try {
        handleFirestoreError(e, OperationType.GET, path);
      } catch (err) {
        return INITIAL_BLOG_POSTS;
      }
    }
  }

  static async saveBlogPost(post: BlogPost): Promise<void> {
    const path = `blog_posts/${post.id}`;
    try {
      await setDoc(doc(db, 'blog_posts', post.id), cleanUndefined(post));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  static async deleteBlogPost(id: string): Promise<void> {
    const path = `blog_posts/${id}`;
    try {
      await deleteDoc(doc(db, 'blog_posts', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  // ---------------- DIRECT FIRESTORE AUTHENTICATION METHODS ----------------

  static async provisionAdminUser(): Promise<void> {
    const email = 'fabisasaude@gmail.com';
    const id = email.replace(/[^a-zA-Z0-9]/g, '_');
    try {
      const snap = await getDocs(collection(db, 'usuarios'));
      const exists = snap.docs.some(doc => doc.id === id || doc.data().email === email);
      if (!exists) {
        await setDoc(doc(db, 'usuarios', id), {
          id,
          email,
          name: 'Fábio Fabisa',
          password: 'sucesso7',
          role: 'admin',
          createdAt: new Date().toISOString()
        });
        console.log('Admin account fabisasaude@gmail.com auto-provisioned directly in Firestore!');
      }
    } catch (e) {
      console.error('Error auto-provisioning admin user in Firestore:', e);
    }
  }

  static async registerUser(name: string, email: string, passwordStr: string, role: 'client' | 'admin' = 'client'): Promise<any> {
    const cleanEmail = email.trim().toLowerCase();
    const id = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    
    // First check if user already exists
    const snap = await getDocs(collection(db, 'usuarios'));
    const exists = snap.docs.some(doc => doc.data().email === cleanEmail);
    if (exists) {
      const error: any = new Error('Este e-mail de associado já foi ativado!');
      error.code = 'auth/email-already-in-use';
      throw error;
    }

    const userData = {
      id,
      name,
      email: cleanEmail,
      password: passwordStr,
      role,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'usuarios', id), userData);
    return userData;
  }

  static async authenticateUser(email: string, passwordStr: string): Promise<{ name: string; email: string; role: string }> {
    const cleanEmail = email.trim().toLowerCase();
    
    const snap = await getDocs(collection(db, 'usuarios'));
    const userDoc = snap.docs.find(doc => doc.data().email === cleanEmail);
    
    if (!userDoc) {
      // If user does not exist in 'usuarios', check if this is an authorized email to let them register
      const isAuthorized = await this.isEmailAuthorized(cleanEmail);
      if (isAuthorized) {
        // Prompt them to register
        const error: any = new Error('E-mail elegível mas ainda não ativado!');
        error.code = 'auth/user-not-found';
        throw error;
      } else {
        const error: any = new Error('Acesso Restrito: E-mail não cadastrado como beneficiário.');
        error.code = 'auth/user-not-found';
        throw error;
      }
    }

    const data = userDoc.data();
    if (data.password !== passwordStr) {
      const error: any = new Error('Senha incorreta!');
      error.code = 'auth/wrong-password';
      throw error;
    }

    return {
      name: data.name || 'Usuário',
      email: data.email,
      role: data.role || 'client'
    };
  }

  static async resetUserPasswordDirectly(email: string, newPasswordStr: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    const id = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Check if user exists
    const snap = await getDocs(collection(db, 'usuarios'));
    const userDoc = snap.docs.find(doc => doc.data().email === cleanEmail);
    
    if (!userDoc) {
      const error: any = new Error('Este e-mail é elegível para o clube, mas ainda não foi ativado.');
      error.code = 'auth/user-not-found';
      throw error;
    }

    await setDoc(doc(db, 'usuarios', id), {
      password: newPasswordStr
    }, { merge: true });
  }

  static async getVisualConfig(): Promise<{ logoBase64?: string } | null> {
    const path = 'config';
    try {
      const docRef = doc(db, path, 'logo');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as { logoBase64?: string };
      }
      return null;
    } catch (error) {
      console.error('Error fetching visual config from Firestore:', error);
      return null;
    }
  }

  static async saveVisualConfig(logoBase64Str: string): Promise<void> {
    const path = 'config';
    try {
      await setDoc(doc(db, path, 'logo'), {
        id: 'logo',
        logoBase64: logoBase64Str,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/logo`);
    }
  }
}
