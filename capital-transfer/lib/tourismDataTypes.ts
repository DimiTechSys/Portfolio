export interface TourismExperienceSection {
  title: string;
  content: string;
  list?: string[];
  image?: string;
}

export interface TourismExperiencePricingPackage {
  name: string;
  price: string | number;
  description: string;
}

export interface TourismExperiencePricingOption {
  name: string;
  price: string;
}

export interface TourismExperience {
  id: string;
  image: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  sections: TourismExperienceSection[];
  highlights: string[];
  price: number | string;
  pricingPackages?: TourismExperiencePricingPackage[];
  pricingOptions?: TourismExperiencePricingOption[];
}
