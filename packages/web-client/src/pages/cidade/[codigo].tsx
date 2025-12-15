/**
 * Página de Posts por Cidade
 * 
 * Exibe todos os posts de uma região/cidade específica
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";
import ContentList from "@/components/ContentList";
import { Post, api } from "@/lib/store";
import { CITIES, LEVELS, getCityByCode } from "@/lib/config";

export default function CidadePage() {
  const router = useRouter();
  const { codigo } = router.query;
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [level, setLevel] = useState(-1);

  const cityCode = codigo as string;
  const cityData = getCityByCode(cityCode);
  const cityInfo = cityData ? {
    name: cityData.name,
    state: cityData.state,
    fullName: `${cityData.name}, ${cityData.state}`
  } : {
    name: cityCode?.split("-").pop()?.replace(/_/g, " ") || "Cidade",
    state: cityCode?.split("-")[1] || "",
    fullName: cityCode?.split("-").pop()?.replace(/_/g, " ") || "Cidade"
  };

  // Levels with "all" option for filter
  const levelOptions = [{ value: -1, label: "Todos" }, ...LEVELS];

  useEffect(() => {
    if (cityCode) {
      loadPosts();
    }
  }, [cityCode, level]);

  async function loadPosts() {
    setLoading(true);
    try {
      const options: any = { region: cityCode };
      if (level >= 0) options.level = level;
      
      const data = await api.getPosts(options);
      setPosts(data.posts || []);
      setTotal(data.total || data.posts?.length || 0);
    } catch (error) {
      console.error("Erro ao carregar posts:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DefaultLayout>
      <Head>
        <title>{cityInfo.fullName} - Iceberg</title>
        <meta name="description" content={`Posts e denúncias de ${cityInfo.fullName}`} />
      </Head>

      {/* Header da Cidade */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-secondary mb-2">
          <Link href="/" className="hover:text-primary">Início</Link>
          <span>›</span>
          <span>Cidades</span>
          <span>›</span>
          <span className="text-on-surface">{cityInfo.state}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl">
            📍
          </div>
          <div>
            <h1 className="text-3xl font-bold">{cityInfo.name}</h1>
            <p className="text-secondary">
              {total} {total === 1 ? "ice" : "ices"} nesta região
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center justify-between gap-4 mb-6 border-b border-gray-800 pb-4">
        <h2 className="text-xl font-semibold">Denúncias</h2>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-secondary">Nível:</label>
          <select
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value))}
            className="bg-surface border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
          >
            {levelOptions.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Posts */}
      {loading ? (
        <div className="py-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-secondary mt-4">Carregando...</p>
        </div>
      ) : (
        <ContentList 
          posts={posts}
          emptyState={{
            title: "Nenhum post encontrado",
            description: `Ainda não há denúncias registradas para ${cityInfo.fullName}. Seja o primeiro a publicar!`
          }}
        />
      )}

      {/* Voltar */}
      <div className="mt-8 pt-4 border-t border-gray-800">
        <Link 
          href="/"
          className="text-primary hover:underline"
        >
          ← Voltar ao início
        </Link>
      </div>
    </DefaultLayout>
  );
}
