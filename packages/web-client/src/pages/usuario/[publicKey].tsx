/**
 * Página de Perfil de Usuário Público
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import DefaultLayout from "@/components/DefaultLayout";
import ContentList from "@/components/ContentList";
import { Post, api, useStore } from "@/lib/store";

export default function UsuarioPage() {
  const router = useRouter();
  const { publicKey } = router.query;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { identity } = useStore();

  const shortKey = publicKey 
    ? `${String(publicKey).slice(0, 8)}...${String(publicKey).slice(-6)}` 
    : "";
  
  const isOwnProfile = identity?.publicKey === publicKey;

  useEffect(() => {
    if (!publicKey) return;
    
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const result = await api.getPosts({ author: publicKey as string });
        setPosts(result.posts || []);
        setTotal(result.total || 0);
      } catch (error) {
        console.error("Erro ao buscar posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [publicKey]);

  // Gerar avatar baseado na public key (identicon simplificado)
  const generateAvatar = (key: string): string => {
    const colors = [
      "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", 
      "#EF4444", "#EC4899", "#06B6D4", "#84CC16"
    ];
    const hash = key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (!publicKey) {
    return null;
  }

  return (
    <DefaultLayout>
      <Head>
        <title>Usuário {shortKey} - Iceberg</title>
        <meta name="description" content={`Perfil do usuário ${shortKey} no Iceberg`} />
      </Head>

      {/* Header do Perfil */}
      <div className="mb-8 bg-surface rounded-xl p-6 border border-gray-800">
        <div className="flex flex-wrap items-center gap-6">
          {/* Avatar */}
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
            style={{ backgroundColor: generateAvatar(publicKey as string) }}
          >
            {String(publicKey).slice(0, 2).toUpperCase()}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold truncate">{shortKey}</h1>
              {isOwnProfile && (
                <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                  Você
                </span>
              )}
            </div>
            
            <p className="text-secondary text-sm font-mono break-all">
              {publicKey}
            </p>
            
            <div className="flex items-center gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1">
                📝 <strong>{total}</strong> posts
              </span>
              {/* Aqui poderia adicionar reputação, nível, etc */}
            </div>
          </div>
          
          {/* Ações */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(publicKey as string)}
              className="px-4 py-2 bg-surface-light rounded-lg hover:bg-gray-700 transition-colors"
              title="Copiar chave pública"
            >
              📋 Copiar
            </button>
            {!isOwnProfile && (
              <button
                onClick={() => router.push(`/chat?peer=${publicKey}`)}
                className="px-4 py-2 bg-primary rounded-lg hover:bg-primary-dark transition-colors text-white"
              >
                💬 Mensagem
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Posts */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Posts de {shortKey}</h2>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-xl text-secondary mb-2">Nenhum post ainda</p>
          <p className="text-sm text-gray-500">
            Este usuário ainda não publicou nada.
          </p>
        </div>
      ) : (
        <ContentList posts={posts} />
      )}
    </DefaultLayout>
  );
}
