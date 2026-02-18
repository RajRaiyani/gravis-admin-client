import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetProductsInfinite,
  useDeleteProduct,
} from "@/hooks/useProducts";
import type { Product } from "@/types/product.type";
import { useState, useRef, useCallback, useEffect } from "react";

export default function Products() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetProductsInfinite();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setDeletingId(id);
      deleteProduct(id, {
        onSettled: () => setDeletingId(null),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load products</p>
      </div>
    );
  }

  const products = (data?.pages ?? []).flatMap((page) =>
    Array.isArray(page?.data) ? page.data : Array.isArray(page) ? page : []
  );

  const formatPrice = (priceInRupees: number) => {
    return `₹${Number(priceInRupees).toFixed(2)}`;
  };

  const getPrimaryImage = (product: Product) => {
    if (!product.images || product.images.length === 0) return null;
    const primaryImage = product.images.find((img) => img.is_primary);
    return primaryImage?.image?.url || product.images[0]?.image?.url || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link to="/products/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No products found</p>
            <Link to="/products/create">
              <Button variant="outline" className="mt-4">
                Create your first product
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product: Product) => {
            const primaryImageUrl = getPrimaryImage(product);
            return (
              <Link to={`/products/${product.id}`}>
                <Card
                  key={product.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    {primaryImageUrl && (
                      <div className="mb-4">
                        <img
                          src={primaryImageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    )}
                    <CardTitle className="flex items-center justify-between">
                      <span className="line-clamp-2">{product.name}</span>
                      <div className="flex gap-2 ml-2">
                        <Link to={`/products/${product.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                          disabled={isDeleting && deletingId === product.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {product.category && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Category: {product.category.name}
                      </p>
                    )}
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-lg font-semibold">
                        {formatPrice(
                          product.sale_price_in_rupee ?? product.sale_price
                        )}
                      </span>
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {product.tags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-muted px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {product.tags.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{product.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <div ref={loadMoreRef} className="flex justify-center py-8">
        {isFetchingNextPage && (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
