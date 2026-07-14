import { motion } from "framer-motion";
import { testimonials } from "@/data/testimonials";
import { Quote } from "lucide-react";

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-20 bg-[#333333] text-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-4">
            Ce que disent nos clients
          </h2>
          <div className="w-24 h-1 bg-[#D4AF37] mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-black bg-opacity-30 p-8 rounded-lg relative"
            >
              <div className="text-[#D4AF37] absolute -top-4 left-4 opacity-50">
                <Quote size={40} />
              </div>
              <div className="relative z-10">
                <p className="font-playfair italic mb-6">{testimonial.text}</p>
                <div className="flex items-center">
                  <div className="mr-4">
                    <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center">
                      <span className="font-montserrat font-bold text-black">
                        {testimonial.author.initials}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-montserrat font-semibold">
                      {testimonial.author.name}
                    </h4>
                    <p className="text-sm text-[#C0C0C0]">
                      {testimonial.author.title}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
