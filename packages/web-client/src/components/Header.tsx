import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  const router = useRouter();
  const { identity } = useStore();
  const asPath = router.asPath;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return asPath === "/" || asPath.startsWith("/pagina");
    return asPath.startsWith(path);
  };

  const navLinks = [
    { href: "/", label: "Relevantes", icon: "📰" },
    { href: "/recentes", label: "Recentes", icon: "🕐" },
  ];

  const userLinks = identity ? [
    { href: "/salvos", label: "Salvos", icon: "🔖" },
    { href: "/agendados", label: "Agendados", icon: "📅" },
    { href: "/meus-posts", label: "Meus Ices", icon: "📝" },
  ] : [];

  return (
    <header className="bg-surface/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <nav className="container mx-auto px-4 flex items-center h-14">
        {/* Logo + Nav */}
        <div className="flex items-center flex-1">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <span className="text-2xl">🧊</span>
            <span className="hidden sm:inline text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Iceberg
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link 
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  isActive(link.href) 
                    ? "bg-primary/20 text-primary font-medium" 
                    : "text-secondary hover:text-on-surface hover:bg-surface"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {identity ? (
            <>
              {/* Search */}
              <Link 
                href="/buscar" 
                className="p-2 hover:bg-background rounded-lg text-secondary hover:text-on-surface transition-colors"
                title="Buscar"
              >
                🔍
              </Link>

              {/* Publicar */}
              <Link 
                href="/publicar" 
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <span>✏️</span>
                <span className="hidden lg:inline">Publicar</span>
              </Link>

              {/* Mobile Publicar */}
              <Link 
                href="/publicar" 
                className="sm:hidden p-2 hover:bg-background rounded-lg text-secondary hover:text-on-surface"
                title="Publicar"
              >
                ➕
              </Link>

              {/* Profile Menu */}
              <div className="relative">
                <Link 
                  href="/perfil"
                  className="flex items-center gap-2 px-3 py-1.5 bg-background hover:bg-gray-800 rounded-lg transition"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs text-white font-medium">
                    {identity.publicKey.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline text-sm text-secondary">
                    @{identity.publicKey.slice(0, 8)}...
                  </span>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-background rounded-lg text-secondary"
              >
                {mobileMenuOpen ? "✕" : "☰"}
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/login"
                className="px-4 py-1.5 text-secondary hover:text-on-surface transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/login"
                className="px-4 py-1.5 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Começar
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && identity && (
        <div className="md:hidden bg-surface border-t border-gray-800 py-3 px-4">
          <div className="flex flex-col gap-1">
            {[...navLinks, ...userLinks].map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isActive(link.href)
                    ? "bg-primary/20 text-primary"
                    : "text-secondary hover:bg-background"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
