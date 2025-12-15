import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, useStore, Post } from '@/lib/store';

interface Comment {
  cid: string;
  postCid: string;
  parentCid: string | null;
  body: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  replies?: Comment[];
}

interface CommentSectionProps {
  postCid: string;
  postHashtags?: string[];
  initialComments?: Comment[];
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d atrás`;
  if (hours > 0) return `${hours}h atrás`;
  if (minutes > 0) return `${minutes}m atrás`;
  return 'agora';
}

function shortenPubKey(pubKey: string): string {
  if (pubKey.length <= 16) return pubKey;
  return pubKey.slice(0, 8) + '...' + pubKey.slice(-6);
}

function CommentItem({ comment, postCid, onReply, depth = 0 }: { 
  comment: Comment; 
  postCid: string;
  onReply: (parentCid: string) => void;
  depth?: number 
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { identity } = useStore();
  const isAuthor = identity?.publicKey === comment.author;
  
  return (
    <div 
      className={`border-l-2 border-gray-700 pl-4 py-2 ${depth > 0 ? 'ml-4' : ''}`}
      style={{ marginLeft: depth * 16 }}
    >
      <div className="flex items-center gap-2 text-sm text-secondary mb-1">
        <Link 
          href={`/perfil?pubkey=${comment.author}`}
          className="text-primary hover:underline font-medium"
        >
          {shortenPubKey(comment.author)}
        </Link>
        <span>•</span>
        <span>{formatTimeAgo(comment.createdAt)}</span>
        {isAuthor && (
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">você</span>
        )}
      </div>
      
      <div className="text-on-surface text-sm whitespace-pre-wrap mb-2">
        {comment.body}
      </div>
      
      <div className="flex gap-4 text-xs text-secondary">
        <button 
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="hover:text-primary"
        >
          💬 Responder
        </button>
      </div>
      
      {showReplyForm && (
        <ReplyForm 
          postCid={postCid}
          parentCid={comment.cid} 
          onSubmit={() => setShowReplyForm(false)} 
        />
      )}
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map(reply => (
            <CommentItem 
              key={reply.cid} 
              comment={reply} 
              postCid={postCid}
              onReply={onReply}
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReplyForm({ postCid, parentCid, onSubmit }: { 
  postCid: string; 
  parentCid?: string;
  onSubmit: () => void;
}) {
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await api.createComment(postCid, body, parentCid);
      setBody('');
      onSubmit();
      // Trigger reload
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar comentário');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="mt-3 mb-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Escreva seu comentário..."
        rows={3}
        className="w-full bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="px-4 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/80 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Comentar'}
        </button>
      </div>
    </form>
  );
}

// Related posts item component
function RelatedPostItem({ post }: { post: Post }) {
  const score = post.votes?.score ?? 0;
  
  return (
    <div className="border-l-2 border-primary/30 pl-4 py-3 hover:bg-surface/50 transition-colors">
      <Link href={`/post/${post.cid}`} className="block">
        <h4 className="text-on-surface font-medium hover:text-primary transition-colors">
          {post.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-secondary mt-1">
          <span className={score > 0 ? "text-green-400" : score < 0 ? "text-red-400" : ""}>
            {score} pontos
          </span>
          <span>•</span>
          <span>📍 {post.region.split("-").pop()?.replace(/_/g, " ")}</span>
          <span>•</span>
          <Link 
            href={`/perfil?pubkey=${post.author}`}
            className="hover:text-primary"
          >
            @{post.author.slice(0, 8)}...
          </Link>
        </div>
      </Link>
    </div>
  );
}

export default function CommentSection({ postCid, postHashtags = [], initialComments = [] }: CommentSectionProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'related'>('comments');
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loadingComments, setLoadingComments] = useState(!initialComments.length);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const { identity } = useStore();
  
  // Load comments on mount if not provided
  useEffect(() => {
    if (!initialComments.length) {
      loadComments();
    }
  }, [postCid]);
  
  // Load related posts when tab is switched
  useEffect(() => {
    if (activeTab === 'related' && relatedPosts.length === 0 && postHashtags.length > 0) {
      loadRelatedPosts();
    }
  }, [activeTab, postHashtags]);
  
  async function loadComments() {
    try {
      const data = await api.getComments(postCid);
      setComments(data.comments || []);
    } catch (err) {
      console.error('Erro ao carregar comentários:', err);
    } finally {
      setLoadingComments(false);
    }
  }
  
  async function loadRelatedPosts() {
    if (postHashtags.length === 0) return;
    
    setLoadingRelated(true);
    try {
      // Call API to get posts with similar hashtags
      const data = await api.getRelatedPosts(postCid, postHashtags);
      setRelatedPosts(data.posts || []);
    } catch (err) {
      console.error('Erro ao carregar posts relacionados:', err);
    } finally {
      setLoadingRelated(false);
    }
  }
  
  function handleReply(parentCid: string) {
    // Could scroll to reply form, etc.
  }
  
  return (
    <div className="mt-8">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'comments'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-on-surface'
          }`}
        >
          💬 Comentários
          {comments.length > 0 && (
            <span className="ml-1.5 text-xs bg-gray-700 px-1.5 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('related')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'related'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-on-surface'
          }`}
        >
          🔗 Relacionados
          {postHashtags.length > 0 && (
            <span className="ml-1.5 text-xs bg-gray-700 px-1.5 py-0.5 rounded-full">
              #{postHashtags[0]}{postHashtags.length > 1 ? ` +${postHashtags.length - 1}` : ''}
            </span>
          )}
        </button>
      </div>
      
      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <>
          {identity ? (
            <ReplyForm postCid={postCid} onSubmit={loadComments} />
          ) : (
            <div className="bg-surface rounded-lg p-4 mb-4 text-center">
              <p className="text-secondary text-sm">
                <a href="/login" className="text-primary underline">Entre</a> para comentar
              </p>
            </div>
          )}
          
          {loadingComments ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-secondary text-center py-4">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          ) : (
            <div className="space-y-2">
              {comments.map(comment => (
                <CommentItem 
                  key={comment.cid} 
                  comment={comment} 
                  postCid={postCid}
                  onReply={handleReply}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Related Posts Tab */}
      {activeTab === 'related' && (
        <>
          {postHashtags.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary">
                Este post não possui hashtags para buscar relacionados.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Use #hashtags no conteúdo para encontrar posts similares.
              </p>
            </div>
          ) : loadingRelated ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-secondary text-sm mt-2">Buscando posts com #{postHashtags[0]}...</p>
            </div>
          ) : relatedPosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary">
                Nenhum post relacionado encontrado.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {postHashtags.map(tag => (
                  <Link 
                    key={tag}
                    href={`/hashtag/${tag}`}
                    className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full hover:bg-primary/30"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-secondary mb-3">
                {relatedPosts.length} {relatedPosts.length === 1 ? 'post' : 'posts'} com hashtags similares
              </p>
              {relatedPosts.map(post => (
                <RelatedPostItem key={post.cid} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
