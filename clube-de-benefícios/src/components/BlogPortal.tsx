import React, { useState, useMemo } from 'react';
import { Calendar, User, ArrowLeft, ChevronRight, Search, BookOpen, Sparkles, Building2, Ticket, Plus, Share2, Link, Check, MessageCircle } from 'lucide-react';
import { BlogPost } from '../types';

interface BlogPortalProps {
  posts: BlogPost[];
  selectedPostId: string | null;
  onSelectPost: (id: string | null) => void;
  onNavigateToClube: () => void;
  isAdmin?: boolean;
  onGoToAdminBlog?: () => void;
}

// Simple internal Markdown Formatter with support for bold, italic, and hyperlinks [text](url)
function renderInlineStyles(text: string): React.ReactNode[] {
  let parts: { type: 'text' | 'bold' | 'italic' | 'link'; content: string; url?: string }[] = [{ type: 'text', content: text }];

  // 1. Extract links: [texto](url)
  let tempParts: typeof parts = [];
  for (const part of parts) {
    if (part.type !== 'text') {
      tempParts.push(part);
      continue;
    }
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;
    let hasMatches = false;
    while ((match = regex.exec(part.content)) !== null) {
      hasMatches = true;
      const matchIndex = match.index;
      const matchText = match[1];
      const matchUrl = match[2];

      if (matchIndex > lastIndex) {
        tempParts.push({ type: 'text', content: part.content.substring(lastIndex, matchIndex) });
      }
      tempParts.push({ type: 'link', content: matchText, url: matchUrl });
      lastIndex = regex.lastIndex;
    }
    if (hasMatches) {
      if (lastIndex < part.content.length) {
        tempParts.push({ type: 'text', content: part.content.substring(lastIndex) });
      }
    } else {
      tempParts.push(part);
    }
  }
  parts = tempParts;

  // 2. Extract bold: **text**
  tempParts = [];
  for (const part of parts) {
    if (part.type !== 'text') {
      tempParts.push(part);
      continue;
    }
    const regex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;
    let hasMatches = false;
    while ((match = regex.exec(part.content)) !== null) {
      hasMatches = true;
      const matchIndex = match.index;
      const matchText = match[1];

      if (matchIndex > lastIndex) {
        tempParts.push({ type: 'text', content: part.content.substring(lastIndex, matchIndex) });
      }
      tempParts.push({ type: 'bold', content: matchText });
      lastIndex = regex.lastIndex;
    }
    if (hasMatches) {
      if (lastIndex < part.content.length) {
        tempParts.push({ type: 'text', content: part.content.substring(lastIndex) });
      }
    } else {
      tempParts.push(part);
    }
  }
  parts = tempParts;

  // 3. Extract italic: *text*
  tempParts = [];
  for (const part of parts) {
    if (part.type !== 'text') {
      tempParts.push(part);
      continue;
    }
    const regex = /\*([^*]+)\*/g;
    let lastIndex = 0;
    let match;
    let hasMatches = false;
    while ((match = regex.exec(part.content)) !== null) {
      hasMatches = true;
      const matchIndex = match.index;
      const matchText = match[1];

      if (matchIndex > lastIndex) {
        tempParts.push({ type: 'text', content: part.content.substring(lastIndex, matchIndex) });
      }
      tempParts.push({ type: 'italic', content: matchText });
      lastIndex = regex.lastIndex;
    }
    if (hasMatches) {
      if (lastIndex < part.content.length) {
        tempParts.push({ type: 'text', content: part.content.substring(lastIndex) });
      }
    } else {
      tempParts.push(part);
    }
  }
  parts = tempParts;

  // Map to elements
  return parts.map((part, i) => {
    if (part.type === 'bold') {
      return <strong key={i} className="font-extrabold text-zinc-950">{part.content}</strong>;
    }
    if (part.type === 'italic') {
      return <em key={i} className="italic text-zinc-800">{part.content}</em>;
    }
    if (part.type === 'link') {
      return (
        <a
          key={i}
          href={part.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-650 hover:text-indigo-500 font-extrabold underline cursor-pointer decoration-2 bg-indigo-50/40 px-1 rounded-md transition"
        >
          {part.content}
        </a>
      );
    }
    return part.content;
  });
}

function renderMarkdownContent(text: string) {
  if (!text) return null;
  return text.split('\n').map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={idx} className="text-base sm:text-lg font-black text-zinc-900 mt-6 mb-3 tracking-tight" id={`md-h3-${idx}`}>
          {renderInlineStyles(trimmed.slice(4))}
        </h3>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={idx} className="text-lg sm:text-xl font-black text-zinc-900 mt-8 mb-4 tracking-tight" id={`md-h2-${idx}`}>
          {renderInlineStyles(trimmed.slice(3))}
        </h2>
      );
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h1 key={idx} className="text-xl sm:text-2xl font-black text-zinc-900 mt-10 mb-5 tracking-tight" id={`md-h1-${idx}`}>
          {renderInlineStyles(trimmed.slice(2))}
        </h1>
      );
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <li key={idx} className="ml-6 list-disc text-zinc-650 mb-2 leading-relaxed text-xs sm:text-sm" id={`md-li-${idx}`}>
          {renderInlineStyles(trimmed.slice(2))}
        </li>
      );
    }
    if (trimmed.match(/^\d+\.\s/)) {
      const content = trimmed.replace(/^\d+\.\s/, '');
      return (
        <li key={idx} className="ml-6 list-decimal text-zinc-650 mb-2 leading-relaxed text-xs sm:text-sm" id={`md-ol-${idx}`}>
          {renderInlineStyles(content)}
        </li>
      );
    }
    if (trimmed === '') {
      return <div key={idx} className="h-4" id={`md-gap-${idx}`} />;
    }
    
    return (
      <p key={idx} className="text-zinc-650 leading-relaxed mb-4 text-xs sm:text-sm" id={`md-p-${idx}`}>
        {renderInlineStyles(line)}
      </p>
    );
  });
}

interface ShareButtonsProps {
  title: string;
}

function ShareButtons({ title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Confira esta matéria do Blog FABISA: *${title}*\n\n${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying link:', err);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 border border-zinc-150 rounded-2xl p-4 my-6" id="blog-share-bar">
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-indigo-650 animate-pulse" />
        <span className="text-xs font-black text-zinc-700 uppercase tracking-wider">
          Compartilhar Matéria
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        {/* WhatsApp Button */}
        <button
          onClick={handleShareWhatsApp}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl transition cursor-pointer border border-emerald-150 active:scale-98"
          id="btn-blog-share-whatsapp"
        >
          <MessageCircle className="h-4 w-4 text-emerald-600" />
          <span>WhatsApp</span>
        </button>
        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-black rounded-xl transition cursor-pointer border border-zinc-250 active:scale-98"
          id="btn-blog-share-copylink"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="text-emerald-600 font-extrabold">Link Copiado!</span>
            </>
          ) : (
            <>
              <Link className="h-4 w-4 text-zinc-500" />
              <span>Copiar Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function BlogPortal({ posts, selectedPostId, onSelectPost, onNavigateToClube, isAdmin, onGoToAdminBlog }: BlogPortalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = useMemo(() => {
    return posts.filter(post => 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [posts, searchQuery]);

  const activePost = useMemo(() => {
    if (!selectedPostId) return null;
    return posts.find(p => p.id === selectedPostId) || null;
  }, [posts, selectedPostId]);

  // Full Post Reader Screen
  if (activePost) {
    const formattedDate = new Date(activePost.createdAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-4 sm:py-8" id="blog-reader-view">
        {/* Back and Admin Button Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="blog-reader-top-nav">
          <button
            onClick={() => onSelectPost(null)}
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-indigo-600 transition cursor-pointer self-start"
            id="btn-blog-back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para o Blog</span>
          </button>

          {isAdmin && onGoToAdminBlog && (
            <button
              onClick={onGoToAdminBlog}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition active:scale-98 cursor-pointer self-start sm:self-auto"
              id="btn-blog-admin-panel-reader"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Criar Novo Artigo / Acessar Painel</span>
            </button>
          )}
        </div>

        {/* Article Container */}
        <article className="bg-white border border-zinc-150 rounded-3xl overflow-hidden shadow-sm" id="blog-post-card">
          {/* Cover image */}
          <div className="h-48 sm:h-80 w-full relative">
            <img 
              src={activePost.image || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&h=450&fit=crop'} 
              alt={activePost.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent" />
          </div>

          <div className="p-6 sm:p-10 space-y-6">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 border-b border-zinc-100 pb-5">
              <span className="flex items-center gap-1.5 font-semibold text-indigo-600 uppercase tracking-wider">
                <BookOpen className="h-3.5 w-3.5" />
                Artigo Informativo
              </span>
              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formattedDate}
              </span>
              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {activePost.author || 'Editorial FABISA'}
              </span>
            </div>

            {/* Title and Subtitle */}
            <div className="space-y-3">
              <h1 className="text-xl sm:text-3xl font-black text-zinc-900 tracking-tight leading-tight">
                {activePost.title}
              </h1>
              <p className="text-sm sm:text-base text-zinc-500 font-medium leading-relaxed">
                {activePost.subtitle}
              </p>
            </div>

            <ShareButtons title={activePost.title} />

            {/* Markdown Content (First half) */}
            <div className="prose max-w-none text-zinc-700">
              {renderMarkdownContent(activePost.content)}
            </div>

            {/* Mid-Article Conversion Banner */}
            <div className="my-8 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-zinc-950 text-white p-6 sm:p-8 relative overflow-hidden border border-indigo-500/20 shadow-lg" id="mid-article-conversion-banner">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
              <div className="relative space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  Benefício Exclusivo
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                  Gostou deste conteúdo? Ele é parte do ecossistema da FABISA. Conheça nosso Clube de Benefícios e economize com nossas empresas parceiras!
                </h3>
                <button
                  onClick={onNavigateToClube}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-md active:scale-98 cursor-pointer"
                  id="btn-conversion-clube-middle"
                >
                  <span>Quero Conhecer o Clube</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <ShareButtons title={activePost.title} />

            {/* Editorial Footer / Bottom CTA Section */}
            <div className="border-t border-zinc-150 pt-8 mt-12 space-y-6" id="blog-editorial-footer">
              <div className="bg-zinc-50/70 border border-zinc-150 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left max-w-md">
                  <h4 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
                    Quer economizar de verdade cuidando da sua saúde?
                  </h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Ao se associar à <strong>FABISA Saúde</strong>, você garante consultas online ilimitadas por telemedicina e acesso imediato a mais de 200 cupons de desconto e vantagens especiais exclusivas em todo o país!
                  </p>
                </div>
                <button
                  onClick={onNavigateToClube}
                  className="w-full md:w-auto bg-zinc-950 hover:bg-zinc-900 text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition shadow-xs cursor-pointer text-center whitespace-nowrap"
                  id="btn-conversion-clube-bottom"
                >
                  Quero me Associar ao Clube
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    );
  }

  // Blog list view
  return (
    <div className="space-y-8 animate-fade-in" id="blog-grid-view">
      {/* Blog Hero Heading */}
      <div className="text-center space-y-3 max-w-2xl mx-auto py-6">
        <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase flex items-center justify-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 animate-pulse" />
          Informativos & Saúde Preventiva
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 tracking-tight">
          BLOG DE VANTAGENS FABISA
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed">
          Notícias de saúde, guias de economia inteligente, dicas de nutrição e notícias do ecossistema de saúde preventiva FABISA.
        </p>

        {isAdmin && onGoToAdminBlog && (
          <div className="pt-4 max-w-md mx-auto" id="admin-blog-quick-banner">
            <div className="bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/25 rounded-2xl p-4 text-center space-y-3 shadow-xs">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-800 uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
                <span>Painel Administrativo Ativo</span>
              </div>
              <p className="text-[11px] text-zinc-650 font-semibold leading-relaxed">
                Você está autenticado como administrador. Clique abaixo para abrir o formulário, criar novos artigos ou gerenciar os existentes.
              </p>
              <button
                onClick={onGoToAdminBlog}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer active:scale-98"
                id="btn-blog-admin-panel"
              >
                <Plus className="h-4 w-4" />
                <span>Criar Novo Artigo / Acessar Painel</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filter Row */}
      <div className="max-w-md mx-auto" id="blog-search-bar">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 text-zinc-400 h-4.5 w-4.5" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 text-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-xs transition shadow-xs"
            placeholder="Buscar por artigos, saúde, dicas ou termos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Articles Grid */}
      {filteredPosts.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-zinc-200 max-w-lg mx-auto">
          <BookOpen className="h-10 w-10 text-zinc-300 mx-auto mb-3 animate-pulse" />
          <p className="text-xs font-semibold text-zinc-700">Nenhum artigo encontrado para a sua busca.</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="mt-3 text-xs text-indigo-600 font-bold hover:underline"
          >
            Limpar Busca
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto" id="articles-cards-grid">
          {filteredPosts.map((post) => {
            const dateStr = new Date(post.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });

            return (
              <div 
                key={post.id}
                onClick={() => onSelectPost(post.id)}
                className="bg-white border border-zinc-150 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition duration-350 flex flex-col cursor-pointer group"
                id={`article-card-${post.id}`}
              >
                {/* Image */}
                <div className="h-44 w-full overflow-hidden relative">
                  <img 
                    src={post.image || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&h=450&fit=crop'} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-indigo-600 uppercase border border-white">
                    Saúde
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Meta */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span>{post.author || 'FABISA'}</span>
                    </div>

                    <h2 className="text-base font-black text-zinc-900 tracking-tight leading-snug group-hover:text-indigo-650 transition">
                      {post.title}
                    </h2>
                    <p className="text-xs text-zinc-500 font-medium line-clamp-2 leading-relaxed">
                      {post.subtitle}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-black uppercase tracking-wider">
                    <span className="group-hover:text-indigo-600 transition">Ler Artigo Completo</span>
                    <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
