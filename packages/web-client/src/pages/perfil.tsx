import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";
import ContentList from "@/components/ContentList";
import { useStore, api, Post } from "@/lib/store";

interface Comment {
  cid: string;
  postCid: string;
  body: string;
  author: string;
  createdAt: number;
}

type ProfileTab = "posts" | "comments" | "voting" | "saved";

export default function Perfil() {
  const router = useRouter();
  const { pubkey } = router.query;
  const { identity, setIdentity } = useStore();
  
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ posts: 0, comments: 0, saved: 0 });
  
  // Determine which profile to show
  const viewingPubkey = (pubkey as string) || identity?.publicKey;
  const isOwnProfile = !pubkey || pubkey === identity?.publicKey;
  
  useEffect(() => {
    if (viewingPubkey) {
      loadUserData(activeTab);
    }
  }, [viewingPubkey, activeTab]);
  
  async function loadUserData(tab: ProfileTab) {
    setLoading(true);
    try {
      switch (tab) {
        case "posts":
          const postsData = await api.getPosts({ author: viewingPubkey });
          setUserPosts(postsData.posts || []);
          setStats(s => ({ ...s, posts: postsData.posts?.length || 0 }));
          break;
        case "comments":
          const commentsData = await api.getUserComments(viewingPubkey!);
          setUserComments(commentsData.comments || []);
          break;
        case "voting":
          // Votes require being the owner for privacy
          if (isOwnProfile) {
            const votesData = await api.getUserVotes(viewingPubkey!);
            // Store votes in a new state if needed
          }
          break;
        case "saved":
          if (isOwnProfile) {
            const savedData = await api.getSavedPosts();
            setSavedPosts(savedData.posts || []);
            setStats(s => ({ ...s, saved: savedData.total || 0 }));
          }
          break;
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }

  // Not logged in and no pubkey provided
  if (!identity && !pubkey) {
    return (
      <DefaultLayout maxWidth="sm">
        <Head>
          <title>Perfil · Iceberg</title>
        </Head>
        <div className="text-center py-12 bg-surface rounded-lg">
          <span className="text-4xl">🔐</span>
          <h1 className="text-xl font-bold mt-4">Sem identidade</h1>
          <p className="text-secondary mt-2 mb-4">
            Faça login para ver seu perfil.
          </p>
          <a href="/login" className="px-6 py-2 bg-primary text-white rounded-lg inline-block">
            Entrar
          </a>
        </div>
      </DefaultLayout>
    );
  }

  function handleLogout() {
    setIdentity(null);
    router.push("/");
  }
  
  function handleStartChat() {
    alert(`Para iniciar conversa, clique no ícone de chat e cole a chave: ${viewingPubkey}`);
  }

  const tabs: { id: ProfileTab; label: string; icon: string; ownerOnly?: boolean }[] = [
    { id: "posts", label: "Ices", icon: "📝" },
    { id: "comments", label: "Comentários", icon: "💬" },
    { id: "voting", label: "Votos", icon: "👍" },
    { id: "saved", label: "Salvos", icon: "🔖", ownerOnly: true },
  ];

  return (
    <DefaultLayout maxWidth="md">
      <Head>
        <title>{isOwnProfile ? "Meu Perfil" : "Perfil"} · Iceberg</title>
      </Head>

      {/* Profile Header */}
      <div className="bg-surface rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl text-white font-bold">
            {viewingPubkey?.slice(0, 2).toUpperCase()}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">
              {isOwnProfile ? "Meu Perfil" : "Perfil do Usuário"}
            </h1>
            <p className="font-mono text-sm text-secondary truncate mt-1" title={viewingPubkey}>
              @{viewingPubkey?.slice(0, 12)}...
            </p>
            
            {isOwnProfile && identity && (
              <p className="text-xs text-gray-500 mt-2">
                Desde {new Date(identity.createdAt).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex flex-col gap-2">
            {isOwnProfile ? (
              <>
                <Link 
                  href="/publicar"
                  className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/80 text-center"
                >
                  ✏️ Publicar
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 text-center"
                >
                  🚪 Sair
                </button>
              </>
            ) : (
              <button
                onClick={handleStartChat}
                className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/80"
              >
                💬 Chat
              </button>
            )}
          </div>
        </div>
        
        {/* Warning for own profile */}
        {isOwnProfile && (
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-300">
            ⚠️ Guarde seu mnemônico em local seguro - é a única forma de recuperar sua identidade.
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-700 mb-6 overflow-x-auto">
        {tabs.filter(t => !t.ownerOnly || isOwnProfile).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-secondary hover:text-on-surface"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-secondary mt-4">Carregando...</p>
        </div>
      ) : (
        <>
          {/* Posts Tab */}
          {activeTab === "posts" && (
            <ContentList 
              posts={userPosts}
              emptyState={{
                title: "Nenhum post encontrado",
                description: isOwnProfile 
                  ? "Você ainda não publicou nenhum conteúdo."
                  : "Este usuário ainda não publicou nenhum conteúdo."
              }}
            />
          )}

          {/* Comments Tab */}
          {activeTab === "comments" && (
            userComments.length > 0 ? (
              <div className="space-y-3">
                {userComments.map((comment: any) => (
                  <div key={comment.cid} className="bg-surface rounded-lg p-4">
                    <Link 
                      href={`/post/${comment.postCid}`}
                      className="text-sm text-primary hover:underline mb-2 block"
                    >
                      📝 {comment.postTitle || "Post"}
                    </Link>
                    <p className="text-on-surface text-sm">{comment.body}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(comment.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-surface rounded-lg">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-secondary">
                  {isOwnProfile ? "Você ainda não comentou em nenhum post." : "Nenhum comentário encontrado."}
                </p>
              </div>
            )
          )}

          {/* Voting Tab */}
          {activeTab === "voting" && (
            <div className="text-center py-8 bg-surface rounded-lg">
              <div className="text-4xl mb-4">👍</div>
              <p className="text-secondary">Seu histórico de votos aparecerá aqui.</p>
              <p className="text-xs text-gray-500 mt-2">Em desenvolvimento</p>
            </div>
          )}

          {/* Saved Tab */}
          {activeTab === "saved" && isOwnProfile && (
            savedPosts.length > 0 ? (
              <ContentList posts={savedPosts} />
            ) : (
              <div className="text-center py-8 bg-surface rounded-lg">
                <div className="text-4xl mb-4">🔖</div>
                <p className="text-secondary">Você não salvou nenhum post ainda.</p>
                <Link href="/" className="text-primary text-sm hover:underline mt-2 inline-block">
                  Explorar posts
                </Link>
              </div>
            )
          )}
        </>
      )}
    </DefaultLayout>
  );
}
