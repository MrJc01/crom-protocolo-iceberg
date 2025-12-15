import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import DefaultLayout from "@/components/DefaultLayout";
import ContentList from "@/components/ContentList";
import { Post, api } from "@/lib/store";

const REGIONS = [
  { value: "", label: "🌎 Todas as regiões" },
  { value: "BR-SP-SAO_PAULO", label: "São Paulo, SP" },
  { value: "BR-RJ-RIO_DE_JANEIRO", label: "Rio de Janeiro, RJ" },
  { value: "BR-MG-BELO_HORIZONTE", label: "Belo Horizonte, MG" },
  { value: "BR-RS-PORTO_ALEGRE", label: "Porto Alegre, RS" },
  { value: "BR-PR-CURITIBA", label: "Curitiba, PR" },
  { value: "BR-BA-SALVADOR", label: "Salvador, BA" },
  { value: "BR-DF-BRASILIA", label: "Brasília, DF" },
];

export default function BuscarPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Load from URL params on mount
    const { q, r } = router.query;
    if (q) setQuery(q as string);
    if (r) setRegion(r as string);
    
    if (q || r) {
      performSearch(q as string, r as string);
    }
  }, [router.query]);

  async function performSearch(searchQuery?: string, searchRegion?: string) {
    setLoading(true);
    setHasSearched(true);

    try {
      // Get posts and filter by query on client side for now
      // TODO: Add server-side search endpoint
      const data = await api.getPosts({ 
        region: searchRegion || region || undefined,
        limit: 100 
      });

      let filtered = data.posts || [];

      // Filter by search query
      const q = (searchQuery || query).toLowerCase().trim();
      if (q) {
        filtered = filtered.filter((post: Post) =>
          post.title.toLowerCase().includes(q) ||
          post.body.toLowerCase().includes(q)
        );
      }

      setPosts(filtered);
    } catch (err) {
      console.error("Erro na busca:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Update URL with search params
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (region) params.set("r", region);
    
    router.push(`/buscar?${params}`, undefined, { shallow: true });
    performSearch();
  }

  return (
    <DefaultLayout>
      <Head>
        <title>Buscar · Iceberg</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">🔍 Buscar Conteúdo</h1>

      <form onSubmit={handleSubmit} className="bg-surface rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por palavras-chave..."
            className="flex-1 bg-background border border-gray-700 rounded-lg px-4 py-3 focus:border-primary focus:outline-none"
          />
          
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-background border border-gray-700 rounded-lg px-4 py-3 focus:border-primary focus:outline-none md:w-48"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50"
          >
            {loading ? "⏳" : "🔍"} Buscar
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-secondary mt-4">Buscando...</p>
        </div>
      ) : hasSearched ? (
        <>
          <p className="text-secondary mb-4">
            {posts.length} {posts.length === 1 ? "resultado" : "resultados"} encontrado{posts.length === 1 ? "" : "s"}
            {query && ` para "${query}"`}
            {region && ` em ${REGIONS.find(r => r.value === region)?.label}`}
          </p>
          
          <ContentList
            posts={posts}
            emptyState={{
              title: "Nenhum resultado",
              description: "Tente termos diferentes ou remova os filtros."
            }}
          />
        </>
      ) : (
        <div className="text-center py-12 bg-surface rounded-lg">
          <span className="text-4xl">🔍</span>
          <h2 className="text-lg font-semibold mt-4">Digite algo para buscar</h2>
          <p className="text-secondary mt-2">
            Pesquise por palavras-chave ou filtre por região.
          </p>
        </div>
      )}
    </DefaultLayout>
  );
}
