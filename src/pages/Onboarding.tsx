import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Home, Bell, Lock, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";

const onboardingSteps = [
  {
    icon: Home,
    title: "Manage Everything",
    description: "From rent payments to maintenance requests, handle all your property needs in one place.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Bell,
    title: "Stay Informed",
    description: "Get instant notifications about payments, updates, and important property matters.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your data is protected with bank-level encryption. We take your privacy seriously.",
    color: "from-orange-500 to-red-500"
  }
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/login");
    }
  };

  const handleSkip = () => {
    navigate("/login");
  };

  const step = onboardingSteps[currentStep];
  const Icon = step.icon;

  return (
    <>
      <SEO 
        title="Welcome to Domus Servitia"
        description="Learn how Domus Servitia makes property management simple and efficient"
      />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="p-6 flex justify-between items-center">
          <div className="flex gap-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? "w-8 bg-primary" 
                    : index < currentStep
                    ? "w-8 bg-primary/50"
                    : "w-8 bg-muted"
                }`}
              />
            ))}
          </div>
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <div 
            className={`w-40 h-40 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mb-12 shadow-2xl animate-scale-in`}
            key={currentStep}
          >
            <Icon className="w-20 h-20 text-white" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 animate-fade-in">
            {step.title}
          </h2>
          
          <p className="text-lg text-muted-foreground text-center max-w-md mb-12 animate-fade-in animation-delay-200">
            {step.description}
          </p>

          {currentStep === onboardingSteps.length - 1 && (
            <div className="space-y-3 w-full max-w-md animate-fade-in animation-delay-400">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm">Role-based dashboards</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm">Real-time notifications</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm">Secure payment processing</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Button */}
        <div className="p-6 pb-8">
          <Button 
            onClick={handleNext}
            size="lg"
            className="w-full h-14 text-lg font-semibold shadow-lg"
          >
            {currentStep === onboardingSteps.length - 1 ? "Get Started" : "Next"}
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
          animation-fill-mode: both;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </>
  );
};

export default Onboarding;
