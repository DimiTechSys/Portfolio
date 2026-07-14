export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  date: string;
  author: {
    name: string;
    role: string;
    image: string;
  };
  image: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
