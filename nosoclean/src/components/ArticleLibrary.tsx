import React from 'react';
import { Article } from '../types';
import { articles } from '../data';
import { motion } from 'motion/react';

interface Props {
  onSelect: (article: Article) => void;
}

export const ArticleLibrary: React.FC<Props> = ({ onSelect }) => {
  const [selectedCategory, setSelectedCategory] = React.useState('Tous');
  const [chipsCollapsed, setChipsCollapsed] = React.useState(false);
  const lastScrollYRef = React.useRef(0);
  const categories = ['Tous', ...new Set(articles.map(article => article.category))];
  const filteredArticles =
    selectedCategory === 'Tous'
      ? articles
      : articles.filter(article => article.category === selectedCategory);

  React.useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;
      if (Math.abs(delta) < 8) return;
      setChipsCollapsed(delta > 0);
      lastScrollYRef.current = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-stone-surface">
      {/* Top App Bar */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-5xl w-[94%] glass rounded-full h-16 ambient-bloom overflow-hidden">
        <div className="relative w-full h-full">
          <motion.div
            animate={{
              left: chipsCollapsed ? '50%' : '1.5rem',
              x: chipsCollapsed ? '-50%' : '0%',
            }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="absolute top-1/2 -translate-y-1/2"
          >
            <img src="/images/logo.png" alt="Nosoclean" className="h-10 w-auto object-contain" />
          </motion.div>
        </div>
      </header>

      {/* Sector Filter */}
      <motion.div
        animate={{
          opacity: chipsCollapsed ? 0 : 1,
          y: chipsCollapsed ? -10 : 0,
          scale: chipsCollapsed ? 0.92 : 1,
        }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        className="fixed top-24 left-1/2 -translate-x-1/2 z-40 max-w-[90vw] overflow-x-auto no-scrollbar whitespace-nowrap"
        style={{ pointerEvents: chipsCollapsed ? 'none' : 'auto' }}
      >
        <div className="flex items-center gap-3">
          {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`font-body text-sm tracking-wide px-4 py-2 rounded-full border transition-all ${
              selectedCategory === cat
                ? 'bg-cobalt-primary text-white border-cobalt-primary'
                : 'bg-stone-medium/70 backdrop-blur-2xl text-stone-ink-variant border-stone-border/30 hover:text-cobalt-primary hover:border-cobalt-primary/40'
            }`}
          >
            {cat}
          </button>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="pt-48 px-6 md:px-12 max-w-5xl mx-auto flex flex-col gap-24 pb-32">
        {filteredArticles.map((article) => (
          <motion.article 
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 0.99 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(article)}
            className="flex flex-col gap-8 w-full group cursor-pointer"
          >
            <div className="w-full aspect-video rounded-3xl overflow-hidden bg-stone-low">
              <img 
                src={article.image} 
                alt={article.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  (event.currentTarget as HTMLImageElement).src = '/images/default-article.svg';
                }}
              />
            </div>
            <div className="flex flex-col gap-4 pl-6 border-l-4 border-transparent group-hover:border-cobalt-primary transition-colors">
              <div className="flex items-center gap-3">
                <span className="bg-stone-high px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                  {article.category}
                </span>
                <span className="text-stone-ink-variant text-sm">{article.date}</span>
              </div>
              <h2 className="text-3xl md:text-4xl text-stone-ink font-headline leading-tight group-hover:text-cobalt-primary transition-colors">
                {article.title}
              </h2>
              <p className="text-lg text-stone-ink-variant leading-relaxed line-clamp-2">
                {article.summary}
              </p>
            </div>
          </motion.article>
        ))}
      </main>

    </div>
  );
};
