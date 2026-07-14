import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const headerClass = `fixed w-full bg-black bg-opacity-90 z-50 transition-all duration-300 ${
    scrolled ? "py-2" : "py-3"
  }`;

  const navLinks = [
    { href: "#services", text: "Services" },
    { href: "#vehicles", text: "Véhicules" },
    { href: "#testimonials", text: "Témoignages" },
    { href: "#contact", text: "Contact" }
  ];

  return (
    <header className={headerClass}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          {/* Corrected syntax for the logo */}
          <img src="/mbcz-logo.png" alt="MBCZ Logo" className="w-32 h-auto object-contain" />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          {navLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="text-white font-montserrat text-sm tracking-wide hover:text-[#D4AF37] transition-colors"
            >
              {link.text}
            </a>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={toggleMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-black bg-opacity-95 w-full"
        >
          <div className="container mx-auto px-4 py-3">
            <nav className="flex flex-col space-y-4 py-4">
              {navLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="text-white font-montserrat text-sm tracking-wide hover:text-[#D4AF37] transition-colors"
                  onClick={closeMenu}
                >
                  {link.text}
                </a>
              ))}
            </nav>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
