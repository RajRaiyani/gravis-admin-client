import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  /**
   * Function to call when more data should be loaded
   */
  onLoadMore: () => void;

  /**
   * Whether there are more items to load
   */
  hasMore: boolean;

  /**
   * Whether currently loading data
   */
  isLoading: boolean;

  /**
   * Intersection observer threshold (0-1)
   * @default 0.1
   */
  threshold?: number;

  /**
   * Root margin for intersection observer
   * @default "100px"
   */
  rootMargin?: string;

  /**
   * Whether infinite scroll is enabled
   * @default true
   */
  enabled?: boolean;
}

interface UseInfiniteScrollReturn {
  /**
   * Ref to attach to the element that triggers loading when visible
   */
  triggerRef: React.RefObject<HTMLDivElement>;

  /**
   * Whether currently loading more items
   */
  isLoadingMore: boolean;

  /**
   * Whether there are more items to load
   */
  hasMoreItems: boolean;
}

/**
 * Custom hook for implementing infinite scroll functionality
 * 
 * @example
 * ```tsx
 * const { triggerRef, isLoadingMore, hasMoreItems } = useInfiniteScroll({
 *   onLoadMore: fetchNextPage,
 *   hasMore: hasNextPage,
 *   isLoading: isFetchingNextPage,
 * });
 * 
 * return (
 *   <div>
 *     {items.map(item => <ItemComponent key={item.id} item={item} />)}
 *     {hasMoreItems && (
 *       <div className="loading-indicator">
 *         {isLoadingMore ? 'Loading...' : 'Load more'}
 *       </div>
 *     )}
 *     <div ref={triggerRef} />
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 0.1,
  rootMargin = "100px",
  enabled = true,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading && enabled) {
      onLoadMore();
    }
  }, [hasMore, isLoading, enabled, onLoadMore]);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const currentTrigger = triggerRef.current;
    if (currentTrigger) {
      observer.observe(currentTrigger);
    }

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
      observer.disconnect();
    };
  }, [handleLoadMore, threshold, rootMargin, enabled]);

  return {
    triggerRef: triggerRef as React.RefObject<HTMLDivElement>,
    isLoadingMore: isLoading,
    hasMoreItems: hasMore,
  };
}
