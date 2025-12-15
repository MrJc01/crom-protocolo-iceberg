import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";
import ContentList from "@/components/ContentList";
import { Post, api, useStore } from "@/lib/store";

export default function MeusPostsPage() {
  const { identity } = useStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (identity?.publicKey) {
      loadPosts();
    }
  }, [identity]);

  async function loadPosts() {
    try {
      const data = await api.getPosts({ author: identity?.publicKey });
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Erro ao carregar posts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleArchive(cid: string) {
    if (!confirm("Tem certeza que deseja arquivar este post?")) return;

    try {
      const res = await fetch(`/api/posts/${cid}/archive`, { method: "POST" });
      if (res.ok) {
        loadPosts(); // Reload
      }
    } catch (err) {
      console.error("Erro ao arquivar:", err);
    }
  }

  async function handleDelete(cid: string) {
    if (!confirm("Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.")) return;

    try {
      const res = await fetch(`/api/posts/${cid}`, { method: "DELETE" });
      if (res.ok) {
        loadPosts(); // Reload
      }
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  }

  if (!identity) {
    return (
      <DefaultLayout maxWidth="sm">
        <Head>
          <title>Meus Posts · Iceberg</title>
        </Head>
        <div className="text-center py-12 bg-surface rounded-lg">
          <span className="text-4xl">🔐</span>
          <h1 className="text-xl font-bold mt-4">Login Necessário</h1>
          <p className="text-secondary mt-2 mb-4">
            Faça login para gerenciar seus posts.
          </p>
          <a href="/login" className="px-6 py-2 bg-primary text-white rounded-lg inline-block">
            Entrar
          </a>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout maxWidth="lg">
      <Head>
        <title>Meus Posts · Iceberg</title>
      </Head>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📝 Meus Posts</h1>
        <Link
          href="/publicar"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
        >
          + Novo Post
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-lg">
          <span className="text-4xl">📄</span>
          <h2 className="text-xl font-semibold mt-4">Nenhum post ainda</h2>
          <p className="text-secondary mt-2">
            Você ainda não publicou nenhum conteúdo.
          </p>
          <Link
            href="/publicar"
            className="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
          >
            Criar Primeiro Post
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.cid} className="bg-surface rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link
                    href={`/post/${post.cid}`}
                    className="text-lg font-semibold hover:text-primary"
                  >
                    {post.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-2 text-sm text-secondary">
                    <span className={`level-badge level-${post.level}`}>
                      Nível {post.level}
                    </span>
                    <span>📍 {post.region.split("-").pop()}</span>
                    <span>
                      {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    <span>{post.votes?.score || 0} pontos</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {post.level < 2 && (
                    <>
                      <Link
                        href={`/post/${post.cid}/editar`}
                        className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                      >
                        ✏️ Editar
                      </Link>
                      <button
                        onClick={() => handleArchive(post.cid)}
                        className="px-3 py-1 text-sm bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30"
                      >
                        📦 Arquivar
                      </button>
                      <button
                        onClick={() => handleDelete(post.cid)}
                        className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                      >
                        🗑️ Excluir
                      </button>
                    </>
                  )}
                  {post.level >= 2 && (
                    <span className="text-xs text-secondary">
                      Nível {post.level}+ não pode ser editado
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DefaultLayout>
  );
}
