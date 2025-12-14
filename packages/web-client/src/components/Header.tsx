import Link from "next/link";
import { useRouter } from "next/router";
import { useStore } from "@/lib/store";

export default function Header() {
  const router = useRouter();
  const { identity } = useStore();
  const asPath = router.asPath;

  const isActive = (path: string) => {
    if (path === "/") return asPath === "/" || asPath.startsWith("/pagina");
    return asPath.startsWith(path);
  };

  return (
    <header className="bg-surface border-b border-gray-800 sticky top-0 z-50">
      <nav className="container mx-auto px-4 flex items-center h-14">
        {/* Logo + Navegação principal */}
        <div className="flex items-center flex-1">
          <Link href="/" className="flex items-center gap-2 mr-4">
            <span className="text-2xl">🧊</span>
            <span className="hidden sm:inline text-lg font-bold">Iceberg</span>
          </Link>

          <Link 
            href="/"
            className={`px-3 py-1 ${isActive("/") ? "text-on-surface underline underline-offset-4" : "text-secondary hover:text-on-surface"}`}
          >
            Relevantes
          </Link>

          <Link 
            href="/recentes"
            className={`px-3 py-1 ${isActive("/recentes") ? "text-on-surface underline underline-offset-4" : "text-secondary hover:text-on-surface"}`}
          >
            Recentes
          </Link>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {identity ? (
            <>
              {/* Publicar */}
              <Link 
                href="/publicar" 
                className="p-2 hover:bg-background rounded-lg text-secondary hover:text-on-surface"
                title="Publicar novo conteúdo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>

              {/* Menu usuário */}
              <Link 
                href="/perfil"
                className="flex items-center gap-2 px-3 py-1.5 bg-background hover:bg-gray-800 rounded-lg transition"
              >
                <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-xs text-primary">
                  {identity.publicKey.slice(8, 10).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm text-secondary">
                  {identity.publicKey.slice(8, 16)}...
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/login"
                className="px-4 py-1.5 text-secondary hover:text-on-surface"
              >
                Login
              </Link>
              <Link 
                href="/cadastro"
                className="px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/80"
              >
                Cadastrar
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
