/**
 * Onboarding Wizard Component
 * 
 * Guides first-time users through the app features
 */

import { useState, useEffect } from "react";

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Bem-vindo ao Iceberg!",
    description: "Uma plataforma descentralizada e incensurável para compartilhar informações de interesse público.",
    icon: "🧊",
  },
  {
    title: "Sua Identidade é Única",
    description: "Você é identificado por chaves criptográficas, não por email ou senha. Guarde bem suas palavras de recuperação!",
    icon: "🔐",
  },
  {
    title: "Sistema de Níveis",
    description: "Posts começam no Nível 0 e sobem conforme recebem votos positivos. Nível 3 é permanente e imutável!",
    icon: "📊",
  },
  {
    title: "Privacidade Primeiro",
    description: "Seus dados ficam no seu dispositivo. A rede P2P mantém o conteúdo vivo sem servidores centrais.",
    icon: "🛡️",
  },
  {
    title: "Pronto para Começar!",
    description: "Explore o feed, publique denúncias, vote em conteúdo e ajude a construir uma rede de informação livre.",
    icon: "🚀",
  },
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      setIsVisible(false);
      localStorage.setItem("onboarding_complete", "true");
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem("onboarding_complete", "true");
    onComplete();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-surface max-w-md w-full mx-4 rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-secondary/30">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">{step.icon}</div>
          <h2 className="text-2xl font-bold text-foreground mb-3">{step.title}</h2>
          <p className="text-secondary mb-8 leading-relaxed">{step.description}</p>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {ONBOARDING_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep ? "bg-primary w-6" : "bg-secondary/50"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="px-6 py-2 text-secondary hover:text-foreground transition-colors"
              >
                Pular
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {isLastStep ? "Começar" : "Próximo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to check if onboarding should be shown
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem("onboarding_complete");
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  return { showOnboarding, completeOnboarding };
}
