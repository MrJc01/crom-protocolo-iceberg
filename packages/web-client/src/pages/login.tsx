import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import DefaultLayout from "@/components/DefaultLayout";
import { api, useStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { setIdentity } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mnemonic, setMnemonic] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.createIdentity(true);
      if (result.publicKey) {
        setIdentity({
          publicKey: result.publicKey,
          secretKey: "",
          createdAt: Date.now(),
        });
        if (result.mnemonic) {
          setMnemonic(result.mnemonic);
        } else {
          router.push("/");
        }
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao criar identidade");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadExisting() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getIdentity();
      if (result.publicKey) {
        setIdentity({
          publicKey: result.publicKey,
          secretKey: "",
          createdAt: result.createdAt,
        });
        router.push("/");
      }
    } catch {
      setError("Nenhuma identidade encontrada. Crie uma nova.");
    } finally {
      setLoading(false);
    }
  }

  if (mnemonic) {
    return (
      <DefaultLayout maxWidth="md">
        <Head>
          <title>Identidade Criada · Iceberg</title>
        </Head>

        <div className="bg-surface rounded-lg p-6 max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-center mb-4">🔐 Identidade Criada!</h1>

          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400 font-semibold mb-1">⚠️ ATENÇÃO</p>
            <p className="text-sm text-red-300">
              Guarde estas palavras em local seguro. É a única forma de recuperar sua identidade.
            </p>
          </div>

          <div className="bg-background rounded-lg p-4 mb-6">
            <p className="text-xs text-secondary mb-2">📝 Mnemônico (24 palavras):</p>
            <div className="grid grid-cols-4 gap-2">
              {mnemonic.split(" ").map((word, i) => (
                <div key={i} className="bg-surface rounded px-2 py-1 text-sm text-center">
                  <span className="text-gray-500 text-xs">{i + 1}.</span> {word}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/80"
          >
            ✅ Guardei, continuar
          </button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout maxWidth="sm">
      <Head>
        <title>Login · Iceberg</title>
      </Head>

      <div className="bg-surface rounded-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <span className="text-5xl">🧊</span>
          <h1 className="text-2xl font-bold mt-4">Entrar no Iceberg</h1>
          <p className="text-secondary mt-2 text-sm">
            Plataforma descentralizada de informação cidadã
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50"
          >
            {loading ? "⏳ Criando..." : "🆕 Criar Nova Identidade"}
          </button>

          <button
            onClick={handleLoadExisting}
            disabled={loading}
            className="w-full py-3 bg-surface border border-gray-600 rounded-lg hover:bg-background disabled:opacity-50"
          >
            {loading ? "⏳ Carregando..." : "🔑 Usar Identidade Existente"}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Sua identidade é uma chave criptográfica ED25519.
          <br />
          Nunca pedimos email, senha ou dados pessoais.
        </p>

        <div className="text-center mt-4 pt-4 border-t border-gray-700">
          <a
            href="/importar"
            className="text-sm text-primary hover:underline"
          >
            🔑 Já tem um mnemônico? Recuperar identidade
          </a>
        </div>
      </div>
    </DefaultLayout>
  );
}
