import Link from "next/link";
import { Post } from "@/lib/store";

interface ContentListProps {
  posts: Post[];
  startNumber?: number;
  emptyState?: {
    title: string;
    description?: string;
  };
}

export default function ContentList({
  posts,
  startNumber = 1,
  emptyState,
}: ContentListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-surface rounded-lg">
        <p className="text-xl text-secondary">{emptyState?.title || "Nenhum item"}</p>
        {emptyState?.description && (
          <p className="text-sm text-gray-500 mt-2">{emptyState.description}</p>
        )}
      </div>
    );
  }

  return (
    <ol className="list-none p-0 m-0" start={startNumber}>
      {posts.map((post, index) => (
        <ContentItem key={post.cid} post={post} number={startNumber + index} />
      ))}
    </ol>
  );
}

function ContentItem({ post, number }: { post: Post; number: number }) {
  const levelLabels = ["Wild", "Regional", "Surface", "Legacy"];
  const levelColors = ["level-0", "level-1", "level-2", "level-3"];

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "agora";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 30) return `${days}d`;
    return new Date(timestamp).toLocaleDateString("pt-BR");
  };

  const score = post.votes?.score ?? 0;

  return (
    <li className="content-item animate-fade-in">
      {/* Número */}
      <span className="content-number">{number}.</span>

      {/* Conteúdo */}
      <div>
        {/* Título */}
        <div className="mb-1">
          <Link href={`/post/${post.cid}`} className="content-link text-base">
            {post.title}
          </Link>
        </div>

        {/* Meta */}
        <div className="content-meta">
          {/* Score - estilo TabCoin */}
          <span className={score > 0 ? "text-green-400" : score < 0 ? "text-red-400" : ""}>
            {score} {Math.abs(score) === 1 ? "ponto" : "pontos"}
          </span>
          
          <span>·</span>

          {/* Nível - badge colorido */}
          <span className={`level-badge ${levelColors[post.level]}`}>
            {levelLabels[post.level]}
          </span>

          <span>·</span>

          {/* Região - Link clicável para página da cidade */}
          <Link 
            href={`/cidade/${post.region}`}
            className="hover:text-primary hover:underline"
            title={`Ver posts de ${post.region.split("-").pop()?.replace(/_/g, " ")}`}
          >
            📍 {post.region.split("-").pop()?.replace(/_/g, " ")}
          </Link>

          <span>·</span>

          {/* Autor */}
          <Link 
            href={`/perfil?pubkey=${post.author}`}
            className="hover:text-primary hover:underline"
            title={post.author}
          >
            @{post.author.slice(0, 8)}...
          </Link>

          <span>·</span>

          {/* Tempo */}
          <time dateTime={new Date(post.createdAt).toISOString()}>
            {formatTime(post.createdAt)}
          </time>

          {/* Comentários */}
          {/* <span>·</span>
          <span>0 comentários</span> */}
        </div>
      </div>
    </li>
  );
}
