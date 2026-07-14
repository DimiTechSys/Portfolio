import { Instagram } from "lucide-react";
import { motion } from "framer-motion";

const Footer = () => {
  const services = [
    { name: "Transferts aéroport/gare", href: "#" },
    { name: "Événements spéciaux", href: "#" },
    { name: "Services d'affaires", href: "#" },
    { name: "Tours privés", href: "#" },
  ];

  return (
    <footer className="bg-black text-white pt-10 pb-6"> {/* Adjusted padding */}
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 lg:gap-12 mb-6"> {/* Adjusted gap */}
          <div className="flex-1">
            <a href="#" className="text-2xl font-montserrat font-bold">
              <span className="text-[#D4AF37]">M</span>
              <span className="text-white">BCZ Drive</span>
            </a>
            <p className="text-gray-400 text-sl mt-3 max-w-xs"> {/* Increased text size */}
              Transport premium avec chauffeur privé, sur mesure pour vos besoins professionnels et personnels.
            </p>
            <div className="mt-3"> {/* Increased margin */}
              <a
                href="https://www.instagram.com/mbcz_drive/"
                className="text-gray-400 hover:text-[#D4AF37] transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={24} /> {/* Increased icon size */}
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sl mb-2"> {/* Adjusted heading size */}
              Services
            </h3>
            <ul className="space-y-1 text-sl text-gray-400"> {/* Increased text size */}
              {services.map((service, index) => (
                <li key={index}>
                  <a
                    href={service.href}
                    className="hover:text-[#D4AF37] transition-colors"
                  >
                    {service.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="border-t border-gray-800 pt-4"
        >
          <p className="text-gray-400 text-sm text-center"> {/* Increased text size */}
            &copy; {new Date().getFullYear()} MBCZ Drive. Tous droits réservés.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
