import { motion } from "framer-motion";
import { Check } from "lucide-react";

const ExperienceSection = () => {
  const features = [
    "Chauffeurs professionnels, discrets et multilingues",
    "Véhicules Mercedes-Benz haut de gamme, entretenus avec rigueur",
    "Ponctualité garantie et service disponible 24h/24 et 7j/7",
    "Confort exceptionnel et prestations personnalisées"
  ];

  return (
    <section className="py-20 bg-black text-white">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center">
          <motion.div
            className="md:w-1/2 mb-10 md:mb-0"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-6">
              L'expérience MBCZ Drive
            </h2>
            <div className="w-24 h-1 bg-[#D4AF37] mb-8"></div>
            <p className="text-[#C0C0C0] text-lg mb-6">
              Chez MBCZ Drive, nous ne proposons pas simplement un service de transport, mais une véritable expérience de luxe sur mesure.
            </p>
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="text-[#D4AF37] mt-1 mr-3" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          
          <motion.div
            className="md:w-1/2 md:pl-10"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="relative">
              <img
                src="/experience.webp"
                alt="Chauffeur professionnel ouvrant la porte à un client"
                className="rounded-lg shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-[#D4AF37] text-black p-4 md:p-6 rounded shadow-lg">
                <p className="font-montserrat font-bold text-xl md:text-2xl">10+ ans</p>
                <p className="text-sm md:text-base">d'excellence</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
