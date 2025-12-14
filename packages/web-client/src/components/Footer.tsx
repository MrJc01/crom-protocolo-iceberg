import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-secondary">
          <Link href="/sobre" className="hover:text-on-surface">Sobre</Link>
          <Link href="/contato" className="hover:text-on-surface">Contato</Link>
          <Link href="/termos-de-uso" className="hover:text-on-surface">Termos de Uso</Link>
          <Link href="/faq" className="hover:text-on-surface">FAQ</Link>
          <a 
            href="https://github.com/MrJc01/crom-protocolo-iceberg" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-on-surface"
          >
            GitHub
          </a>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          🧊 Protocolo Iceberg v0.1.0 · Plataforma descentralizada de informação cidadã
        </p>
      </div>
    </footer>
  );
}
