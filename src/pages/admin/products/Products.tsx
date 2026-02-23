import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Edit, Trash2, Loader2, Star } from "lucide-react";
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

/** Single color for all product labels (e.g. New, Sale, Best Seller) */
const PRODUCT_LABEL_CLASS = "bg-slate-600 text-white";

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
      only_featured: query.featured === true ? true : undefined,
    }),
    [query.category_id, query.search, query.option_ids, query.featured],
  );

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value == null) params.delete(key);
        else params.set(key, value);
      });
      navigate(`${pathname}?${params.toString()}`, { replace: true });
    },
    [pathname, navigate, searchParams],
  );
  const toggleFeatured = useCallback(() => {
    updateUrlParams({
      featured: query.featured ? null : "true",
    });
  }, [query.featured, updateUrlParams]);

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
  const products = useMemo(() => {
    let list = filterProductsByOptions(rawProducts, query.option_ids ?? []);
    if (query.featured === true) {
      list = list.filter((p) => p.is_featured === true);
    }
    return list;
  }, [rawProducts, query.option_ids, query.featured]);

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50">
        <Loader2 className="h-10 w-10 animate-spin text-[#0046B7]" aria-hidden />
        <p className="text-sm font-medium text-slate-600">Loading products...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50/50">
        <p className="text-sm font-medium text-destructive">Failed to load products</p>
        <p className="text-xs text-slate-600">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Products
        </h1>
        <Link to="/products/create">
          <Button
            size="default"
            className="gap-2 bg-[#0046B7] font-medium hover:bg-[#003d9e]"
          >
            <Plus className="size-4" aria-hidden />
            Add Product
          </Button>
        </Link>
      </header>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <ProductsFilters className="min-w-0 flex-1 sm:max-w-md" />
        <label className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-2.5 shadow-sm transition-colors hover:bg-slate-100/80 hover:border-slate-300 has-[:checked]:border-[#0046B7] has-[:checked]:bg-[#0046B7]/10">
          <input
            type="checkbox"
            checked={query.featured === true}
            onChange={toggleFeatured}
            className="h-4 w-4 rounded border-slate-300 text-[#0046B7] focus:ring-2 focus:ring-[#0046B7]/30"
            aria-label="Show only featured products"
          />
          <Star className="size-4 shrink-0 text-amber-500" aria-hidden />
          <span className="text-sm font-medium text-slate-700">Featured only</span>
        </label>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <CategoryFiltersSidebar
          categories={categories}
          currentCategoryId={query.category_id}
          categoryFilters={categoryFilters}
          selectedOptionIds={query.option_ids ?? []}
        />

        <div className="min-w-0 flex-1">
          {products.length === 0 ? (
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <p className="text-base font-medium text-slate-600">No products found</p>
                <p className="text-sm text-slate-500">
                  Try adjusting search or filters, or add a new product.
                </p>
                <Link to="/products/create">
                  <Button variant="outline" size="default" className="mt-2 gap-2">
                    <Plus className="size-4" />
                    Create your first product
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
            className="flex justify-center py-10"
            aria-hidden
          >
            {isFetchingNextPage && (
              <Loader2 className="h-8 w-8 animate-spin text-[#0046B7]" />
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

  return (
    <Link to={`/products/${product.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0046B7] focus-visible:ring-offset-2 rounded-xl">
      <Card className="relative h-full overflow-hidden border-slate-200 transition-all hover:shadow-md hover:border-slate-300">
        <CardHeader className="p-0">
          {product.primary_image?.url && (
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
              <img
                src={product.primary_image.url}
                alt={product.name}
                className="h-full w-full object-cover transition-transform hover:scale-[1.02]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                {product.is_featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                    <Star className="size-3 fill-current" aria-hidden />
                    Featured
                  </span>
                )}
                {product.product_label && (
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium shadow-sm ${PRODUCT_LABEL_CLASS}`}
                  >
                    {product.product_label}
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2 p-4">
            <CardTitle className="flex items-start justify-between gap-2 text-base leading-snug">
              <span className="line-clamp-2 flex-1 font-semibold text-slate-900">
                {product.name}
              </span>
              <div className="flex shrink-0 gap-1">
                <Link
                  to={`/products/${product.id}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0046B7]"
                  aria-label="Edit product"
                >
                  <Edit className="size-4" />
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(product.id);
                  }}
                  disabled={isDeleting && deletingId === product.id}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-destructive disabled:opacity-50"
                  aria-label="Delete product"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {product.category && (
            <p className="line-clamp-1 text-sm text-slate-500">
              {product.category.name}
            </p>
          )}
          {product.description && (
            <p className="line-clamp-2 text-sm text-slate-600">
              {product.description}
            </p>
          )}
          {product.warranty_label && (
            <p className="text-sm text-slate-600">
              <span className="text-slate-400" aria-hidden>🛡️</span> {product.warranty_label}
            </p>
          )}
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <span className="text-lg font-bold text-slate-900">₹{price}</span>
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {product.tags.slice(0, 2).map((tag, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
                {product.tags.length > 2 && (
                  <span className="text-xs text-slate-400">
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
