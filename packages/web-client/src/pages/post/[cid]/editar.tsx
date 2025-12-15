import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";
import { Post, api, useStore } from "@/lib/store";

const REGIONS = [
  { value: "BR-SP-SAO_PAULO", label: "São Paulo, SP" },
  { value: "BR-RJ-RIO_DE_JANEIRO", label: "Rio de Janeiro, RJ" },
  { value: "BR-MG-BELO_HORIZONTE", label: "Belo Horizonte, MG" },
  { value: "BR-RS-PORTO_ALEGRE", label: "Porto Alegre, RS" },
  { value: "BR-PR-CURITIBA", label: "Curitiba, PR" },
  { value: "BR-BA-SALVADOR", label: "Salvador, BA" },
  { value: "BR-DF-BRASILIA", label: "Brasília, DF" },
];

export default function EditarPostPage() {
  const router = useRouter();
  const { cid } = router.query;
  const { identity } = useStore();

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cid) loadPost();
  }, [cid]);

  async function loadPost() {
    try {
      const data = await api.getPost(cid as string);
      setPost(data);
      setTitle(data.title);
      setBody(data.body);
    } catch (err: any) {
      setError("Post não encontrado");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts/${cid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });

      const result = await res.json();

      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/post/${cid}`);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (!identity) {
    return (
      <DefaultLayout maxWidth="sm">
        <Head>
          <title>Editar Post · Iceberg</title>
        </Head>
        <div className="text-center py-12 bg-surface rounded-lg">
          <span className="text-4xl">🔐</span>
          <h1 className="text-xl font-bold mt-4">Login Necessário</h1>
          <a href="/login" className="px-6 py-2 bg-primary text-white rounded-lg inline-block mt-4">
            Entrar
          </a>
        </div>
      </DefaultLayout>
    );
  }

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

  if (!post || error) {
    return (
      <DefaultLayout>
        <Head><title>Erro · Iceberg</title></Head>
        <div className="py-12 text-center">
          <span className="text-4xl">❌</span>
          <h1 className="text-xl font-bold mt-4">{error || "Post não encontrado"}</h1>
          <Link href="/" className="text-primary mt-4 inline-block">← Voltar</Link>
        </div>
      </DefaultLayout>
    );
  }

  // Check ownership
  if (post.author !== identity.publicKey) {
    return (
      <DefaultLayout>
        <Head><title>Acesso Negado · Iceberg</title></Head>
        <div className="py-12 text-center">
          <span className="text-4xl">🚫</span>
          <h1 className="text-xl font-bold mt-4">Você não pode editar este post</h1>
          <p className="text-secondary mt-2">Apenas o autor pode editar.</p>
          <Link href={`/post/${cid}`} className="text-primary mt-4 inline-block">← Voltar ao post</Link>
        </div>
      </DefaultLayout>
    );
  }

  // Check level
  if (post.level >= 2) {
    return (
      <DefaultLayout>
        <Head><title>Edição Bloqueada · Iceberg</title></Head>
        <div className="py-12 text-center">
          <span className="text-4xl">🔒</span>
          <h1 className="text-xl font-bold mt-4">Este post não pode mais ser editado</h1>
          <p className="text-secondary mt-2">
            Posts de nível 2+ (Surface/Legacy) são permanentes e não podem ser alterados.
          </p>
          <Link href={`/post/${cid}`} className="text-primary mt-4 inline-block">← Voltar ao post</Link>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout maxWidth="md">
      <Head>
        <title>Editar: {post.title} · Iceberg</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">✏️ Editar post</h1>

      <form onSubmit={handleSave} className="bg-surface rounded-lg p-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm text-secondary mb-2">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-secondary mb-2">Conteúdo (Markdown)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={12}
            className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 focus:border-primary focus:outline-none resize-none font-mono text-sm"
          />
        </div>

        <div className="mb-6 p-3 bg-background rounded-lg text-sm text-secondary">
          <p>📍 Região: {REGIONS.find(r => r.value === post.region)?.label || post.region}</p>
          <p>📊 Nível: {post.level}</p>
          <p className="text-xs mt-1">A região e o nível não podem ser alterados.</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !title || !body}
            className="flex-1 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/80 disabled:opacity-50"
          >
            {saving ? "⏳ Salvando..." : "💾 Salvar alterações"}
          </button>
        </div>
      </form>
    </DefaultLayout>
  );
}
