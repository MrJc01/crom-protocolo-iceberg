/**
 * Skeleton Loader Component
 * 
 * Shows loading placeholders while content is being fetched
 */

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = "", width = "100%", height = "1rem" }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function PostSkeleton() {
  return (
    <article className="content-item animate-pulse">
      <div className="flex gap-3">
        {/* Vote area skeleton */}
        <div className="flex flex-col items-center gap-1 w-8">
          <Skeleton width="24px" height="24px" />
          <Skeleton width="20px" height="16px" />
          <Skeleton width="24px" height="24px" />
        </div>

        {/* Content area skeleton */}
        <div className="flex-1 space-y-2">
          <Skeleton height="1.25rem" width="80%" />
          <Skeleton height="0.875rem" width="60%" />
          <div className="flex gap-2 mt-2">
            <Skeleton height="0.75rem" width="80px" />
            <Skeleton height="0.75rem" width="60px" />
            <Skeleton height="0.75rem" width="100px" />
          </div>
        </div>
      </div>
    </article>
  );
}

export function PostListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Carregando...">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="border-l-2 border-surface pl-4 py-2 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton width="24px" height="24px" className="rounded-full" />
        <Skeleton width="100px" height="0.875rem" />
      </div>
      <Skeleton height="1rem" width="90%" />
      <Skeleton height="1rem" width="70%" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Carregando perfil...">
      <div className="flex items-center gap-4">
        <Skeleton width="64px" height="64px" className="rounded-full" />
        <div className="space-y-2">
          <Skeleton width="150px" height="1.5rem" />
          <Skeleton width="200px" height="1rem" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton height="60px" />
        <Skeleton height="60px" />
        <Skeleton height="60px" />
      </div>
    </div>
  );
}

export default Skeleton;
