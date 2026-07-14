import { Article } from './types';
import rawArticles from '../nosoclean_articles.json';

type RawArticle = {
  id: string;
  segment: string;
  date: string;
  title: string;
  excerpt: string;
  body: string;
};

const articleImages: Record<string, string> = {
  "H001": "/images/1.jpeg",
  "H002": "/images/2.jpg",
  "H003": "/images/3.jpg",
  "P001": "/images/4.jpg",
  "P002": "/images/5.webp",
  "P003": "/images/6.webp",
  "A001": "/images/7.jpg",
  "A002": "/images/8.webp",
  "A003": "/images/9.jpg",
  "C001": "/images/10.jpg",
  "C002": "/images/11.jpg",
  "C003": "/images/12.jpg",
  "D001": "/images/13.jpg",
  "D002": "/images/14.webp",
  "D003": "/images/15.jpg",
};

const categoryAuthor: Record<string, { name: string; role: string; imageSeed: string }> = {
  Hospitalier: { name: 'Dr. Salima Rahmani', role: 'Hospital Pharmacist', imageSeed: 'salima' },
  Pharma: { name: 'Ing. Lina Bensaid', role: 'Pharma Quality Lead', imageSeed: 'lina' },
  Agroalimentaire: { name: 'Karim Boudiaf', role: 'Food Safety Consultant', imageSeed: 'karim' },
  Collectivite: { name: 'Nadia Khelifi', role: 'HACCP Manager', imageSeed: 'nadia' },
  'Collectivité': { name: 'Nadia Khelifi', role: 'HACCP Manager', imageSeed: 'nadia' },
  Dentaire: { name: 'Dr. Yacine Merabet', role: 'Dental Surgeon', imageSeed: 'yacine' },
};

export const articles: Article[] = (rawArticles as RawArticle[]).map((item) => {
  const author = categoryAuthor[item.segment] || {
    name: 'Nosoclean Expert Team',
    role: 'Scientific Editorial Board',
    imageSeed: 'nosoclean-expert',
  };
  const heroImage = articleImages[item.id] || '/images/default-article.jpg';

  return {
    id: item.id.toLowerCase(),
    title: item.title,
    summary: item.excerpt,
    content: item.body,
    category: item.segment,
    date: item.date,
    author: {
      name: author.name,
      role: author.role,
      image: `https://picsum.photos/seed/${author.imageSeed}/200/200`,
    },
    image: heroImage,
  };
});
