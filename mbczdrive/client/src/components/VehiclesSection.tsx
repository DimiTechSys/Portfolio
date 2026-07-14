import { motion } from "framer-motion";
import { vehicles } from "@/data/vehicles";
import { Users, Briefcase, Wifi, Snowflake, Wine, ShieldCheck } from "lucide-react";

const VehiclesSection = () => {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "users":
        return <Users className="text-[#D4AF37] mr-3" size={20} />;
      case "suitcase":
        return <Briefcase className="text-[#D4AF37] mr-3" size={20} />;
      case "wifi":
        return <Wifi className="text-[#D4AF37] mr-3" size={20} />;
      case "snowflake":
        return <Snowflake className="text-[#D4AF37] mr-3" size={20} />;
      case "glass-cheers":
        return <Wine className="text-[#D4AF37] mr-3" size={20} />;
      case "massage":
        return <Users className="text-[#D4AF37] mr-3" size={20} />;
      case "shield-alt":
        return <ShieldCheck className="text-[#D4AF37] mr-3" size={20} />;
      default:
        return <Users className="text-[#D4AF37] mr-3" size={20} />;
    }
  };

  return (
    <section id="vehicles" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-4">
            Notre Flotte Mercedes-Benz
          </h2>
          <div className="w-24 h-1 bg-[#D4AF37] mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Découvrez notre gamme de véhicules Mercedes-Benz luxueux, combinant élégance, confort et sécurité pour répondre à tous vos besoins.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {vehicles.map((vehicle) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-[#F5F5F5] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              <div className="h-64 bg-gray-200 relative overflow-hidden">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-0 right-0 bg-[#D4AF37] text-black py-1 px-4 font-montserrat font-medium">
                  {vehicle.className}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-montserrat font-semibold mb-4">
                  {vehicle.name}
                </h3>
                <ul className="space-y-2 text-gray-700 mb-6">
                  {vehicle.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      {getIconComponent(feature.icon)}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-gray-600 text-sm">{vehicle.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VehiclesSection;
