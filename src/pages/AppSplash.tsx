import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import logo from "@/assets/logo.png";

const AppSplash = () => {
  return (
    <>
      <SEO 
        title="Get the Domus Servitia App"
        description="Download the Domus Servitia mobile app for seamless property management on the go"
      />
      <div className="min-h-screen text-white overflow-hidden relative" style={{ background: 'var(--gradient-primary)' }}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-screen">
          {/* Logo */}
          <div className="mb-8 animate-fade-in">
            <img 
              src={logo} 
              alt="Domus Servitia" 
              className="w-32 h-32 rounded-3xl shadow-2xl border-4 border-white/30 object-cover"
            />
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-bold text-center mb-4 animate-fade-in animation-delay-200">
            Domus Servitia
          </h1>
          <p className="text-xl md:text-2xl text-white/90 text-center mb-12 max-w-md animate-fade-in animation-delay-400">
            Property Management, Simplified.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-4xl animate-fade-in animation-delay-600">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
              <Users className="w-8 h-8 mb-4 text-white" />
              <h3 className="font-semibold text-lg mb-2">Role-Based Access</h3>
              <p className="text-white/80 text-sm">Custom dashboards for lodgers, landlords, staff, and admins</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
              <Shield className="w-8 h-8 mb-4 text-white" />
              <h3 className="font-semibold text-lg mb-2">Secure & Private</h3>
              <p className="text-white/80 text-sm">Bank-level encryption for all your data and payments</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
              <Sparkles className="w-8 h-8 mb-4 text-white" />
              <h3 className="font-semibold text-lg mb-2">Always Updated</h3>
              <p className="text-white/80 text-sm">Real-time notifications and instant updates</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md animate-fade-in animation-delay-800">
            <Button 
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-semibold flex-1 h-14 text-lg shadow-xl"
            >
              <Link to="/onboarding">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button 
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold flex-1 h-14 text-lg"
            >
              <Link to="/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        .animation-delay-800 {
          animation-delay: 0.8s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </>
  );
};

export default AppSplash;
