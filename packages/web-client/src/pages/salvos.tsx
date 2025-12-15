/**
 * Página de Posts Salvos
 */

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";
import ContentList from "@/components/ContentList";
import { Post, api, useStore } from "@/lib/store";

export default function SalvosPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { identity } = useStore();

  useEffect(() => {
    const fetchSavedPosts = async () => {
      setLoading(true);
      try {
        const result = await api.getSavedPosts();
        setPosts(result.posts || []);
        setTotal(result.total || 0);
      } catch (error) {
        console.error("Erro ao buscar posts salvos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (identity) {
      fetchSavedPosts();
    } else {
      setLoading(false);
    }
  }, [identity]);

  return (
    <DefaultLayout>
      <Head>
        <title>Posts Salvos - Iceberg</title>
        <meta name="description" content="Seus posts salvos no Iceberg" />
      </Head>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl">
            🔖
          </div>
          <div>
            <h1 className="text-3xl font-bold">Ices Salvos</h1>
            <p className="text-secondary">
              {total} {total === 1 ? "ice salvo" : "ices salvos"}
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {!identity ? (
        <div className="text-center py-12 bg-surface rounded-xl">
          <div className="text-5xl mb-4">🔐</div>
          <p className="text-xl text-secondary mb-4">Faça login para ver seus posts salvos</p>
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
          <div className="text-5xl mb-4">📑</div>
          <p className="text-xl text-secondary mb-2">Nenhum post salvo</p>
          <p className="text-sm text-gray-500 mb-6">
            Salve posts clicando no ícone de marcador para acessá-los depois.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Explorar Posts
          </Link>
        </div>
      ) : (
        <ContentList posts={posts} />
      )}
    </DefaultLayout>
  );
}
