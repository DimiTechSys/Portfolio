import { TourismExperience } from './tourismDataTypes';
import { en } from './tourismData/en';
import { fr } from './tourismData/fr';
import { ru } from './tourismData/ru';
import { ar } from './tourismData/ar';

export const getTourismExperiences = (locale: string): Record<string, TourismExperience> => {
  switch (locale) {
    case 'fr': return fr;
    case 'ru': return ru;
    case 'ar': return ar;
    case 'en':
    default:
      return en;
  }
};

// For backward compatibility in places where it might still be directly imported
export const tourismExperiences = fr;
