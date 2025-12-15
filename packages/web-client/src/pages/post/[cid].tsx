import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";
import CommentSection from "@/components/CommentSection";
import ReportButton from "@/components/ReportButton";
import { Post, api, useStore } from "@/lib/store";
import { useEffect, useState } from "react";

export default function PostPage() {
  const router = useRouter();
  const { cid } = router.query;
  const { identity } = useStore();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cid) loadPost();
  }, [cid]);

  async function loadPost() {
    setLoading(true);
    try {
      const data = await api.getPost(cid as string);
      setPost(data);
    } catch (err: any) {
      setError("Post não encontrado");
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(type: "up" | "down") {
    if (!identity || !post) return;
    try {
      await api.vote(post.cid, type);
      loadPost(); // Recarregar
    } catch (err) {
      console.error("Erro ao votar:", err);
    }
  }

  const levelLabels = ["Wild", "Regional", "Surface", "Legacy"];
  const levelColors = ["level-0", "level-1", "level-2", "level-3"];

  if (loading) {
    return (
      <DefaultLayout>
        <Head><title>Carregando... · Iceberg</title></Head>
        <div className="py-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      </DefaultLayout>
    );
  }

  if (error || !post) {
    return (
      <DefaultLayout>
        <Head><title>Não encontrado · Iceberg</title></Head>
        <div className="py-12 text-center">
          <span className="text-4xl">🔍</span>
          <h1 className="text-xl font-bold mt-4">Post não encontrado</h1>
          <Link href="/" className="text-primary mt-4 inline-block">← Voltar ao início</Link>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <Head>
        <title>{post.title} · Iceberg</title>
      </Head>

      <article className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          {/* Votos */}
          <div className="flex flex-col items-center gap-1 text-secondary pt-1">
            <button 
              onClick={() => handleVote("up")}
              className="vote-btn hover:text-green-400 text-xl"
              disabled={!identity}
            >
              ▲
            </button>
            <span className={`font-bold ${(post.votes?.score ?? 0) > 0 ? "text-green-400" : (post.votes?.score ?? 0) < 0 ? "text-red-400" : ""}`}>
              {post.votes?.score ?? 0}
            </span>
            <button 
              onClick={() => handleVote("down")}
              className="vote-btn hover:text-red-400 text-xl"
              disabled={!identity}
            >
              ▼
            </button>
          </div>

          {/* Título e meta */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-secondary">
              <span className={`level-badge ${levelColors[post.level]}`}>
                Nível {post.level}: {levelLabels[post.level]}
              </span>
              <span>📍 {post.region.split("-").pop()?.replace(/_/g, " ")}</span>
              <span>·</span>
              <Link 
                href={`/perfil?pubkey=${post.author}`}
                className="hover:text-primary hover:underline"
              >
                @{post.author.slice(0, 8)}...
              </Link>
              <span>·</span>
              <span>{new Date(post.createdAt).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="bg-surface rounded-lg p-6 prose prose-invert max-w-none">
          <p className="whitespace-pre-wrap">{post.body}</p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-600 font-mono">
            CID: {post.cid}
          </div>
          <ReportButton targetCid={post.cid} targetType="post" />
        </div>

        {/* Comentários */}
        <CommentSection postCid={post.cid} />
      </article>
    </DefaultLayout>
  );
}
