/**
 * Página de Hashtag - Lista posts com uma tag específica
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";
import ContentList from "@/components/ContentList";
import { Post, api } from "@/lib/store";

export default function HashtagPage() {
  const router = useRouter();
  const { tag } = router.query;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [trendingTags, setTrendingTags] = useState<{ tag: string; postCount: number }[]>([]);

  useEffect(() => {
    if (!tag) return;
    
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const result = await api.getPostsByHashtag(tag as string);
        setPosts(result.posts || []);
        setTotal(result.total || 0);
      } catch (error) {
        console.error("Erro ao buscar posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
    loadTrending();
  }, [tag]);

  async function loadTrending() {
    try {
      const data = await api.getTrendingHashtags(10);
      setTrendingTags(data.hashtags || []);
    } catch (error) {
      console.error("Erro ao carregar trending:", error);
    }
  }

  if (!tag) {
    return null;
  }

  return (
    <DefaultLayout>
      <Head>
        <title>#{tag} - Iceberg</title>
        <meta name="description" content={`Posts com a hashtag #${tag}`} />
      </Head>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Header da Hashtag */}
          <div className="mb-6 p-6 bg-gradient-to-br from-primary/20 via-surface to-secondary/10 rounded-2xl border border-primary/30">
            <div className="flex items-center gap-2 text-sm text-secondary mb-2">
              <Link href="/" className="hover:text-primary">Início</Link>
              <span>›</span>
              <span>Hashtags</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl text-white">
                #
              </div>
              <div>
                <h1 className="text-3xl font-bold">{tag}</h1>
                <p className="text-secondary">
                  {total} {total === 1 ? "ice" : "ices"} com esta tag
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Posts */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <ContentList 
              posts={posts}
              emptyState={{
                title: "Nenhum post encontrado",
                description: `Não há posts com a hashtag #${tag} ainda.`
              }}
            />
          )}
        </div>

        {/* Sidebar - Trending */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-surface/50 backdrop-blur-sm rounded-xl border border-gray-800 p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🔥 Trending
            </h3>
            
            {trendingTags.length > 0 ? (
              <div className="space-y-1">
                {trendingTags.map((t, index) => (
                  <Link
                    key={t.tag}
                    href={`/hashtag/${t.tag}`}
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                      t.tag === tag
                        ? "bg-primary/20 text-primary font-medium"
                        : "hover:bg-background"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-4">{index + 1}</span>
                      <span>#</span>
                      <span className="truncate">{t.tag}</span>
                    </div>
                    <span className="text-xs text-secondary">{t.postCount}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-secondary text-sm">Nenhuma hashtag trending ainda.</p>
            )}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
