import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

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
      <Header />
      
      <main className={`flex-1 container mx-auto px-4 py-6 ${maxWidthClasses[maxWidth]}`}>
        {children}
      </main>

      <Footer />
    </div>
  );
}
