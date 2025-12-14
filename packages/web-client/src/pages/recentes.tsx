import Head from "next/head";
import DefaultLayout from "@/components/DefaultLayout";
import ContentList from "@/components/ContentList";
import { Post, api } from "@/lib/store";

interface RecentesProps {
  posts: Post[];
}

export default function Recentes({ posts }: RecentesProps) {
  return (
    <DefaultLayout>
      <Head>
        <title>Recentes · Iceberg</title>
      </Head>

      <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-4">
        <a href="/" className="text-secondary hover:text-on-surface">
          Relevantes
        </a>
        <a href="/recentes" className="text-primary font-semibold underline underline-offset-4">
          Recentes
        </a>
      </div>

      <ContentList 
        posts={posts} 
        emptyState={{
          title: "Nenhum conteúdo recente",
          description: "Seja o primeiro a publicar!"
        }}
      />
    </DefaultLayout>
  );
}

export async function getServerSideProps() {
  try {
    const res = await fetch("http://localhost:8420/posts?limit=50");
    const data = await res.json();
    return { props: { posts: data.posts || [] } };
  } catch {
    return { props: { posts: [] } };
  }
}
