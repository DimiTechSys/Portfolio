import React, { useEffect } from 'react';
import { Article } from '../types';
import { ArrowLeft, Bookmark, Share2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface Props {
  article: Article;
  onBack: () => void;
  onOpenChat: () => void;
}

export const ArticleDetail: React.FC<Props> = ({ article, onBack, onOpenChat }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  return (
    <div className="bg-stone-surface min-h-screen">
      {/* Hero Image */}
      <header className="relative w-full h-[65vh] overflow-visible">
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="absolute top-8 left-8 z-50 p-4 glass rounded-full hover:scale-105 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-stone-ink" />
        </motion.button>
        
        <div className="w-full h-full overflow-hidden">
          <img 
            src={article.image} 
            alt={article.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).src = '/images/default-article.svg';
            }}
          />
        </div>

        {/* Floating Toolbar */}
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-20 glass rounded-full px-8 py-4 flex items-center gap-10 ambient-bloom">
          <button className="text-stone-ink hover:text-cobalt-primary transition-colors">
            <Bookmark className="w-6 h-6" />
          </button>
          <div className="w-px h-6 bg-stone-border/30" />
          <button className="text-stone-ink hover:text-cobalt-primary transition-colors">
            <Share2 className="w-6 h-6" />
          </button>
          <div className="w-px h-6 bg-stone-border/30" />
          <button 
            onClick={onOpenChat}
            className="text-cobalt-primary hover:scale-110 active:scale-90 transition-transform flex items-center gap-2"
          >
            <Sparkles className="w-6 h-6 fill-current" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-8 pt-24 pb-48">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-stone-high px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
              {article.category}
            </span>
            <span className="text-stone-ink-variant text-sm">{article.date}</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-headline text-stone-ink leading-tight mb-10">
            {article.title}
          </h1>
          <div className="flex items-center gap-4">
            <img src={article.author.image} alt={article.author.name} className="w-14 h-14 rounded-full object-cover" />
            <div>
              <p className="font-bold text-stone-ink">{article.author.name}</p>
              <p className="text-sm text-stone-ink-variant">{article.author.role}</p>
            </div>
          </div>
        </div>

        <article className="prose prose-lg prose-stone max-w-none font-body text-stone-ink-variant leading-relaxed">
          <ReactMarkdown
            components={{
              h2: ({ node, ...props }) => <h2 className="text-3xl font-headline text-stone-ink mt-12 mb-6" {...props} />,
              blockquote: ({ node, ...props }) => (
                <blockquote className="bg-stone-low rounded-3xl p-10 my-16 border-l-8 border-cobalt-primary italic text-2xl font-headline text-cobalt-container" {...props} />
              ),
              p: ({ node, ...props }) => <p className="mb-8 last:mb-0" {...props} />,
            }}
          >
            {article.content}
          </ReactMarkdown>
        </article>
      </main>
    </div>
  );
};
