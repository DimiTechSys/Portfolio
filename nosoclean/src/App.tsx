/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ArticleLibrary } from './components/ArticleLibrary';
import { ArticleDetail } from './components/ArticleDetail';
import { AIChat } from './components/AIChat';
import { Article } from './types';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';

export default function App() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="relative overflow-x-hidden min-h-screen bg-stone-surface">
      <LayoutGroup>
        <AnimatePresence mode="wait">
          {!selectedArticle ? (
            <motion.div
              key="library"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <ArticleLibrary
                onSelect={setSelectedArticle}
              />
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <ArticleDetail 
                article={selectedArticle} 
                onBack={() => setSelectedArticle(null)}
                onOpenChat={() => setIsChatOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <AIChat
          article={selectedArticle}
          isOpen={isChatOpen}
          onOpen={() => setIsChatOpen(true)}
          onClose={() => setIsChatOpen(false)}
        />
      </LayoutGroup>
    </div>
  );
}
