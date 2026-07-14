import { useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import ExperienceSection from "@/components/ExperienceSection";
import VehiclesSection from "@/components/VehiclesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import ScrollToTopButton from "@/components/ScrollToTopButton";

const Home = () => {
  useEffect(() => {
    // Set page title
    document.title = "MBCZ Drive | Service de Chauffeur Privé Mercedes";
    
    // Setup meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "MBCZ Drive - Service de chauffeur privé avec véhicules Mercedes haut de gamme. Voyagez avec élégance et confort pour vos transferts aéroport, événements spéciaux et services d'affaires.");
    }
  }, []);

  return (
    <div className="font-roboto text-[#333333] bg-white">
      <Header />
      <HeroSection />
      <ServicesSection />
      <ExperienceSection />
      <VehiclesSection />
      <TestimonialsSection />
      <CTASection />
      <ContactSection />
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default Home;
