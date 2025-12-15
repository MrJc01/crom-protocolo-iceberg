/**
 * Página de Posts Agendados
 */

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";
import { api, useStore } from "@/lib/store";

interface ScheduledPost {
  id: string;
  title: string;
  body: string;
  region: string;
  category?: string;
  publishAt: number;
  endPostAfterDays?: number;
  status: "pending" | "published" | "cancelled";
  createdAt: number;
}

export default function AgendadosPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { identity } = useStore();

  const fetchScheduledPosts = async () => {
    setLoading(true);
    try {
      const result = await api.getScheduledPosts();
      setPosts(result.posts || []);
    } catch (error) {
      console.error("Erro ao buscar posts agendados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (identity) {
      fetchScheduledPosts();
    } else {
      setLoading(false);
    }
  }, [identity]);

  const handleCancel = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar este post agendado?")) return;
    
    try {
      await api.cancelScheduledPost(id);
      setPosts(posts.filter(p => p.id !== id));
    } catch (error) {
      console.error("Erro ao cancelar:", error);
    }
  };

  const handlePublishNow = async (id: string) => {
    if (!confirm("Publicar este post agora?")) return;
    
    try {
      const result = await api.publishScheduledPostNow(id);
      if (result.cid) {
        // Redirecionar para o post publicado
        window.location.href = `/post/${result.cid}`;
      } else {
        fetchScheduledPosts();
      }
    } catch (error) {
      console.error("Erro ao publicar:", error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getTimeRemaining = (publishAt: number) => {
    const now = Date.now();
    const diff = publishAt - now;
    
    if (diff <= 0) return "Pronto para publicar";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `em ${days} dia${days > 1 ? "s" : ""}`;
    }
    
    if (hours > 0) {
      return `em ${hours}h ${minutes}min`;
    }
    
    return `em ${minutes} minutos`;
  };

  return (
    <DefaultLayout>
      <Head>
        <title>Posts Agendados - Iceberg</title>
        <meta name="description" content="Gerencie seus posts agendados" />
      </Head>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl">
            📅
          </div>
          <div>
            <h1 className="text-3xl font-bold">Ices Agendados</h1>
            <p className="text-secondary">
              {posts.length} {posts.length === 1 ? "ice" : "ices"} na fila
            </p>
          </div>
        </div>
        <Link
          href="/publicar"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Novo Ice
        </Link>
      </div>

      {/* Conteúdo */}
      {!identity ? (
        <div className="text-center py-12 bg-surface rounded-xl">
          <div className="text-5xl mb-4">🔐</div>
          <p className="text-xl text-secondary mb-4">Faça login para ver seus posts agendados</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Entrar
          </Link>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-xl text-secondary mb-2">Nenhum post agendado</p>
          <p className="text-sm text-gray-500 mb-6">
            Agende posts para serem publicados automaticamente.
          </p>
          <Link
            href="/publicar"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Criar Post
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div
              key={post.id}
              className="bg-surface rounded-xl p-6 border border-gray-800 hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold mb-2 truncate">{post.title}</h2>
                  <p className="text-secondary text-sm line-clamp-2 mb-4">
                    {post.body.slice(0, 200)}...
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
                    <span className="flex items-center gap-1">
                      📍 {post.region}
                    </span>
                    <span className="flex items-center gap-1">
                      📅 {formatDate(post.publishAt)}
                    </span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                      {getTimeRemaining(post.publishAt)}
                    </span>
                    {post.endPostAfterDays && (
                      <span className="text-xs text-gray-500">
                        Auto-expira após {post.endPostAfterDays} dias
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.location.href = `/agendados/${post.id}/editar`}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handlePublishNow(post.id)}
                    className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                  >
                    Publicar Agora
                  </button>
                  <button
                    onClick={() => handleCancel(post.id)}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DefaultLayout>
  );
}
