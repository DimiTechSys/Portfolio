import { InfiniteLoader } from '@/components/shared/infinite-loader'

type LoadMoreButtonProps = {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
}

// Conserve l'API historique (hasMore/loading/onLoadMore) mais délègue à
// <InfiniteLoader> : scroll infini (auto-load au scroll) + repli bouton.
// Un seul comportement de pagination dans toute l'app.
export function LoadMoreButton({ hasMore, loading, onLoadMore }: LoadMoreButtonProps) {
  return <InfiniteLoader hasNextPage={hasMore} isLoading={loading} onLoadMore={onLoadMore} />
}
