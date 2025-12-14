import { useEffect, useState } from "react";
import Head from "next/head";
import DefaultLayout from "@/components/DefaultLayout";
import ContentList from "@/components/ContentList";
import { Post, api } from "@/lib/store";

interface HomeProps {
  initialPosts: Post[];
}

export default function Home({ initialPosts }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts);

  useEffect(() => {
    if (!initialPosts) {
      loadPosts();
    }
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const data = await api.getPosts();
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
      </Head>

      <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-4">
        <a href="/" className="text-primary font-semibold underline underline-offset-4">
          Relevantes
        </a>
        <a href="/recentes" className="text-secondary hover:text-on-surface">
          Recentes
        </a>
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
            description: "Verifique se o daemon está rodando em localhost:8420"
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
