import Head from "next/head";
import { useRouter } from "next/router";
import DefaultLayout from "@/components/DefaultLayout";
import { useStore } from "@/lib/store";

export default function Perfil() {
  const router = useRouter();
  const { identity, setIdentity } = useStore();

  if (!identity) {
    return (
      <DefaultLayout maxWidth="sm">
        <Head>
          <title>Perfil · Iceberg</title>
        </Head>
        <div className="text-center py-12 bg-surface rounded-lg">
          <span className="text-4xl">🔐</span>
          <h1 className="text-xl font-bold mt-4">Sem identidade</h1>
          <p className="text-secondary mt-2 mb-4">
            Faça login para ver seu perfil.
          </p>
          <a href="/login" className="px-6 py-2 bg-primary text-white rounded-lg inline-block">
            Entrar
          </a>
        </div>
      </DefaultLayout>
    );
  }

  function handleLogout() {
    setIdentity(null);
    router.push("/");
  }

  return (
    <DefaultLayout maxWidth="md">
      <Head>
        <title>Meu Perfil · Iceberg</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">👤 Meu Perfil</h1>

      <div className="bg-surface rounded-lg p-6 space-y-6">
        {/* Avatar e chave */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center text-2xl text-primary">
            {identity.publicKey.slice(8, 10).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-secondary">Chave pública</p>
            <p className="font-mono text-sm truncate">{identity.publicKey}</p>
          </div>
        </div>

        {/* Informações */}
        <div className="grid gap-4">
          <div className="bg-background rounded-lg p-4">
            <p className="text-xs text-secondary mb-1">Short ID</p>
            <p className="font-semibold">{identity.publicKey.slice(8, 16)}...</p>
          </div>

          <div className="bg-background rounded-lg p-4">
            <p className="text-xs text-secondary mb-1">Criado em</p>
            <p className="font-semibold">
              {new Date(identity.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="border-t border-gray-700 pt-6 space-y-3">
          <a 
            href="/publicar"
            className="block w-full py-3 bg-primary text-white text-center rounded-lg hover:bg-primary/80"
          >
            ✏️ Publicar Novo Conteúdo
          </a>

          <button
            onClick={handleLogout}
            className="block w-full py-3 bg-red-500/20 text-red-400 text-center rounded-lg hover:bg-red-500/30 transition"
          >
            🚪 Sair
          </button>
        </div>

        {/* Aviso */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-300">
          ⚠️ Lembre-se de guardar seu mnemônico de 24 palavras em local seguro. 
          É a única forma de recuperar sua identidade.
        </div>
      </div>
    </DefaultLayout>
  );
}
