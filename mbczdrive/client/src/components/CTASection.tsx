import { PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  const scrollToContact = () => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 bg-[#D4AF37]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-8 md:mb-0 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-montserrat font-bold text-black mb-2">
              Prêt à découvrir l'expérience MBCZ Drive ?
            </h2>
            <p className="text-black text-opacity-80">
              Réservez maintenant ou contactez-nous pour obtenir un devis personnalisé.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button
              onClick={scrollToContact}
              className="bg-black text-white font-montserrat font-semibold px-8 py-6 h-auto rounded hover:bg-[#333333] transition-colors"
            >
              Réserver maintenant
            </Button>
            <a
              href="tel:+33782180293"
              className="bg-white text-black font-montserrat font-semibold px-8 py-4 rounded hover:bg-gray-100 inline-flex items-center justify-center transition-colors"
            >
              <PhoneCall className="mr-2" size={18} /> +33 7 82 18 02 93
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
