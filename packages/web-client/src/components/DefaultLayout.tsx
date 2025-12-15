import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import ChatWidget from "./ChatWidget";

interface DefaultLayoutProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

export default function DefaultLayout({ children, maxWidth = "lg" }: DefaultLayoutProps) {
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    full: "max-w-full",
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
      >
        Pular para o conteúdo principal
      </a>

      <Header />
      
      <main 
        id="main-content"
        role="main"
        aria-label="Conteúdo principal"
        className={`flex-1 container mx-auto px-4 py-6 ${maxWidthClasses[maxWidth]}`}
      >
        {children}
      </main>

      <Footer />
      
      {/* Floating Chat Widget */}
      <ChatWidget />
    </div>
  );
}
