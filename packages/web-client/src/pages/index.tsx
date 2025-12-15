import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";
import ContentList from "@/components/ContentList";
import { Post, api, useStore } from "@/lib/store";
import { CITIES, LEVELS } from "@/lib/config";

// Build regions from config
const REGIONS = [
  { value: "", label: "🌎 Todas" },
  ...CITIES.slice(0, 10).map(c => ({ value: c.code, label: c.state }))
];

// Level options with "all"
const LEVEL_OPTIONS = [
  { value: -1, label: "Todos" },
  ...LEVELS.map(l => ({ value: l.value, label: l.label }))
];

interface HomeProps {
  initialPosts: Post[];
}

export default function Home({ initialPosts }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts);
  const [region, setRegion] = useState("");
  const [level, setLevel] = useState(-1);
  const [trendingHashtags, setTrendingHashtags] = useState<{ tag: string; postCount: number }[]>([]);
  const { region: savedRegion, setRegion: setSavedRegion, identity } = useStore();

  useEffect(() => {
    if (savedRegion) {
      setRegion(savedRegion);
    }
    if (!initialPosts || (savedRegion && savedRegion !== "")) {
      loadPosts();
    }
    loadTrendingHashtags();
  }, []);

  useEffect(() => {
    loadPosts();
    if (region !== savedRegion) {
      setSavedRegion(region);
    }
  }, [region, level]);

  async function loadPosts() {
    setLoading(true);
    try {
      const options: any = {};
      if (region) options.region = region;
      if (level >= 0) options.level = level;
      
      const data = await api.getPosts(options);
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Erro ao carregar posts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTrendingHashtags() {
    try {
      const data = await api.getTrendingHashtags(5);
      setTrendingHashtags(data.hashtags || []);
    } catch (error) {
      console.error("Erro ao carregar hashtags:", error);
    }
  }

  return (
    <DefaultLayout>
      <Head>
        <title>Iceberg - Conhecimento da Humanidade, Sem Censura</title>
        <meta name="description" content="Plataforma descentralizada P2P para preservar e compartilhar o conhecimento da humanidade. Sem censura, sem intermediários." />
      </Head>

      {/* Hero Section - Only show when not logged in */}
      {!identity && (
        <div className="relative mb-8 p-6 bg-gradient-to-br from-primary/20 via-surface to-secondary/10 rounded-2xl border border-primary/30 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              🧊 Protocolo <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Iceberg</span>
            </h1>
            <p className="text-secondary max-w-xl mb-4">
              O conhecimento da humanidade, preservado para sempre. Descentralizado, imutável, sem censura.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link 
                href="/login"
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                🚀 Começar
              </Link>
              <Link 
                href="/sobre"
                className="px-5 py-2.5 bg-surface/50 backdrop-blur border border-gray-700 rounded-lg hover:border-primary/50 transition-colors"
              >
                Saiba mais
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions for logged users */}
      {identity && (
        <div className="mb-6 flex flex-wrap gap-3">
          <Link 
            href="/publicar"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            ✏️ Novo Ice
          </Link>
          <Link 
            href="/salvos"
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-gray-700 rounded-lg hover:border-primary/50 transition-colors"
          >
            🔖 Salvos
          </Link>
          <Link 
            href="/agendados"
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-gray-700 rounded-lg hover:border-primary/50 transition-colors"
          >
            📅 Agendados
          </Link>
        </div>
      )}

      {/* Trending Hashtags */}
      {trendingHashtags.length > 0 && (
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-sm text-secondary shrink-0">🔥 Trending:</span>
          {trendingHashtags.map(h => (
            <Link
              key={h.tag}
              href={`/hashtag/${h.tag}`}
              className="shrink-0 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full hover:bg-primary/20 transition-colors"
            >
              #{h.tag}
            </Link>
          ))}
        </div>
      )}

      {/* Navigation + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">📰 Feed</h2>
          <div className="hidden md:flex gap-2 text-sm">
            <Link href="/" className="text-primary font-medium">Relevantes</Link>
            <span className="text-gray-600">|</span>
            <Link href="/recentes" className="text-secondary hover:text-on-surface">Recentes</Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <Link
            href="/buscar"
            className="p-2 text-secondary hover:text-on-surface hover:bg-surface rounded-lg transition-colors"
            title="Buscar"
          >
            🔍
          </Link>

          {/* Region Filter */}
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-surface border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:border-primary focus:outline-none cursor-pointer"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {/* Level Filter */}
          <select
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value))}
            className="bg-surface border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:border-primary focus:outline-none cursor-pointer"
          >
            {LEVEL_OPTIONS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-secondary mt-4">Carregando ices...</p>
        </div>
      ) : (
        <ContentList 
          posts={posts} 
          emptyState={{
            title: "Nenhum conteúdo encontrado",
            description: region || level >= 0 
              ? "Tente remover os filtros ou selecionar outra região."
              : "Seja o primeiro a publicar ou verifique se o daemon está rodando."
          }}
        />
      )}

      {/* Stats Footer */}
      <div className="mt-8 pt-6 border-t border-gray-800 text-center text-sm text-secondary">
        <p>
          {posts.length} ices listados • Protocolo P2P descentralizado • 
          <Link href="/sobre" className="text-primary hover:underline ml-1">Saiba mais</Link>
        </p>
      </div>
    </DefaultLayout>
  );
}

// Tentar pré-carregar do daemon
export async function getServerSideProps() {
  try {
    const res = await fetch("http://localhost:8420/posts");
    const data = await res.json();
    return { props: { initialPosts: data.posts || [] } };
  } catch {
    // Daemon pode não estar rodando
    return { props: { initialPosts: [] } };
  }
}
