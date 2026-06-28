import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Plus, Trash2, Edit2, Database, Shield, Building2,
  Bookmark, Award, Save, RefreshCw, Star, Info, Tag, ExternalLink, MapPin, Upload, Mail, Phone, Clock, Sparkles,
  Bold, Italic, Link, Heading3, List
} from 'lucide-react';
import { Company, Category, Benefit, AuthorizedEmail, PartnerRegistration, BlogPost } from '../types';
import { FirebaseDatabase } from '../lib/firebaseDb';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface AdminPortalProps {
  companies: Company[];
  categories: Category[];
  benefits: Benefit[];
  blogPosts: BlogPost[];
  onRefreshData: () => void;
  userEmail?: string;
  initialTab?: 'companies' | 'categories' | 'benefits' | 'blog';
}

export default function AdminPortal({
  companies,
  categories,
  benefits,
  blogPosts = [],
  onRefreshData,
  userEmail,
  initialTab,
}: AdminPortalProps) {
  const [isBeneficiaryModalOpen, setIsBeneficiaryModalOpen] = useState(false);
  const [isPartnershipsModalOpen, setIsPartnershipsModalOpen] = useState(false);
  
  // Admin is fully unlocked if logged in as the admin email, otherwise rely on password for fallback / flexibility
  const isAdminSession = userEmail?.trim().toLowerCase() === 'fabionunes390@gmail.com' || userEmail?.trim().toLowerCase() === 'amplebrasilcompany@gmail.com' || userEmail?.trim().toLowerCase() === 'fabisasaude@gmail.com';
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(true); 
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // TOAST / Feedback Message State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 4. Authorized/Whitelisted Emails State
  const [authorizedEmails, setAuthorizedEmails] = useState<AuthorizedEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);

  // 5. Profissionais Parceiros State
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [isLoadingProfissionais, setIsLoadingProfissionais] = useState(false);
  const [activeTab, setActiveTab ] = useState<'companies' | 'categories' | 'benefits' | 'blog' | 'profissionais'>('companies');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  const fetchProfissionais = async () => {
    setIsLoadingProfissionais(true);
    try {
      const res = await FirebaseDatabase.getProfissionais(false); // false gets all
      setProfissionais(res);
    } catch (e) {
      console.error(e);
      triggerToast('Erro ao buscar profissionais.', 'error');
    } finally {
      setIsLoadingProfissionais(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'profissionais') {
      fetchProfissionais();
    }
  }, [activeTab]);

  const handleApproveProfissional = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja APROVAR este profissional para exibição pública?')) return;
    try {
      await FirebaseDatabase.updateProfissionalStatus(id, 'approved');
      triggerToast('Profissional aprovado!');
      fetchProfissionais();
    } catch (e) {
      triggerToast('Erro ao aprovar profissional.', 'error');
    }
  };

  const handleRejectProfissional = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja REJEITAR (e excluir) este profissional?')) return;
    try {
      await FirebaseDatabase.deleteProfissional(id);
      triggerToast('Profissional removido!');
      fetchProfissionais();
    } catch (e) {
      triggerToast('Erro ao remover profissional.', 'error');
    }
  };

  const fetchAuthorizedEmails = async () => {
    setIsLoadingEmails(true);
    try {
      const res = await FirebaseDatabase.getAuthorizedEmails();
      setAuthorizedEmails(res);
    } catch (e) {
      console.error(e);
      triggerToast('Erro ao buscar e-mails autorizados.', 'error');
    } finally {
      setIsLoadingEmails(false);
    }
  };

  React.useEffect(() => {
    if (isBeneficiaryModalOpen) {
      fetchAuthorizedEmails();
    }
  }, [isBeneficiaryModalOpen]);

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToSave = newEmail.trim().toLowerCase();
    if (!emailToSave) return;

    if (!emailToSave.includes('@')) {
      triggerToast('Por favor, insira um e-mail válido.', 'error');
      return;
    }

    if (authorizedEmails.some(x => x.email.toLowerCase() === emailToSave)) {
      triggerToast('Este e-mail já está na lista!', 'error');
      return;
    }

    const payload: AuthorizedEmail = {
      id: emailToSave.replace(/[^a-zA-Z0-9]/g, '_'),
      email: emailToSave,
      addedAt: new Date().toISOString()
    };

    try {
      await FirebaseDatabase.saveAuthorizedEmail(payload);
      setNewEmail('');
      triggerToast('E-mail pré-autorizado com sucesso!');
      fetchAuthorizedEmails();
    } catch (e) {
      console.error(e);
      triggerToast('Erro ao salvar e-mail no Firestore.', 'error');
    }
  };

  const handleRemoveEmail = async (id: string, emailStr: string) => {
    const cleanStr = emailStr.toLowerCase();
    if (cleanStr === 'fabionunes390@gmail.com' || cleanStr === 'amplebrasilcompany@gmail.com' || cleanStr === 'fabisasaude@gmail.com') {
      triggerToast('Não é possível remover administradores mestres!', 'error');
      return;
    }
    if (window.confirm(`Tem certeza que deseja remover o e-mail ${emailStr} da lista de autorizados?`)) {
      try {
        await FirebaseDatabase.deleteAuthorizedEmail(id);
        triggerToast('E-mail removido da lista.', 'success');
        fetchAuthorizedEmails();
      } catch (e) {
        console.error(e);
        triggerToast('Erro ao remover e-mail do Firestore.', 'error');
      }
    }
  };

  // 5. Partnership Requests/Leads State
  const [partnerRequests, setPartnerRequests] = useState<any[]>([]);
  const [partnerRegistrations, setPartnerRegistrations] = useState<PartnerRegistration[]>([]);
  const [partnershipSubTab, setPartnershipSubTab] = useState<'leads' | 'approvals'>('approvals');
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const fetchPartnerRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const res = await FirebaseDatabase.getPartnerRecommendations();
      setPartnerRequests(res);
      const regs = await FirebaseDatabase.getPartnerRegistrations();
      setPartnerRegistrations(regs);
    } catch (e) {
      console.error(e);
      triggerToast('Erro ao buscar as solicitações de parceria.', 'error');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleApproveRegistration = async (item: PartnerRegistration) => {
    if (window.confirm(`Tem certeza de que deseja aprovar o parceiro "${item.companyName}"? O estabelecimento e o benefício de ${item.benefitValue} serão criados e publicados automaticamente!`)) {
      setIsLoadingRequests(true);
      try {
        await FirebaseDatabase.updatePartnerRegistrationStatus(item.id, 'approved', 'Aprovado pelo administrador.', item);
        triggerToast(`Empresa "${item.companyName}" e benefício publicados com sucesso no Clube de Vantagens!`);
        await fetchPartnerRequests();
        onRefreshData();
      } catch (err) {
        console.error(err);
        triggerToast('Erro ao aprovar o parceiro.', 'error');
      } finally {
        setIsLoadingRequests(false);
      }
    }
  };

  const handleRejectRegistration = async (item: PartnerRegistration) => {
    const feedback = window.prompt('Por favor, digite o motivo da rejeição ou feedback para a empresa (Opcional):', 'Não atende aos critérios da campanha atual.');
    if (feedback !== null) {
      setIsLoadingRequests(true);
      try {
        await FirebaseDatabase.updatePartnerRegistrationStatus(item.id, 'rejected', feedback);
        triggerToast(`Solicitação de "${item.companyName}" foi rejeitada.`);
        await fetchPartnerRequests();
      } catch (err) {
        console.error(err);
        triggerToast('Erro ao rejeitar solicitação.', 'error');
      } finally {
        setIsLoadingRequests(false);
      }
    }
  };

  React.useEffect(() => {
    if (isPartnershipsModalOpen) {
      fetchPartnerRequests();
    }
  }, [isPartnershipsModalOpen]);

  // -------------------------------------------------------------
  // BLOG POST CRUD STATE
  // -------------------------------------------------------------
  const [editingBlogPostId, setEditingBlogPostId] = useState<string | null>(null);
  const [isBlogUploading, setIsBlogUploading] = useState(false);
  const [blogForm, setBlogForm] = useState({
    title: '',
    subtitle: '',
    content: '',
    image: '',
    author: 'Equipe Editorial FABISA'
  });

  const insertFormatting = (type: 'bold' | 'italic' | 'link' | 'h3' | 'list') => {
    const textarea = document.getElementById('blog-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = blogForm.content;
    const selectedText = text.substring(start, end);

    let replacement = '';
    if (type === 'bold') {
      replacement = `**${selectedText || 'texto em negrito'}**`;
    } else if (type === 'italic') {
      replacement = `*${selectedText || 'texto em itálico'}*`;
    } else if (type === 'h3') {
      replacement = `\n### ${selectedText || 'Subtítulo'}\n`;
    } else if (type === 'list') {
      replacement = `\n- ${selectedText || 'Item da lista'}`;
    } else if (type === 'link') {
      const url = prompt('Digite a URL do link (ex: https://site.com):', 'https://');
      if (url === null) return; // cancelled
      replacement = `[${selectedText || 'Link'}](${url})`;
    }

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setBlogForm({ ...blogForm, content: newContent });

    // Refocus and select
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleBlogPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogForm.title || !blogForm.content) {
      triggerToast('Título e Conteúdo do Artigo são campos obrigatórios.', 'error');
      return;
    }

    const finalId = editingBlogPostId || `post-${Date.now()}`;
    const payload: BlogPost = {
      id: finalId,
      title: blogForm.title,
      subtitle: blogForm.subtitle,
      content: blogForm.content,
      image: blogForm.image || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&h=450&fit=crop',
      createdAt: editingBlogPostId ? (blogPosts.find(p => p.id === editingBlogPostId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: blogForm.author || 'Equipe Editorial FABISA'
    };

    try {
      await FirebaseDatabase.saveBlogPost(payload);
      triggerToast(editingBlogPostId ? 'Artigo atualizado com sucesso no Firestore!' : 'Novo artigo publicado com sucesso no blog da FABISA!');
      resetBlogForm();
      onRefreshData();
    } catch (err) {
      console.error(err);
      triggerToast('Erro ao salvar o artigo no banco de dados.', 'error');
    }
  };

  const resetBlogForm = () => {
    setBlogForm({
      title: '',
      subtitle: '',
      content: '',
      image: '',
      author: 'Equipe Editorial FABISA'
    });
    setEditingBlogPostId(null);
  };

  const selectBlogPostForEdit = (post: BlogPost) => {
    setEditingBlogPostId(post.id);
    setBlogForm({
      title: post.title,
      subtitle: post.subtitle,
      content: post.content,
      image: post.image,
      author: post.author || 'Equipe Editorial FABISA'
    });
  };

  const deleteBlogPost = async (id: string) => {
    if (window.confirm('Tem certeza de que deseja excluir permanentemente este artigo do Blog? Essa operação não pode ser desfeita.')) {
      try {
        await FirebaseDatabase.deleteBlogPost(id);
        triggerToast('Artigo removido permanentemente do Firestore.');
        onRefreshData();
        if (editingBlogPostId === id) {
          resetBlogForm();
        }
      } catch (err) {
        console.error(err);
        triggerToast('Erro ao excluir o artigo.', 'error');
      }
    }
  };

  const handleBlogPostImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      triggerToast('Apenas imagens JPG, PNG ou WEBP são permitidas.', 'error');
      return;
    }

    setIsBlogUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
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
          const base64 = canvas.toDataURL('image/jpeg', 0.75); // 75% quality for compression
          setBlogForm(prev => ({ ...prev, image: base64 }));
          triggerToast('Imagem do artigo convertida e anexada com sucesso!');
        } else {
          setBlogForm(prev => ({ ...prev, image: event.target?.result as string }));
          triggerToast('Imagem anexada com sucesso!');
        }
        setIsBlogUploading(false);
      };
      img.onerror = () => {
        setBlogForm(prev => ({ ...prev, image: event.target?.result as string }));
        triggerToast('Imagem vinculada!');
        setIsBlogUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      triggerToast('Erro ao ler o arquivo de imagem.', 'error');
      setIsBlogUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // FORM STATES
  // 1. Company Form State
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    logo: '',
    city: '',
    neighborhood: '',
    website: '',
    phone: '',
    email: '',
    description: '',
    regularPrice: '',
    discountedPrice: '',
    featured: false,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type limit to JPG and PNG
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      triggerToast('Apenas arquivos JPG ou PNG são permitidos.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redensificar/redimensionar a logo para no máximo 200px para ficar super leve (10-35kb) e evitar estourar o limite do Firestore (1MB)
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
          const base64 = canvas.toDataURL('image/jpeg', 0.85); // 85% qualidade para compactação excelente
          setCompanyForm(prev => ({ ...prev, logo: base64 }));
          triggerToast('Logo do dispositivo convertida para texto Base64 leve e anexada!');
        } else {
          setCompanyForm(prev => ({ ...prev, logo: event.target?.result as string }));
          triggerToast('Logo do dispositivo anexada com sucesso!');
        }
        setIsUploading(false);
      };
      img.onerror = () => {
        setCompanyForm(prev => ({ ...prev, logo: event.target?.result as string }));
        triggerToast('Logo do dispositivo vinculada.');
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      triggerToast('Erro ao ler o arquivo.', 'error');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // 2. Category Form State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: 'Ticket',
    description: '',
  });

  // 3. Benefit Form State
  const [editingBenefitId, setEditingBenefitId] = useState<string | null>(null);
  const [benefitForm, setBenefitForm] = useState({
    companyId: '',
    categoryId: '',
    title: '',
    description: '',
    discountValue: '',
    howToRedeem: '',
    type: 'service' as 'product' | 'service',
    featured: false,
    validUntil: '',
  });

  const triggerToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin' || adminPassword === '1234') {
      setIsAdminUnlocked(true);
      setAuthError('');
    } else {
      setAuthError('Senha administrativa incorreta. Use "admin" ou "1234" para testar.');
    }
  };

  // ==========================================
  // COMPANY CRUD OPERATORS
  // ==========================================
  const selectCompanyForEdit = (cop: Company) => {
    setEditingCompanyId(cop.id);
    setCompanyForm({
      name: cop.name,
      logo: cop.logo,
      city: cop.city,
      neighborhood: cop.neighborhood,
      website: cop.website,
      phone: cop.phone,
      email: cop.email,
      description: cop.description || '',
      regularPrice: cop.regularPrice !== undefined ? cop.regularPrice.toString() : '',
      discountedPrice: cop.discountedPrice !== undefined ? cop.discountedPrice.toString() : '',
      featured: !!cop.featured,
    });
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, logo, city, neighborhood, email, regularPrice, discountedPrice, featured } = companyForm;

    if (!name || !city || !neighborhood || !email || !regularPrice || !discountedPrice) {
      triggerToast('Preencha os campos obrigatórios (*).', 'error');
      return;
    }

    const priceReg = parseFloat(regularPrice);
    const priceDisc = parseFloat(discountedPrice);

    if (isNaN(priceReg) || isNaN(priceDisc)) {
      triggerToast('Os campos de preço devem ser números válidos.', 'error');
      return;
    }

    const payload: Company = {
      id: editingCompanyId || `co-${Date.now()}`,
      name,
      logo: logo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=200&h=200&fit=crop',
      city,
      neighborhood,
      website: companyForm.website,
      phone: companyForm.phone,
      email,
      description: companyForm.description,
      regularPrice: priceReg,
      discountedPrice: priceDisc,
      featured: !!featured,
    };

    try {
      await FirebaseDatabase.saveCompany(payload);
      onRefreshData();

      // Reset Form
      setCompanyForm({
        name: '',
        logo: '',
        city: '',
        neighborhood: '',
        website: '',
        phone: '',
        email: '',
        description: '',
        regularPrice: '',
        discountedPrice: '',
        featured: false,
      });
      setEditingCompanyId(null);
      triggerToast(editingCompanyId ? 'Empresa parceira atualizada no Firebase!' : 'Essa empresa foi cadastrada com sucesso.');
    } catch (error) {
      console.error(error);
      triggerToast('Erro ao salvar no Firebase.', 'error');
    }
  };

  const deleteCompany = async (id: string) => {
    if (window.confirm('Tem certeza? Isso excluirá todas as ofertas vinculadas a essa empresa.')) {
      try {
        await FirebaseDatabase.deleteCompany(id);
        onRefreshData();
        triggerToast('Empresa e suas ofertas foram deletadas do Firebase.', 'success');
      } catch (error) {
        console.error(error);
        triggerToast('Erro ao deletar do Firebase.', 'error');
      }
    }
  };

  // ==========================================
  // CATEGORY CRUD OPERATORS
  // ==========================================
  const selectCategoryForEdit = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCategoryForm({
      name: cat.name,
      icon: cat.icon,
      description: cat.description || '',
    });
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) {
      triggerToast('Insira o nome da categoria.', 'error');
      return;
    }

    const payload: Category = {
      id: editingCategoryId || `cat-${Date.now()}`,
      name: categoryForm.name,
      icon: categoryForm.icon,
      description: categoryForm.description,
    };

    try {
      await FirebaseDatabase.saveCategory(payload);
      onRefreshData();

      setCategoryForm({ name: '', icon: 'Ticket', description: '' });
      setEditingCategoryId(null);
      triggerToast(editingCategoryId ? 'Categoria atualizada!' : 'Nova categoria criada!');
    } catch (error) {
      console.error(error);
      triggerToast('Erro ao salvar categoria no Firebase.', 'error');
    }
  };

  const deleteCategory = async (id: string) => {
    if (window.confirm('Excluir esta categoria? Benefícios vinculados a ela permanecerão órfãos.')) {
      try {
        await FirebaseDatabase.deleteCategory(id);
        onRefreshData();
        triggerToast('Categoria removida do Firebase.', 'success');
      } catch (error) {
        console.error(error);
        triggerToast('Erro ao remover categoria do Firebase.', 'error');
      }
    }
  };

  // ==========================================
  // BENEFITS CRUD OPERATORS
  // ==========================================
  const selectBenefitForEdit = (b: Benefit) => {
    setEditingBenefitId(b.id);
    setBenefitForm({
      companyId: b.companyId,
      categoryId: b.categoryId,
      title: b.title,
      description: b.description,
      discountValue: b.discountValue,
      howToRedeem: b.howToRedeem,
      type: b.type,
      featured: b.featured,
      validUntil: b.validUntil,
    });
  };

  const handleBenefitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { companyId, categoryId, title, discountValue, howToRedeem, validUntil } = benefitForm;

    if (!companyId || !categoryId || !title || !discountValue || !howToRedeem || !validUntil) {
      triggerToast('Preencha todos os campos obrigatórios da oferta.', 'error');
      return;
    }

    const payload: Benefit = {
      id: editingBenefitId || `b-${Date.now()}`,
      companyId,
      categoryId,
      title,
      description: benefitForm.description,
      discountValue,
      howToRedeem,
      type: benefitForm.type,
      featured: benefitForm.featured,
      validUntil,
    };

    try {
      await FirebaseDatabase.saveBenefit(payload);
      onRefreshData();

      setBenefitForm({
        companyId: '',
        categoryId: '',
        title: '',
        description: '',
        discountValue: '',
        howToRedeem: '',
        type: 'service',
        featured: false,
        validUntil: '',
      });
      setEditingBenefitId(null);
      triggerToast(editingBenefitId ? 'Benefício alterado com sucesso!' : 'Novo benefício ativado!');
    } catch (error) {
      console.error(error);
      triggerToast('Erro ao salvar no Firebase.', 'error');
    }
  };

  const deleteBenefit = async (id: string) => {
    if (window.confirm('Excluir esta oferta de benefício?')) {
      try {
        await FirebaseDatabase.deleteBenefit(id);
        onRefreshData();
        triggerToast('Benefício removido com sucesso.', 'success');
      } catch (error) {
        console.error(error);
        triggerToast('Erro ao remover benefício do Firebase.', 'error');
      }
    }
  };


   // ADMIN LOCK GATE
  if (!isAdminUnlocked && !isAdminSession) {
    return (
      <div className="mx-auto max-w-md my-16 rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg text-center space-y-5" id="admin-gate">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <Shield className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-zinc-950">Acesso Restrito ao Admin</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Digite a senha mestra para desbloquear o gerenciamento de empresas e ofertas.
          </p>
        </div>

        {authError && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 font-semibold">
            {authError}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-3">
          <input
            type="password"
            className="w-full text-center px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="Senha (use 'admin' ou '1234')"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
          >
            Desbloquear Painel Admin
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-x-hidden space-y-8 pb-20 animate-fade-in" id="admin-dashboard">
      
      {/* LOCAL TOAST NOTIFICATION CONTAINER */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-bold shadow-lg flex items-center gap-2 animate-bounce ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-amber-400'
        }`} id="admin-toast">
          <Info className="h-4 w-4" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* DASHBOARD STATS ROW */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4" id="admin-stats">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Empresas Parceiras</span>
            <strong className="text-2xl font-black text-zinc-900 block mt-1">{companies.length}</strong>
          </div>
          <div className="rounded-xl bg-sky-50 text-sky-600 p-2.5">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Categorias Ativas</span>
            <strong className="text-2xl font-black text-zinc-900 block mt-1">{categories.length}</strong>
          </div>
          <div className="rounded-xl bg-indigo-50 text-indigo-600 p-2.5">
            <Bookmark className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Ofertas de Cashback/Desconto</span>
            <strong className="text-2xl font-black text-zinc-900 block mt-1">{benefits.length}</strong>
          </div>
          <div className="rounded-xl bg-rose-50 text-rose-600 p-2.5">
            <Award className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-indigo-600 p-5 shadow-xs text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-indigo-200 uppercase">Status do Banco</span>
            <span className="text-sm font-extrabold block mt-1.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Conectado (Firebase Firestore)
            </span>
          </div>
          <div className="rounded-xl bg-white/10 p-2.5">
            <Database className="h-5 w-5" />
          </div>
        </div>
      </section>

      {/* DASHBOARD TAB NAVIGATION */}
      <section className="flex items-center gap-1 border-b border-zinc-100 pb-px" id="admin-tabs">
        <button
          onClick={() => setActiveTab('companies')}
          className={`flex-1 sm:flex-initial text-center px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'companies'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Parceiros (Empresas)
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 sm:flex-initial text-center px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Categorias de Benefício
        </button>
        <button
          onClick={() => setActiveTab('benefits')}
          className={`flex-1 sm:flex-initial text-center px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'benefits'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Ofertas / Cupons
        </button>
        <button
          onClick={() => setActiveTab('blog')}
          className={`flex-1 sm:flex-initial text-center px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'blog'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
          id="btn-tab-blog"
        >
          Blog (Artigos)
        </button>
        <button
          onClick={() => setActiveTab('profissionais')}
          className={`flex-1 sm:flex-initial text-center px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'profissionais'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
          id="btn-tab-profissionais"
        >
          Profissionais Parceiros
        </button>
      </section>

      {/* INNER VIEWPORTS */}
      <section id="admin-workspace">
        {/* ========================================================== */}
        {/* TAB 1: COMPANIES (PARCEIROS) CRUD */}
        {/* ========================================================== */}
        {activeTab === 'companies' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="tab-companies">
            {/* Form Column */}
            <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs space-y-4 h-fit">
              <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-3">
                <Plus className="h-4.5 w-4.5 text-zinc-500" />
                {editingCompanyId ? 'Editar Empresa Parceira' : 'Cadastrar Nova Empresa'}
              </h3>

              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Nome da Empresa *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-indigo-500 bg-zinc-50/20"
                    placeholder="Ex: Pizzaria Bella"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Cidade *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 text-xs border rounded-lg"
                      placeholder="Ex: São Paulo"
                      value={companyForm.city}
                      onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Bairro *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 text-xs border rounded-lg"
                      placeholder="Ex: Pinheiros"
                      value={companyForm.neighborhood}
                      onChange={(e) => setCompanyForm({ ...companyForm, neighborhood: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">E-mail Corporativo *</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                    placeholder="parceiro@exemplo.com"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3" id="admin-company-prices">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Preço Normal (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-indigo-500"
                      placeholder="Ex: 150.00"
                      value={companyForm.regularPrice}
                      onChange={(e) => setCompanyForm({ ...companyForm, regularPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Preço com Desconto FABISA (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-indigo-500"
                      placeholder="Ex: 120.00"
                      value={companyForm.discountedPrice}
                      onChange={(e) => setCompanyForm({ ...companyForm, discountedPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 py-1.5 px-3 bg-indigo-50/50 border border-indigo-100 rounded-xl" id="admin-company-featured">
                  <input
                    type="checkbox"
                    id="company-featured-chk"
                    className="h-4 w-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500 cursor-pointer"
                    checked={companyForm.featured}
                    onChange={(e) => setCompanyForm({ ...companyForm, featured: e.target.checked })}
                  />
                  <label htmlFor="company-featured-chk" className="text-xs font-bold text-indigo-950 select-none cursor-pointer">
                    ⭐ Destaque do Clube (Exibir no topo da Home)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Telefone / Whats</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-xs border rounded-lg"
                      placeholder="(11) 98888-7777"
                      value={companyForm.phone}
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Website URL</label>
                    <input
                      type="url"
                      className="w-full px-3 py-2 text-xs border rounded-lg"
                      placeholder="https://exemplo.com"
                      value={companyForm.website}
                      onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                    />
                  </div>
                </div>

                 <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Logo da Empresa * (JPEG ou PNG)</label>
                   {companyForm.logo ? (
                    <div className="relative mt-1 flex items-center gap-3 p-3 border border-zinc-200 rounded-xl bg-zinc-50/50" id="logo-preview-box">
                      <img
                        src={companyForm.logo}
                        alt="Logo Preview"
                        className="h-12 w-12 rounded-lg object-contain border border-zinc-200 shadow-xs bg-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=200&h=200&fit=crop';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-800 truncate">Logo adicionada</p>
                        <p className="text-[10px] text-zinc-400 truncate">Convertida em string de texto leve do Firestore</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCompanyForm({ ...companyForm, logo: '' })}
                        className="p-1 px-2 rounded-lg text-xs font-bold bg-white border border-zinc-200 text-red-600 hover:bg-red-50 hover:border-red-150 transition cursor-pointer"
                        id="btn-remove-logo"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="relative mt-1 border-2 border-dashed border-zinc-200 rounded-xl hover:border-indigo-400 transition-colors bg-zinc-50/30" id="logo-upload-box">
                      <input
                        type="file"
                        accept=".png, .jpg, .jpeg, image/png, image/jpeg"
                        onChange={handleLogoUpload}
                        disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                      />
                      <div className="p-4 flex flex-col items-center justify-center text-center space-y-1.5">
                        <div className="p-2 rounded-lg bg-zinc-100 text-zinc-500">
                          {isUploading ? (
                            <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                          ) : (
                            <Upload className="h-4 w-4 text-zinc-400" />
                          )}
                        </div>
                        {isUploading ? (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-indigo-600 animate-pulse">Convertendo imagem...</p>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-zinc-700">Selecione ou clique para carregar a logo</p>
                            <p className="text-[10px] text-zinc-400 font-medium">PNG ou JPG (será otimizado automaticamente)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {uploadError && (
                    <div className="mt-2 text-xs text-red-650 font-medium p-2 bg-red-50 border border-red-100 rounded-lg">
                      {uploadError}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Descrição Comercial</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                    placeholder="Fale um pouco sobre o parceiro, especialidade..."
                    value={companyForm.description}
                    onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{editingCompanyId ? 'Salvar Edição' : 'Cadastrar Empresa'}</span>
                  </button>
                  {editingCompanyId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCompanyId(null);
                        setCompanyForm({ name: '', logo: '', city: '', neighborhood: '', website: '', phone: '', email: '', description: '', regularPrice: '', discountedPrice: '', featured: false });
                      }}
                      className="px-3 border rounded-lg text-xs"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Column */}
            <div className="lg:col-span-2 rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-3">
                Parceiros Integrados ({companies.length})
              </h3>

              <div className="divide-y divide-zinc-100 max-h-[500px] overflow-y-auto pr-1">
                {companies.map((co) => (
                  <div key={co.id} className="flex gap-4 py-3 items-start justify-between">
                    <div className="flex gap-3">
                      <img
                        src={co.logo}
                        alt={co.name}
                        className="h-11 w-11 rounded-lg object-cover border border-zinc-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=200&h=200&fit=crop';
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-zinc-950">{co.name}</h4>
                          {co.featured && (
                            <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">⭐ Destaque</span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-zinc-300" />
                          {co.neighborhood}, {co.city}
                        </p>
                        {co.regularPrice !== undefined && co.discountedPrice !== undefined ? (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[9px] bg-indigo-50/50 border border-indigo-100 text-indigo-950 px-2 py-0.5 rounded font-medium">
                            <span>Padrão: R$ {co.regularPrice.toFixed(2)}</span>
                            <span className="text-indigo-200">|</span>
                            <span>Clube: R$ {co.discountedPrice.toFixed(2)}</span>
                            <span className="text-indigo-200">|</span>
                            <span className="text-emerald-700 font-bold">Economia: R$ {(co.regularPrice - co.discountedPrice).toFixed(2)}</span>
                          </div>
                        ) : (
                          <p className="text-[9px] text-amber-600 font-semibold mt-1">Preços pendentes</p>
                        )}
                        <p className="text-[10px] text-zinc-500 mt-1 line-clamp-1 italic">{co.description || 'Nenhuma descrição adicional.'}</p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => selectCompanyForEdit(co)}
                        className="p-1.5 text-zinc-500 hover:text-indigo-600 rounded hover:bg-zinc-100"
                        title="Editar"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCompany(co.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-600 rounded hover:bg-red-50"
                        title="Deletar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 2: CATEGORIES (CATEGORIAS) CRUD */}
        {/* ========================================================== */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="tab-categories">
            {/* Form Column */}
            <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs space-y-4 h-fit">
              <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-3">
                <Plus className="h-4.5 w-4.5" />
                {editingCategoryId ? 'Alterar Categoria' : 'Criar Nova Categoria'}
              </h3>

              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Nome da Categoria *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-indigo-500"
                    placeholder="Ex: Viagens e Aventuras"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Atalho de Ícone (Lucide-react) *</label>
                  <select
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-indigo-500"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  >
                    <option value="Utensils">Utensils (Alimentação)</option>
                    <option value="HeartPulse">HeartPulse (Saúde/Pilates/Academia)</option>
                    <option value="GraduationCap">GraduationCap (Educação/Idiomas)</option>
                    <option value="Film">Film (Lazer/Teatros/Cinema)</option>
                    <option value="Wrench">Wrench (Serviços/Petshop/Mecânico)</option>
                    <option value="ShoppingBag">ShoppingBag (E-commerce/Compras)</option>
                    <option value="Sparkles">Sparkles (Estética/Artes)</option>
                    <option value="Plane">Plane (Passagens/Viagem)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Breve Descrição</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                    placeholder="Descritivo curto da categoria para auxiliar o cliente..."
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{editingCategoryId ? 'Salvar Edição' : 'Cadastrar Categoria'}</span>
                  </button>
                  {editingCategoryId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(null);
                        setCategoryForm({ name: '', icon: 'Ticket', description: '' });
                      }}
                      className="px-3 border rounded-lg text-xs"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Column */}
            <div className="lg:col-span-2 rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-3">
                Categorias no Banco ({categories.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <div key={cat.id} className="rounded-xl border border-zinc-100 p-4 flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                        <Bookmark className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">{cat.name}</h4>
                        <p className="text-[10px] text-zinc-400 mt-1">Ícone selecionado: {cat.icon}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 italic">{cat.description || 'Sem descrição.'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => selectCategoryForEdit(cat)}
                        className="p-1 text-zinc-400 hover:text-indigo-600 rounded"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="p-1 text-zinc-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 3: BENEFITS (OFERTAS) CRUD */}
        {/* ========================================================== */}
        {activeTab === 'benefits' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="tab-benefits">
            {/* Form Column */}
            <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs space-y-4 h-fit">
              <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-3">
                <Plus className="h-4.5 w-4.5" />
                {editingBenefitId ? 'Editar Oferta cadastrada' : 'Adicionar Nova Oferta'}
              </h3>

              <form onSubmit={handleBenefitSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Selecione a Empresa Parceira *</label>
                  <select
                    required
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-indigo-500"
                    value={benefitForm.companyId}
                    onChange={(e) => setBenefitForm({ ...benefitForm, companyId: e.target.value })}
                  >
                    <option value="">-- Escolha uma empresa --</option>
                    {companies.map((co) => (
                      <option key={co.id} value={co.id}>
                        {co.name} ({co.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Categoria do Benefício *</label>
                    <select
                      required
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-indigo-500"
                      value={benefitForm.categoryId}
                      onChange={(e) => setBenefitForm({ ...benefitForm, categoryId: e.target.value })}
                    >
                      <option value="">-- Escolha --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Valor do Desconto *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 text-xs border rounded-lg"
                      placeholder="Ex: 25% OFF, Grátis"
                      value={benefitForm.discountValue}
                      onChange={(e) => setBenefitForm({ ...benefitForm, discountValue: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Título da Oferta *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-indigo-500"
                    placeholder="Ex: 10% de desconto em qualquer rodízio"
                    value={benefitForm.title}
                    onChange={(e) => setBenefitForm({ ...benefitForm, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Descrição Explicativa</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                    placeholder="Descreva detalhes como validade de dias, limites..."
                    value={benefitForm.description}
                    onChange={(e) => setBenefitForm({ ...benefitForm, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Como Resgatar *</label>
                  <textarea
                    rows={2}
                    required
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                    placeholder="Instruções para o cliente final resgatar..."
                    value={benefitForm.howToRedeem}
                    onChange={(e) => setBenefitForm({ ...benefitForm, howToRedeem: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Classificação do Benefício *</label>
                    <select
                      required
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-indigo-500"
                      value={benefitForm.type}
                      onChange={(e) => setBenefitForm({ ...benefitForm, type: e.target.value as 'product' | 'service' })}
                    >
                      <option value="service">Serviço</option>
                      <option value="product">Produto / Eletrônico</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Vencimento da Oferta *</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 text-xs border rounded-lg"
                      value={benefitForm.validUntil}
                      onChange={(e) => setBenefitForm({ ...benefitForm, validUntil: e.target.value })}
                    />
                  </div>
                </div>

                {/* FEATURED SWITCH */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    className="h-4 w-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
                    checked={benefitForm.featured}
                    onChange={(e) => setBenefitForm({ ...benefitForm, featured: e.target.checked })}
                  />
                  <label htmlFor="isFeatured" className="text-xs font-bold text-zinc-700 select-none">
                    Destacar esta oferta no topo do carrossel/grid
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{editingBenefitId ? 'Preencher alteração' : 'Disponibilizar Cupom'}</span>
                  </button>
                  {editingBenefitId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBenefitId(null);
                        setBenefitForm({ companyId: '', categoryId: '', title: '', description: '', discountValue: '', howToRedeem: '', type: 'service', featured: false, validUntil: '' });
                      }}
                      className="px-3 border rounded-lg text-xs"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Column */}
            <div className="lg:col-span-2 rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-3">
                Cupons e Ofertas Registradas ({benefits.length})
              </h3>

              <div className="divide-y divide-zinc-100 max-h-[500px] overflow-y-auto pr-1">
                {benefits.map((b) => {
                  const company = companies.find((co) => co.id === b.companyId);
                  const category = categories.find((cat) => cat.id === b.categoryId);

                  return (
                    <div key={b.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold text-zinc-950">{b.title}</span>
                          <span className="rounded-md bg-rose-100 text-rose-700 px-2 py-0.5 text-[9px] font-black uppercase">
                            {b.discountValue}
                          </span>
                          {b.featured && (
                            <span className="rounded-md bg-amber-100 text-amber-700 px-2 py-0.5 text-[9px] font-bold flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                              Destaque
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1 uppercase font-semibold">
                          Empresa parceira: <strong className="text-zinc-500">{company?.name || 'Não atribuída'}</strong> • Categoria: <strong className="text-zinc-500">{category?.name || 'Não atribuída'}</strong>
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-semibold">
                          Validade até: <strong className="text-zinc-500">{new Date(b.validUntil).toLocaleDateString('pt-BR')}</strong> • Tipo: <strong className="text-indigo-500 uppercase">{b.type}</strong>
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => selectBenefitForEdit(b)}
                          className="px-2.5 py-1.5 border rounded-lg text-xs text-zinc-600 hover:text-indigo-600 flex items-center gap-1 hover:bg-zinc-50"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Mudar</span>
                        </button>
                        <button
                          onClick={() => deleteBenefit(b.id)}
                          className="px-2.5 py-1.5 border rounded-lg text-xs text-red-500 hover:text-red-700 flex items-center gap-1 hover:bg-red-50/50"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 4: BLOG POSTS CRUD */}
        {/* ========================================================== */}
        {activeTab === 'blog' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animation-fade-in" id="tab-blog">
            {/* Form Column */}
            <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs space-y-4 h-fit">
              <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-3">
                <Plus className="h-4.5 w-4.5 text-indigo-600" />
                {editingBlogPostId ? 'Editar Artigo' : 'Publicar Novo Artigo'}
              </h3>

              <form onSubmit={handleBlogPostSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Título do Artigo *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Ex: Como economizar com telemedicina..."
                    value={blogForm.title}
                    onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Subtítulo / Resumo *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Ex: Guia prático de saúde preventiva..."
                    value={blogForm.subtitle}
                    onChange={(e) => setBlogForm({ ...blogForm, subtitle: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Autor do Artigo
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Ex: Equipe Editorial FABISA"
                    value={blogForm.author}
                    onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })}
                  />
                </div>

                {/* Cover Image Input + File Upload */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Link da Imagem de Capa
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={blogForm.image}
                    onChange={(e) => setBlogForm({ ...blogForm, image: e.target.value })}
                  />
                  
                  {/* Local Device Upload Option */}
                  <div className="relative border border-dashed border-zinc-200 rounded-lg hover:border-indigo-400 transition-colors bg-zinc-50/50 p-3 text-center" id="blog-image-upload-box">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBlogPostImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="blog-image-file-input"
                    />
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <Upload className="h-4 w-4 text-zinc-400" />
                      <span className="text-[10px] text-zinc-500 font-bold">Anexar do Dispositivo</span>
                      <span className="text-[9px] text-zinc-400">JPG, PNG ou WEBP (Redimensionada automaticamente)</span>
                    </div>
                  </div>
                  {isBlogUploading && (
                    <div className="text-[9px] text-indigo-600 font-bold mt-1 animate-pulse">
                      Processando e compactando imagem...
                    </div>
                  )}
                  {blogForm.image && (
                    <div className="mt-2 relative rounded-lg overflow-hidden border border-zinc-100 h-24">
                      <img 
                        src={blogForm.image} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        type="button"
                        onClick={() => setBlogForm({ ...blogForm, image: '' })}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                        title="Remover Imagem"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Conteúdo do Artigo *
                    </label>
                    <span className="text-[9px] text-zinc-400 font-semibold">
                      Selecione palavras e use a barra de formatação abaixo
                    </span>
                  </div>
                  
                  {/* RICH TEXT FORMATTING TOOLBAR */}
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-50 border border-zinc-200 border-b-0 rounded-t-xl" id="blog-rich-text-toolbar">
                    <button
                      type="button"
                      onClick={() => insertFormatting('bold')}
                      className="p-1.5 hover:bg-zinc-200 text-zinc-700 rounded-lg transition cursor-pointer flex items-center justify-center font-black"
                      title="Negrito"
                      id="rt-btn-bold"
                    >
                      <Bold className="h-3.5 w-3.5 text-zinc-850" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('italic')}
                      className="p-1.5 hover:bg-zinc-200 text-zinc-700 rounded-lg transition cursor-pointer flex items-center justify-center font-black"
                      title="Itálico"
                      id="rt-btn-italic"
                    >
                      <Italic className="h-3.5 w-3.5 text-zinc-850" />
                    </button>
                    <div className="h-4 w-[1px] bg-zinc-200 mx-1" />
                    <button
                      type="button"
                      onClick={() => insertFormatting('link')}
                      className="p-1.5 hover:bg-indigo-100 text-indigo-750 bg-indigo-50/40 rounded-lg transition cursor-pointer flex items-center gap-1 font-extrabold text-[10px] px-2.5"
                      title="Inserir Link / Hiperlink"
                      id="rt-btn-link"
                    >
                      <Link className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
                      <span>Inserir Link</span>
                    </button>
                    <div className="h-4 w-[1px] bg-zinc-200 mx-1" />
                    <button
                      type="button"
                      onClick={() => insertFormatting('h3')}
                      className="p-1.5 hover:bg-zinc-200 text-zinc-700 rounded-lg transition cursor-pointer flex items-center gap-1 font-extrabold text-[10px]"
                      title="Subtítulo H3"
                      id="rt-btn-h3"
                    >
                      <Heading3 className="h-3.5 w-3.5 text-zinc-800" />
                      <span>Título</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('list')}
                      className="p-1.5 hover:bg-zinc-200 text-zinc-700 rounded-lg transition cursor-pointer flex items-center justify-center"
                      title="Item de Lista"
                      id="rt-btn-list"
                    >
                      <List className="h-3.5 w-3.5 text-zinc-800" />
                    </button>
                  </div>

                  <textarea
                    id="blog-content-textarea"
                    required
                    rows={12}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-b-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed bg-white"
                    placeholder="Selecione qualquer palavra (como 'exame de biorressonância') e clique em 'Inserir Link' acima para torná-la clicável para os leitores!"
                    value={blogForm.content}
                    onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer"
                    id="btn-save-blog-post"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{editingBlogPostId ? 'Atualizar Artigo' : 'Publicar Artigo'}</span>
                  </button>
                  {editingBlogPostId && (
                    <button
                      type="button"
                      onClick={resetBlogForm}
                      className="px-3 py-2.5 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Articles List Column */}
            <div className="lg:col-span-2 rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs flex flex-col justify-between" id="admin-blog-list">
              <div>
                <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Bookmark className="h-4.5 w-4.5 text-indigo-500" />
                    Artigos Publicados ({blogPosts.length})
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Área Pública
                  </span>
                </h3>

                <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto pr-1">
                  {blogPosts.length === 0 ? (
                    <div className="py-12 text-center text-zinc-400">
                      Nenhum artigo publicado no momento.
                    </div>
                  ) : (
                    blogPosts.map((post) => (
                      <div key={post.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex gap-3 items-center">
                          <img 
                            src={post.image} 
                            alt={post.title} 
                            className="w-16 h-12 object-cover rounded-lg bg-zinc-100 border shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="text-xs font-extrabold text-zinc-950 block leading-tight">{post.title}</span>
                            <span className="text-[10px] text-zinc-400 block mt-1 font-semibold">
                              Escrito por: <strong className="text-zinc-500">{post.author || 'Equipe Editorial'}</strong> • {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0 self-end md:self-center">
                          <button
                            onClick={() => selectBlogPostForEdit(post)}
                            className="px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-600 hover:text-indigo-600 flex items-center gap-1 hover:bg-zinc-50 cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Mudar</span>
                          </button>
                          <button
                            onClick={() => deleteBlogPost(post.id)}
                            className="px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs text-red-500 hover:text-red-700 flex items-center gap-1 hover:bg-red-50/50 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Remover</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profissionais' && (
          <div className="grid grid-cols-1 gap-8 animation-fade-in" id="tab-profissionais">
            <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                    Profissionais Parceiros Cadastrados ({profissionais.length})
                  </span>
                  {isLoadingProfissionais && (
                    <span className="text-[10px] bg-zinc-100 text-zinc-500 font-bold px-2 py-1 rounded-md">
                      Carregando...
                    </span>
                  )}
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-600">
                    <thead className="bg-zinc-50 text-[10px] uppercase text-zinc-400">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold rounded-l-lg">Nome / Categoria</th>
                        <th className="py-2.5 px-3 font-semibold">Contato</th>
                        <th className="py-2.5 px-3 font-semibold">Benefício</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Data</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                        <th className="py-2.5 px-3 font-semibold text-right rounded-r-lg">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {profissionais.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-400">Nenhum profissional encontrado.</td>
                        </tr>
                      ) : profissionais.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-50/50 transition">
                          <td className="py-3 px-3">
                            <span className="font-bold text-zinc-800 block">{p.name}</span>
                            <span className="text-[10px] text-zinc-500">{p.category} • {p.location}</span>
                          </td>
                          <td className="py-3 px-3 font-mono">{p.phone}</td>
                          <td className="py-3 px-3">
                            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-sm text-[10px] font-bold">
                              {p.benefit}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-[10px] text-zinc-400">
                            {new Date(p.submittedAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {p.status === 'approved' ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full uppercase">Ativo</span>
                            ) : p.status === 'pending' ? (
                              <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-full uppercase">Pendente</span>
                            ) : (
                              <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-1 rounded-full uppercase">Rejeitado</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex justify-end gap-2">
                              {p.status !== 'approved' && (
                                <button
                                  onClick={() => handleApproveProfissional(p.id)}
                                  className="px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-[10px] font-bold uppercase transition cursor-pointer"
                                >
                                  Aprovar
                                </button>
                              )}
                              <button
                                onClick={() => handleRejectProfissional(p.id)}
                                className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-[10px] font-bold uppercase transition cursor-pointer"
                              >
                                {p.status === 'pending' ? 'Rejeitar' : 'Excluir'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================== */}
      {/* SEÇÃO ADMINISTRATIVA MASTER: PAINEL DE CONTROLE DE ACESSOS */}
      {/* ========================================================== */}
      <section className="mt-8 border-t border-zinc-150 pt-8" id="admin-master-access-panel">
        <div className="rounded-2xl border border-indigo-500/10 bg-indigo-500/[0.02] p-6 space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛠️</span>
            <div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                Painel de Controle de Acessos
                <span className="rounded-full bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 text-[9px] uppercase">
                  Master
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Módulo Administrativo Seguro para gerenciamento avançado de permissões, convites VIP e captação de leads.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Botão 1 */}
            <button
              onClick={() => setIsBeneficiaryModalOpen(true)}
              className="group flex items-center justify-between p-5 bg-white border border-zinc-200 rounded-2xl hover:border-indigo-600 hover:shadow-md transition text-left cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                    Gerenciar Beneficiários (Lista VIP)
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-1 font-semibold leading-relaxed">
                    Libere e-mails de clientes elegíveis da telemedicina no banco de dados para permitir o cadastro local.
                  </p>
                </div>
              </div>
              <span className="text-zinc-300 group-hover:text-indigo-600 group-hover:scale-110 transition font-bold text-xl pl-2">→</span>
            </button>

            {/* Botão 2 */}
            <button
              onClick={() => setIsPartnershipsModalOpen(true)}
              className="group flex items-center justify-between p-5 bg-white border border-zinc-200 rounded-2xl hover:border-emerald-600 hover:shadow-md transition text-left cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                    Solicitações de Parceria (Leads do App)
                    <span className="animate-pulse bg-emerald-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">Leads</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-1 font-semibold leading-relaxed">
                    Consulte os contatos dos empresários que se cadastraram ou foram recomendados para integração direta com WhatsApp.
                  </p>
                </div>
              </div>
              <span className="text-zinc-300 group-hover:text-emerald-600 group-hover:scale-110 transition font-bold text-xl pl-2">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* MODAL 1: GERENCIAR BENEFICIÁRIOS (LISTA VIP) */}
      {/* ========================================================== */}
      {isBeneficiaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs animate-fade-in" id="modal-manage-beneficiaries">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-100 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <Mail className="h-5 w-5 text-indigo-600 animate-bounce" />
                <div>
                  <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
                    Gerenciar Beneficiários (Lista VIP)
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                    Autorize novos e-mails para garantir login instantâneo seguro.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBeneficiaryModalOpen(false)}
                className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-100 transition cursor-pointer text-[11px] font-black uppercase tracking-wider text-zinc-500 text-center px-4"
              >
                Fechar
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Register Form */}
                <div className="space-y-4">
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-205">
                    <h4 className="text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-2">
                      Autorizar Novo Cliente
                    </h4>
                    <form onSubmit={handleAddEmail} className="space-y-4">
                      <div>
                        <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">E-mail do Cliente *</label>
                        <div className="relative flex items-center">
                          <Mail className="absolute left-3 text-zinc-400 h-4 w-4" />
                          <input
                            type="email"
                            className="w-full pl-9 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
                            placeholder="email.cliente@provedor.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-sm uppercase tracking-wider"
                      >
                        Liberar E-mail
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right Column: Whitelist list */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-zinc-700 uppercase tracking-wider">
                      E-mails Atualmente Autorizados
                    </h4>
                    <span className="rounded-full bg-zinc-150 px-2.5 py-0.5 text-[10px] font-bold text-zinc-650">
                      {authorizedEmails.length} cadastrados
                    </span>
                  </div>

                  {isLoadingEmails ? (
                    <div className="py-12 text-center">
                      <span className="text-xs text-zinc-400 animate-pulse">Buscando cadastros...</span>
                    </div>
                  ) : authorizedEmails.length === 0 ? (
                    <div className="py-12 text-center rounded-2xl border border-dashed border-zinc-200">
                      <p className="text-xs text-zinc-400">Nenhum e-mail adicionado no banco ainda.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100 max-h-[350px] overflow-y-auto pr-2">
                      {authorizedEmails.map((item) => {
                        const cleanEmail = item.email.toLowerCase();
                        const isMestre = cleanEmail === 'fabionunes390@gmail.com' || cleanEmail === 'amplebrasilcompany@gmail.com' || cleanEmail === 'fabisasaude@gmail.com';
                        return (
                          <div key={item.id} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${isMestre ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                  <Mail className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-zinc-850 truncate max-w-[185px] sm:max-w-none">{item.email}</p>
                                <p className="text-[9px] text-zinc-400">
                                  {new Date(item.addedAt).toLocaleString('pt-BR')}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {isMestre ? (
                                <span className="rounded-md bg-amber-50 border border-amber-200/50 text-amber-800 px-2 py-0.5 text-[8px] font-black uppercase">
                                  Admin Master
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleRemoveEmail(item.id, item.email)}
                                  className="p-1.5 px-2.5 border rounded-lg text-[9px] font-bold text-red-500 hover:text-red-750 border-zinc-200 hover:bg-red-50 cursor-pointer"
                                >
                                  Bloquear
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 2: SOLICITAÇÕES DE PARCERIA (LEADS) */}
      {/* ========================================================== */}
      {isPartnershipsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs animate-fade-in" id="modal-manage-partnerships">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-zinc-100 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-zinc-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
                    Solicitações de Parceria & Leads
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                    Veja contatos de donos de estabelecimentos captados direto na tela de login.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <button
                  type="button"
                  onClick={fetchPartnerRequests}
                  className="p-1 px-3 border rounded-xl hover:bg-zinc-100 cursor-pointer text-zinc-500 hover:text-zinc-800 transition flex items-center gap-1.5 text-[10px] font-bold border-zinc-200 bg-white"
                  disabled={isLoadingRequests}
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingRequests ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
                </button>
                <button
                  onClick={() => setIsPartnershipsModalOpen(false)}
                  className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-100 transition cursor-pointer text-[11px] font-black uppercase tracking-wider text-zinc-500 text-center px-4"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Sub Tabs Selection */}
            <div className="px-6 py-2 border-b border-zinc-150 bg-zinc-50/20 flex gap-4">
              <button
                onClick={() => setPartnershipSubTab('approvals')}
                className={`py-2 px-4 border-b-2 text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                  partnershipSubTab === 'approvals'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                🤝 Cadastros para Aprovação ({partnerRegistrations.length})
              </button>
              <button
                onClick={() => setPartnershipSubTab('leads')}
                className={`py-2 px-4 border-b-2 text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                  partnershipSubTab === 'leads'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                📣 Indicações / Leads do App ({partnerRequests.length})
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
              {isLoadingRequests ? (
                <div className="py-20 text-center">
                  <span className="text-xs text-zinc-400 animate-pulse">Buscando informações no banco...</span>
                </div>
              ) : partnershipSubTab === 'approvals' ? (
                partnerRegistrations.length === 0 ? (
                  <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-200">
                    <Building2 className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                    <p className="text-xs font-semibold text-zinc-700">Nenhuma solicitação de empresa parceira pendente.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="border-b border-zinc-150 text-[9px] font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                          <th className="py-3 px-3">Logo / Empresa</th>
                          <th className="py-3 px-3">Contato / E-mail</th>
                          <th className="py-3 px-3">Localização</th>
                          <th className="py-3 px-3">Benefício Proposto</th>
                          <th className="py-3 px-3">Status / Data</th>
                          <th className="py-3 px-3 text-right">Ações de Gestão</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-xs text-zinc-800">
                        {partnerRegistrations.map((item) => {
                          const cleanPhone = item.phone ? item.phone.replace(/\D/g, '') : '';
                          const formattedDate = item.submittedAt 
                            ? new Date(item.submittedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                            : 'Sem data';

                          let whatsappUrl = '';
                          if (cleanPhone) {
                            const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                            const message = encodeURIComponent(
                              `Olá! Falo do Clube de Vantagens da FABISA Saúde.\n\nRecebemos a sua solicitação de cadastro do estabelecimento "${item.companyName}" e gostaríamos de formalizar nossa parceria. Podemos conversar?`
                            );
                            whatsappUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${message}`;
                          }

                          return (
                            <tr key={item.id} className="hover:bg-zinc-50/50 transition">
                              <td className="py-3.5 px-3">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={item.logo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=200&h=200&fit=crop'} 
                                    alt={item.companyName} 
                                    className="h-10 w-10 object-contain rounded-lg border border-zinc-100 bg-white"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=200&h=200&fit=crop';
                                    }}
                                  />
                                  <div>
                                    <span className="font-bold text-zinc-900 flex items-center gap-2">
                                      {item.companyName}
                                      {item.tipo_parceiro === 'Profissional Liberal' && (
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider">
                                          Profissional Liberal
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-[9px] text-zinc-400 font-mono">ID: {item.id.slice(0, 8)}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-3">
                                <div className="space-y-0.5">
                                  <span className="block font-semibold text-zinc-700">{item.phone}</span>
                                  <span className="block text-[10px] text-zinc-400 font-mono">{item.email}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-3 text-zinc-650">
                                <div>
                                  <span className="block font-bold">{item.neighborhood}</span>
                                  <span className="block text-[10px] text-zinc-400">{item.city}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-3">
                                <div className="max-w-[220px]">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-100 mb-1">
                                    <Tag className="h-2.5 w-2.5" />
                                    {item.categoryName || 'Geral'}
                                  </span>
                                  <span className="block font-bold text-indigo-600 text-[11px] truncate" title={item.benefitValue}>
                                    {item.benefitValue}
                                  </span>
                                  <p className="text-[9px] text-zinc-400 truncate mt-0.5" title={item.benefitTerms}>
                                    {item.benefitTerms || 'Sem regras adicionais'}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3.5 px-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                  item.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : item.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                  {item.status === 'pending' ? 'Pendente' : item.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                </span>
                                {item.statusFeedback && (
                                  <span className="block text-[9px] text-zinc-400 italic max-w-[120px] truncate mt-0.5" title={item.statusFeedback}>
                                    {item.statusFeedback}
                                  </span>
                                )}
                                <span className="block text-[9px] text-zinc-400 mt-1">{formattedDate}</span>
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {item.status === 'pending' ? (
                                    <>
                                      <button
                                        onClick={() => handleApproveRegistration(item)}
                                        className="p-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase transition cursor-pointer flex items-center gap-1 shadow-xs"
                                        title="Aprovar e Publicar no App"
                                      >
                                        <Save className="h-3 w-3" />
                                        <span>Aprovar</span>
                                      </button>
                                      <button
                                        onClick={() => handleRejectRegistration(item)}
                                        className="p-1 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase transition cursor-pointer flex items-center gap-1 border border-red-100"
                                        title="Rejeitar Solicitação"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                        <span>Rejeitar</span>
                                      </button>
                                    </>
                                  ) : null}
                                  {whatsappUrl && (
                                    <a
                                      href={whatsappUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                                    >
                                      <Phone className="h-3 w-3" />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                partnerRequests.length === 0 ? (
                  <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-200">
                    <Building2 className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                    <p className="text-xs font-semibold text-zinc-700">Nenhum lead ou solicitação captada.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-zinc-150 text-[9px] font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                          <th className="py-3 px-3">Empresa / Ramo</th>
                          <th className="py-3 px-3">Localização (Bairro/Cidade)</th>
                          <th className="py-3 px-3">Tipo / Canal</th>
                          <th className="py-3 px-3">Quem Enviou / Data</th>
                          <th className="py-3 px-3">WhatsApp Comercial</th>
                          <th className="py-3 px-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-xs text-zinc-800">
                        {partnerRequests.map((item: any) => {
                          const cleanPhone = item.whatsapp ? item.whatsapp.replace(/\D/g, '') : '';
                          const isOwner = item.type?.toLowerCase() === 'proprietário' || item.type?.toLowerCase() === 'proprietario';
                          const formattedDate = item.submittedAt 
                            ? new Date(item.submittedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                            : 'Sem data';

                          let whatsappUrl = '';
                          if (cleanPhone) {
                            const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                            const message = encodeURIComponent(
                              `Olá! Falo do Clube de Benefícios da FABISA Saúde.\n\nRecebemos a sua solicitação para cadastrar o estabelecimento "${item.companyName}" como parceiro do nosso clube de vantagens de telemedicina e gostaríamos de detalhar como funciona a nossa parceria exclusiva. Podemos conversar?`
                            );
                            whatsappUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${message}`;
                          }

                          return (
                            <tr key={item.id || item.submittedAt} className="hover:bg-zinc-50/50 transition">
                              <td className="py-3.5 px-3 font-bold text-zinc-900">
                                <div>
                                  <span>{item.companyName}</span>
                                  <span className="block text-[9px] text-zinc-400 font-normal mt-0.5">
                                    {item.sector}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-3 text-zinc-650">{item.location}</td>
                              <td className="py-3.5 px-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black ${
                                  isOwner 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                  {item.type || 'Indicação'}
                                </span>
                                <span className="block text-[8px] text-zinc-400 mt-0.5 font-mono">
                                  {item.origem || 'Interno'}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-zinc-650">
                                <span className="font-semibold block truncate max-w-[120px]" title={item.submittedBy}>
                                  {item.submittedBy || 'Anônimo'}
                                </span>
                                <span className="text-[9px] text-zinc-400 block mt-0.5">
                                  {formattedDate}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 font-mono font-bold text-emerald-600">
                                {item.whatsapp ? (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-emerald-500" />
                                    {item.whatsapp}
                                  </span>
                                ) : (
                                  <span className="text-zinc-400 italic">Preenchido por Cliente</span>
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                {whatsappUrl ? (
                                  <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase transition cursor-pointer shadow-xs"
                                  >
                                    <Phone className="h-3 w-3" />
                                    <span>Contatar</span>
                                  </a>
                                ) : (
                                  <span className="text-[9px] text-zinc-400 italic">Sem contato</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
