/**
 * Analytics Page - Anonymous Content Analytics
 */

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";
import { api } from "@/lib/store";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalIces: 0,
    totalVotes: 0,
    totalUsers: 0,
    categories: [] as { name: string; count: number; percent: number }[],
    regions: [] as { name: string; count: number }[],
    levels: [0, 0, 0, 0],
    trending: [] as { tag: string; count: number }[],
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const [posts, hashtags] = await Promise.all([
        api.getPosts({ limit: 1000 }),
        api.getTrendingHashtags(10),
      ]);

      const allPosts = posts.posts || [];
      
      // Calculate category distribution
      const catMap: Record<string, number> = {};
      const regionMap: Record<string, number> = {};
      const levels = [0, 0, 0, 0];
      
      allPosts.forEach((p: any) => {
        catMap[p.category || "other"] = (catMap[p.category || "other"] || 0) + 1;
        regionMap[p.region?.split("-").pop() || "Brasil"] = (regionMap[p.region?.split("-").pop() || "Brasil"] || 0) + 1;
        if (p.level >= 0 && p.level <= 3) levels[p.level]++;
      });

      const total = allPosts.length || 1;
      const categories = Object.entries(catMap)
        .map(([name, count]) => ({ name, count, percent: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const regions = Object.entries(regionMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setData({
        totalIces: allPosts.length,
        totalVotes: allPosts.reduce((sum: number, p: any) => sum + (p.votes?.up || 0) + (p.votes?.down || 0), 0),
        totalUsers: new Set(allPosts.map((p: any) => p.author)).size,
        categories,
        regions,
        levels,
        trending: (hashtags.hashtags || []).map((h: any) => ({ tag: h.tag, count: h.postCount })),
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DefaultLayout>
      <Head>
        <title>Analytics - Iceberg</title>
        <meta name="description" content="Análise anônima de conteúdo do Iceberg" />
      </Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📈 Analytics</h1>
        <p className="text-secondary">
          Análise anônima de tendências • Nenhum dado pessoal coletado
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <>
          {/* Overview */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-surface rounded-xl p-5 border border-gray-800 text-center">
              <div className="text-3xl font-bold text-primary">{data.totalIces.toLocaleString()}</div>
              <div className="text-sm text-secondary">Ices</div>
            </div>
            <div className="bg-surface rounded-xl p-5 border border-gray-800 text-center">
              <div className="text-3xl font-bold text-green-400">{data.totalVotes.toLocaleString()}</div>
              <div className="text-sm text-secondary">Votos</div>
            </div>
            <div className="bg-surface rounded-xl p-5 border border-gray-800 text-center">
              <div className="text-3xl font-bold text-blue-400">{data.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-secondary">Autores</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Categories */}
            <div className="bg-surface rounded-xl p-5 border border-gray-800">
              <h2 className="font-semibold mb-4">📊 Categorias</h2>
              <div className="space-y-2">
                {data.categories.map(cat => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{cat.name}</span>
                        <span className="text-secondary">{cat.count}</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${cat.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regions */}
            <div className="bg-surface rounded-xl p-5 border border-gray-800">
              <h2 className="font-semibold mb-4">📍 Regiões</h2>
              <div className="space-y-2">
                {data.regions.map((reg, i) => (
                  <div key={reg.name} className="flex items-center justify-between p-2 rounded bg-background/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-secondary w-4">{i + 1}</span>
                      <span>{reg.name}</span>
                    </div>
                    <span className="text-primary font-medium">{reg.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Levels Distribution */}
          <div className="bg-surface rounded-xl p-5 border border-gray-800 mb-8">
            <h2 className="font-semibold mb-4">🎚️ Distribuição por Nível</h2>
            <div className="grid grid-cols-4 gap-4">
              {["Wild", "Regional", "Surface", "Legacy"].map((name, i) => (
                <div key={name} className="text-center">
                  <div className="text-2xl font-bold">{data.levels[i]}</div>
                  <div className="text-xs text-secondary">Nível {i}</div>
                  <div className="text-xs text-gray-500">{name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div className="bg-surface rounded-xl p-5 border border-gray-800">
            <h2 className="font-semibold mb-4">🔥 Hashtags em Alta</h2>
            <div className="flex flex-wrap gap-2">
              {data.trending.map(t => (
                <Link
                  key={t.tag}
                  href={`/hashtag/${t.tag}`}
                  className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20"
                >
                  #{t.tag} <span className="text-xs text-secondary">({t.count})</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mt-8 text-center text-sm text-secondary">
            <p>🔒 Todos os dados são agregados e anônimos. Nenhum dado pessoal é coletado.</p>
          </div>
        </>
      )}
    </DefaultLayout>
  );
}
