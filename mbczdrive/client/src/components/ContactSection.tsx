import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const ContactSection = () => {
  const contactInfo = [
    {
      icon: <MapPin className="text-black" />,
      title: "Adresse",
      content: "5 Boulevard de l'évasion, 95800 Cergy, France",
    },
    {
      icon: <Phone className="text-black" />,
      title: "Téléphone",
      content: "+33 7 82 18 02 93",
    },
    {
      icon: <Mail className="text-black" />,
      title: "Email",
      content: "mbcz.drive@gmail.com",
    },
    {
      icon: <Clock className="text-black" />,
      title: "Disponibilité",
      content: "24h/24 et 7j/7",
    },
  ];

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-4 text-center">
            Contactez-nous
          </h2>
          <div className="w-24 h-1 bg-[#D4AF37] mb-8 mx-auto"></div>
          <p className="text-gray-600 mb-12 text-center">
            Vous souhaitez réserver un de nos services ou obtenir plus d'informations ? N'hésitez pas à nous contacter :
          </p>
          <div className="space-y-8">
            {contactInfo.map((item, index) => (
              <div key={index} className="flex items-start">
                <div className="bg-[#D4AF37] p-3 rounded-full text-black mr-4">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-montserrat font-semibold mb-1">{item.title}</h3>
                  <p className="text-gray-600">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
