import Head from "next/head";
import DefaultLayout from "@/components/DefaultLayout";

export default function Contato() {
  return (
    <DefaultLayout maxWidth="sm">
      <Head>
        <title>Contato · Iceberg</title>
      </Head>

      <div className="text-center py-8">
        <span className="text-4xl">📬</span>
        <h1 className="text-2xl font-bold mt-4">Contato</h1>
        <p className="text-secondary mt-2 mb-6">
          Entre em contato através dos canais abaixo
        </p>

        <div className="space-y-4 text-left bg-surface rounded-lg p-6">
          <a 
            href="https://github.com/MrJc01/crom-protocolo-iceberg/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-gray-800 transition"
          >
            <span className="text-xl">🐛</span>
            <div>
              <p className="font-semibold">Reportar Bug</p>
              <p className="text-sm text-secondary">Abrir issue no GitHub</p>
            </div>
          </a>

          <a 
            href="https://github.com/MrJc01/crom-protocolo-iceberg"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-gray-800 transition"
          >
            <span className="text-xl">💻</span>
            <div>
              <p className="font-semibold">Contribuir</p>
              <p className="text-sm text-secondary">Pull requests são bem-vindos!</p>
            </div>
          </a>
        </div>
      </div>
    </DefaultLayout>
  );
}
