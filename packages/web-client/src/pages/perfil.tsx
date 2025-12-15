import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";
import ContentList from "@/components/ContentList";
import { useStore, api, Post } from "@/lib/store";

export default function Perfil() {
  const router = useRouter();
  const { pubkey } = router.query;
  const { identity, setIdentity } = useStore();
  
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Determine which profile to show
  const viewingPubkey = (pubkey as string) || identity?.publicKey;
  const isOwnProfile = !pubkey || pubkey === identity?.publicKey;
  
  useEffect(() => {
    if (viewingPubkey) {
      loadUserPosts();
    }
  }, [viewingPubkey]);
  
  async function loadUserPosts() {
    setLoading(true);
    try {
      const data = await api.getPosts({ author: viewingPubkey });
      setUserPosts(data.posts || []);
    } catch (err) {
      console.error("Erro ao carregar posts:", err);
    } finally {
      setLoading(false);
    }
  }

  // Not logged in and no pubkey provided
  if (!identity && !pubkey) {
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
  
  function handleStartChat() {
    // ChatWidget handles this - just need to set up the conversation
    // For now, we'll just show a message
    alert(`Para iniciar conversa, clique no ícone de chat e cole a chave: ${viewingPubkey}`);
  }

  return (
    <DefaultLayout maxWidth="md">
      <Head>
        <title>{isOwnProfile ? "Meu Perfil" : "Perfil"} · Iceberg</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">
        {isOwnProfile ? "👤 Meu Perfil" : "👤 Perfil do Usuário"}
      </h1>

      <div className="bg-surface rounded-lg p-6 space-y-6">
        {/* Avatar e chave */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center text-2xl text-primary">
            {viewingPubkey?.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-secondary">Chave pública</p>
            <p className="font-mono text-sm truncate">{viewingPubkey}</p>
          </div>
        </div>

        {/* Informações */}
        <div className="grid gap-4">
          <div className="bg-background rounded-lg p-4">
            <p className="text-xs text-secondary mb-1">Short ID</p>
            <p className="font-semibold">@{viewingPubkey?.slice(0, 8)}...</p>
          </div>

          {isOwnProfile && identity && (
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
          )}
        </div>

        {/* Ações */}
        <div className="border-t border-gray-700 pt-6 space-y-3">
          {isOwnProfile ? (
            <>
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
            </>
          ) : (
            <button
              onClick={handleStartChat}
              className="block w-full py-3 bg-primary text-white text-center rounded-lg hover:bg-primary/80"
            >
              💬 Iniciar Conversa
            </button>
          )}
        </div>

        {/* Aviso (apenas para perfil próprio) */}
        {isOwnProfile && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-300">
            ⚠️ Lembre-se de guardar seu mnemônico de 24 palavras em local seguro. 
            É a única forma de recuperar sua identidade.
          </div>
        )}
      </div>

      {/* Posts do usuário */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">
          📝 {isOwnProfile ? "Meus Posts" : "Posts deste usuário"}
        </h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <ContentList 
            posts={userPosts}
            emptyState={{
              title: "Nenhum post encontrado",
              description: isOwnProfile 
                ? "Você ainda não publicou nenhum conteúdo."
                : "Este usuário ainda não publicou nenhum conteúdo."
            }}
          />
        )}
      </div>
    </DefaultLayout>
  );
}
