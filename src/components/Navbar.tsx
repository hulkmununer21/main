import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled
          ? "bg-background/98 backdrop-blur-md shadow-lifted border-accent/20"
          : "bg-gradient-to-b from-primary/95 to-primary/90 backdrop-blur-sm border-primary-foreground/10"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src={logo}
              alt="Domus Servitia"
              className="h-14 sm:h-16 md:h-20 w-auto rounded-xl transition-transform duration-300 group-hover:scale-105 shadow-md"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <a
              href="/#home"
              className={`text-sm font-semibold transition-colors ${
                isScrolled
                  ? "text-foreground hover:text-accent"
                  : "text-primary-foreground hover:text-accent"
              }`}
            >
              Home
            </a>
            <a
              href="/#properties"
              className={`text-sm font-semibold transition-colors ${
                isScrolled
                  ? "text-foreground hover:text-accent"
                  : "text-primary-foreground hover:text-accent"
              }`}
            >
              Properties
            </a>
            <div className="group relative">
              <button
                className={`flex items-center space-x-1 text-sm font-semibold transition-colors ${
                  isScrolled
                    ? "text-foreground hover:text-accent"
                    : "text-primary-foreground hover:text-accent"
                }`}
              >
                <span>Services</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-56 bg-card shadow-lifted rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border border-accent/30">
                <a
                  href="/#services"
                  className="block px-4 py-3 text-sm font-medium hover:bg-accent/10 hover:text-accent transition-colors rounded-t-lg"
                >
                  All Services
                </a>
                <Link
                  to="/services"
                  className="block px-4 py-3 text-sm hover:bg-accent/10 transition-colors"
                >
                  Property Maintenance
                </Link>
                <Link
                  to="/services"
                  className="block px-4 py-3 text-sm hover:bg-accent/10 transition-colors rounded-b-lg"
                >
                  Professional Cleaning
                </Link>
              </div>
            </div>
            <Link
              to="/about"
              className={`text-sm font-semibold transition-colors ${
                isScrolled
                  ? "text-foreground hover:text-accent"
                  : "text-primary-foreground hover:text-accent"
              }`}
            >
              About
            </Link>
            <a
              href="/#contact"
              className={`text-sm font-semibold transition-colors ${
                isScrolled
                  ? "text-foreground hover:text-accent"
                  : "text-primary-foreground hover:text-accent"
              }`}
            >
              Contact
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button
              variant="outline"
              asChild
              className={`font-semibold text-accent hover:text-accent ${
                isScrolled
                  ? "border-accent/50 hover:bg-accent/10"
                  : "border-accent/50 hover:bg-accent/10"
              }`}
            >
              <Link to="/login">Login</Link>
            </Button>
            <Button
              asChild
              className="bg-gradient-gold text-primary font-bold shadow-gold hover:shadow-lifted transition-all duration-300 border-2 border-accent/30"
            >
              <Link to="/properties">View Properties</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 touch-manipulation"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X
                className={`h-6 w-6 sm:h-7 sm:w-7 ${
                  isScrolled ? "text-foreground" : "text-primary-foreground"
                }`}
              />
            ) : (
              <Menu
                className={`h-6 w-6 sm:h-7 sm:w-7 ${
                  isScrolled ? "text-foreground" : "text-primary-foreground"
                }`}
              />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 sm:py-6 space-y-3 sm:space-y-4 border-t border-border animate-fade-in">
            <a
              href="/#home"
              className="block text-base font-medium text-foreground hover:text-accent transition-colors py-2 px-2 rounded-md hover:bg-accent/10 touch-manipulation"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="/#properties"
              className="block text-base font-medium text-foreground hover:text-accent transition-colors py-2 px-2 rounded-md hover:bg-accent/10 touch-manipulation"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Properties
            </a>
            <a
              href="/#services"
              className="block text-base font-medium text-foreground hover:text-accent transition-colors py-2 px-2 rounded-md hover:bg-accent/10 touch-manipulation"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Services
            </a>
            <Link
              to="/about"
              className="block text-base font-medium text-foreground hover:text-accent transition-colors py-2 px-2 rounded-md hover:bg-accent/10 touch-manipulation"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <a
              href="/#contact"
              className="block text-base font-medium text-foreground hover:text-accent transition-colors py-2 px-2 rounded-md hover:bg-accent/10 touch-manipulation"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </a>
            <div className="flex flex-col space-y-3 pt-2 sm:pt-4">
              <Button variant="outline" asChild className="w-full h-11 text-base touch-manipulation">
                <Link to="/login">Login</Link>
              </Button>
              <Button
                asChild
                className="w-full h-11 bg-gradient-gold text-primary font-semibold text-base touch-manipulation"
              >
                <Link to="/properties">View Properties</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
