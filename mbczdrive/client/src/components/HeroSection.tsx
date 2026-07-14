import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const scrollToContact = () => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        {/* Hero Background Image */}
        <img
          src="hero.JPG"
          alt="Mercedes de luxe avec chauffeur"
          className="w-full h-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/40"></div>
      </div>

      <div className="container mx-auto px-6 z-10 text-center max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl md:text-5xl lg:text-6xl font-montserrat font-bold text-white leading-tight mb-4"
        >
          Voyagez avec <span className="text-[#D4AF37]">élégance</span> et confort
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-xl md:text-2xl font-light text-[#C0C0C0] mb-8"
        >
          Service de chauffeur privé avec véhicules de luxe.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex justify-center"
        >
          <Button
            onClick={scrollToContact}
            className="bg-[#D4AF37] hover:bg-white text-black font-montserrat font-semibold px-8 py-6 rounded transition-colors duration-300"
          >
            Réservez votre trajet
          </Button>
        </motion.div>
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center">
        <p className="text-sm mb-2 font-light">Découvrir plus</p>
        <ChevronDown className="animate-bounce mx-auto" />
      </div>
    </section>
  );
};

export default HeroSection;
