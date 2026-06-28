export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  city: string;
  neighborhood: string;
  website: string;
  phone: string;
  email: string;
  description?: string;
  regularPrice?: number;
  discountedPrice?: number;
  featured?: boolean;
  tipo_parceiro?: string;
}

export interface Benefit {
  id: string;
  companyId: string;
  categoryId: string;
  title: string;
  description: string;
  discountValue: string; // e.g. "20% OFF", "Isenção de Matrícula", "10% de desconto"
  howToRedeem: string;
  type: 'product' | 'service'; // Product or Service filter
  featured: boolean;
  validUntil: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'admin';
}

export interface AuthorizedEmail {
  id: string;
  email: string;
  addedAt: string;
}

export interface PartnerRegistration {
  id: string;
  companyName: string;
  logo: string;
  city: string;
  neighborhood: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  benefitTitle: string;
  benefitDescription: string;
  benefitValue: string;
  benefitType: 'product' | 'service';
  categoryId: string;
  tipo_parceiro?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  feedback?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  image: string;
  createdAt: string;
  updatedAt?: string;
  author?: string;
}

export interface Profissional {
  id: string;
  name: string;
  category: string;
  location: string;
  phone: string;
  benefit: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}


