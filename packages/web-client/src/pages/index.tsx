import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";
import ContentList from "@/components/ContentList";
import { Post, api, useStore } from "@/lib/store";

const REGIONS = [
  { value: "", label: "🌎 Todas" },
  { value: "BR-SP-SAO_PAULO", label: "SP" },
  { value: "BR-RJ-RIO_DE_JANEIRO", label: "RJ" },
  { value: "BR-MG-BELO_HORIZONTE", label: "MG" },
  { value: "BR-RS-PORTO_ALEGRE", label: "RS" },
  { value: "BR-PR-CURITIBA", label: "PR" },
  { value: "BR-BA-SALVADOR", label: "BA" },
  { value: "BR-DF-BRASILIA", label: "DF" },
];

const LEVELS = [
  { value: -1, label: "Todos" },
  { value: 0, label: "Wild" },
  { value: 1, label: "Regional" },
  { value: 2, label: "Surface" },
  { value: 3, label: "Legacy" },
];

interface HomeProps {
  initialPosts: Post[];
}

export default function Home({ initialPosts }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts);
  const [region, setRegion] = useState("");
  const [level, setLevel] = useState(-1);
  const { region: savedRegion, setRegion: setSavedRegion } = useStore();

  useEffect(() => {
    if (savedRegion) {
      setRegion(savedRegion);
    }
    if (!initialPosts || (savedRegion && savedRegion !== "")) {
      loadPosts();
    }
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

  return (
    <DefaultLayout>
      <Head>
        <title>Iceberg - Plataforma descentralizada de informação cidadã</title>
        <meta name="description" content="Plataforma descentralizada P2P para compartilhamento de informações verificadas pela comunidade." />
      </Head>

      {/* Navigation + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-primary font-semibold underline underline-offset-4">
            Relevantes
          </Link>
          <Link href="/recentes" className="text-secondary hover:text-on-surface">
            Recentes
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <Link
            href="/buscar"
            className="p-2 text-secondary hover:text-on-surface hover:bg-surface rounded-lg"
            title="Buscar"
          >
            🔍
          </Link>

          {/* Region Filter */}
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-surface border border-gray-700 rounded-lg px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {/* Level Filter */}
          <select
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value))}
            className="bg-surface border border-gray-700 rounded-lg px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-secondary mt-4">Carregando...</p>
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
