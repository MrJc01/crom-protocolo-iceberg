import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import DefaultLayout from "@/components/DefaultLayout";
import { api, useStore } from "@/lib/store";

export default function ImportarPage() {
  const router = useRouter();
  const { setIdentity } = useStore();
  const [mnemonic, setMnemonic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate mnemonic format (24 words)
    const words = mnemonic.trim().toLowerCase().split(/\s+/);
    if (words.length !== 24) {
      setError("O mnemônico deve conter exatamente 24 palavras.");
      setLoading(false);
      return;
    }

    try {
      // Call API to import identity
      const res = await fetch("/api/identity/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mnemonic: words.join(" ") }),
      });

      const result = await res.json();

      if (result.error) {
        setError(result.error);
      } else if (result.publicKey) {
        setIdentity({
          publicKey: result.publicKey,
          secretKey: "",
          createdAt: result.createdAt || Date.now(),
        });
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao importar identidade");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DefaultLayout maxWidth="sm">
      <Head>
        <title>Importar Identidade · Iceberg</title>
      </Head>

      <div className="bg-surface rounded-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <span className="text-5xl">🔑</span>
          <h1 className="text-2xl font-bold mt-4">Recuperar Identidade</h1>
          <p className="text-secondary mt-2 text-sm">
            Use seu mnemônico de 24 palavras para restaurar sua identidade.
          </p>
        </div>

        <form onSubmit={handleImport}>
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-secondary mb-2">
              📝 Mnemônico (24 palavras)
            </label>
            <textarea
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder="palavra1 palavra2 palavra3 ..."
              rows={4}
              className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 focus:border-primary focus:outline-none resize-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separe as palavras por espaços.
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 text-sm text-yellow-300">
            ⚠️ Nunca compartilhe seu mnemônico. Quem tiver essas palavras pode acessar sua identidade.
          </div>

          <button
            type="submit"
            disabled={loading || !mnemonic.trim()}
            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50"
          >
            {loading ? "⏳ Importando..." : "🔓 Recuperar Identidade"}
          </button>

          <a
            href="/login"
            className="block text-center text-sm text-secondary mt-4 hover:text-primary"
          >
            ← Voltar para Login
          </a>
        </form>
      </div>
    </DefaultLayout>
  );
}
