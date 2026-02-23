import { Link, useSearchParams } from "react-router-dom";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetProductsInfinite, useDeleteProduct } from "@/hooks/useProducts";
import { useGetProductCategories } from "@/hooks/useProductCategories";
import { useGetFilters } from "@/hooks/useFilters";
import { getQueryFromSearchParams } from "@/schema/product-query";
import { ProductsFilters } from "@/components/admin/products/ProductsFilters";
import { CategoryFiltersSidebar } from "@/components/admin/products/CategoryFiltersSidebar";
import type {
  ProductCategory,
  CategoryFilterWithOptions,
} from "@/types/product-category.type";
import type { Filter } from "@/types/filter.type";

// ---------------------------------------------------------------------------
// Types & helpers (used only on this page)
// ---------------------------------------------------------------------------

interface ProductCard {
  id: string;
  name: string;
  description?: string;
  sale_price_in_rupee: number;
  sale_price: number;
  tags: string[];
  category: { id: string; name: string };
  product_label?: string | null;
  warranty_label?: string | null;
  is_featured: boolean;
  primary_image?: { url: string };
  filter_options?: { filter_option_id: string }[];
}

const PRODUCT_LABEL_COLORS: Record<string, string> = {
  New: "bg-blue-500",
  "Best Seller": "bg-green-500",
  "Hot Deal": "bg-red-500",
  "Limited Edition": "bg-purple-500",
  "Top Rated": "bg-yellow-500",
  Sale: "bg-orange-500",
  Exclusive: "bg-indigo-500",
};

/** Normalize API response to array (handles both raw array and { data: [] }) */
function toArray<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray((data as { data?: unknown })?.data)) {
    return (data as { data: T[] }).data;
  }
  return Array.isArray(data) ? (data as T[]) : [];
}

/** Map GET /filters response to sidebar shape (same option ids used in URL) */
function filtersToSidebarShape(filters: Filter[]): CategoryFilterWithOptions[] {
  return filters.map((f) => ({
    id: f.id,
    category_id: f.category_id,
    name: f.name,
    options: (f.options ?? []).map((o) => ({
      id: o.id,
      category_filter_id: o.filter_id,
      value: o.value,
    })),
  }));
}

/** Filter products by selected option ids (AND logic). Skip if API did not return filter_options. */
function filterProductsByOptions(
  products: ProductCard[],
  optionIds: string[],
): ProductCard[] {
  if (optionIds.length === 0) return products;
  const anyProductHasOptions = products.some(
    (p) => (p.filter_options?.length ?? 0) > 0,
  );
  if (!anyProductHasOptions) return products;
  return products.filter((p) => {
    const productOptionIds =
      p.filter_options?.map((fo) => fo.filter_option_id) ?? [];
    return optionIds.every((id) => productOptionIds.includes(id));
  });
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function Products() {
  const [searchParams] = useSearchParams();
  const query = useMemo(
    () => getQueryFromSearchParams(searchParams),
    [searchParams],
  );
  const filterParams = useMemo(
    () => ({
      category_id: query.category_id,
      search: query.search,
      option_ids:
        query.option_ids && query.option_ids.length > 0
          ? query.option_ids
          : undefined,
    }),
    [query.category_id, query.search, query.option_ids],
  );

  const { data: categoriesData } = useGetProductCategories();
  const { data: filtersData } = useGetFilters(query.category_id ?? "");

  const categories = useMemo(
    () => toArray<ProductCategory>(categoriesData),
    [categoriesData],
  );
  const categoryFilters = useMemo(
    () => filtersToSidebarShape(toArray<Filter>(filtersData)),
    [filtersData],
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetProductsInfinite(filterParams);
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry?.isIntersecting &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "100px",
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    setDeletingId(id);
    deleteProduct(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  const rawProducts = useMemo(
    () =>
      (data?.pages ?? []).flatMap((p) => toArray<ProductCard>(p)) as ProductCard[],
    [data?.pages],
  );
  const products = useMemo(
    () => filterProductsByOptions(rawProducts, query.option_ids ?? []),
    [rawProducts, query.option_ids],
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-destructive">
        Failed to load products
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link to="/products/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </header>

      <ProductsFilters className="max-w-xl" />

      <div className="flex flex-col gap-6 lg:flex-row">
        <CategoryFiltersSidebar
          categories={categories}
          currentCategoryId={query.category_id}
          categoryFilters={categoryFilters}
          selectedOptionIds={query.option_ids ?? []}
        />

        <div className="min-w-0 flex-1">
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
              {products.map((product) => (
                <ProductCardItem
                  key={product.id}
                  product={product}
                  isDeleting={isDeleting}
                  deletingId={deletingId}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          <div
            ref={loadMoreRef}
            className="flex justify-center py-8"
            aria-hidden
          >
            {isFetchingNextPage && (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product card (extracted for readability)
// ---------------------------------------------------------------------------

interface ProductCardItemProps {
  product: ProductCard;
  isDeleting: boolean;
  deletingId: string | null;
  onDelete: (id: string) => void;
}

function ProductCardItem({
  product,
  isDeleting,
  deletingId,
  onDelete,
}: ProductCardItemProps) {
  const price = Number(
    product.sale_price_in_rupee ?? product.sale_price,
  ).toFixed(2);
  const labelColor =
    PRODUCT_LABEL_COLORS[product.product_label ?? ""] ?? "bg-gray-500";

  return (
    <Link to={`/products/${product.id}`}>
      <Card className="relative transition-shadow hover:shadow-md">
        <CardHeader>
          {product.primary_image?.url && (
            <div className="relative mb-4">
              <img
                src={product.primary_image.url}
                alt={product.name}
                className="h-full w-full rounded-md object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              {product.is_featured && (
                <span className="absolute right-2 top-2 rounded-full bg-yellow-400 px-2 py-1 text-xs font-bold text-white">
                  ⭐ Featured
                </span>
              )}
              {product.product_label && (
                <span
                  className={`absolute left-2 top-2 rounded px-2 py-1 text-xs font-medium text-white ${labelColor}`}
                >
                  {product.product_label}
                </span>
              )}
            </div>
          )}
          <CardTitle className="flex items-center justify-between">
            <span className="line-clamp-2">{product.name}</span>
            <div className="ml-2 flex gap-2">
              <Link
                to={`/products/${product.id}/edit`}
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(product.id);
                }}
                disabled={isDeleting && deletingId === product.id}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {product.category && (
            <p className="mb-2 text-sm text-muted-foreground">
              Category: {product.category.name}
            </p>
          )}
          {product.description && (
            <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
              {product.description}
            </p>
          )}
          {product.warranty_label && (
            <p className="mb-2 text-sm text-gray-600">
              🛡️ {product.warranty_label}
            </p>
          )}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-lg font-semibold">₹{price}</span>
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.tags.slice(0, 2).map((tag, i) => (
                  <span
                    key={i}
                    className="rounded bg-muted px-2 py-1 text-xs"
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
}
