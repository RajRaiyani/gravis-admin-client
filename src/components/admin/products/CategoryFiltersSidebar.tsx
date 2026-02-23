import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type {
  ProductCategory,
  CategoryFilterWithOptions,
} from "@/types/product-category.type";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X } from "lucide-react";

const ALL_CATEGORIES_VALUE = "__all__";

interface CategoryFiltersSidebarProps {
  categories: ProductCategory[];
  currentCategoryId: string | undefined;
  categoryFilters: CategoryFilterWithOptions[];
  selectedOptionIds: string[];
  embedded?: boolean;
}

export function CategoryFiltersSidebar({
  categories,
  currentCategoryId,
  categoryFilters,
  selectedOptionIds,
  embedded = false,
}: CategoryFiltersSidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  /** Update URL query params and replace history (keeps filter state in URL) */
  const updateUrlParams = (updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      params.delete(key);
      if (value == null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else {
        params.set(key, value);
      }
    });
    navigate(`${pathname}?${params.toString()}`, { replace: true });
  };

  const handleCategoryChange = (value: string) => {
    updateUrlParams({
      category_id: value === ALL_CATEGORIES_VALUE ? null : value,
      option_ids: null,
    });
  };

  const handleOptionToggle = (optionId: string) => {
    const isSelected = selectedOptionIds.includes(optionId);
    const nextIds = isSelected
      ? selectedOptionIds.filter((id) => id !== optionId)
      : [...selectedOptionIds, optionId];
    updateUrlParams({ option_ids: nextIds.length > 0 ? nextIds : null });
  };

  const handleClearFilters = () => {
    updateUrlParams({ option_ids: null });
  };

  const hasActiveFilters = selectedOptionIds.length > 0;

  return (
    <div
      className={cn(
        "w-full shrink-0",
        !embedded && "lg:sticky lg:top-24 lg:w-72 lg:self-start",
      )}
      aria-label="Category and filters"
    >
      <aside className="overflow-hidden rounded-md border border-slate-200/80 bg-white shadow-sm">
        <div
          className={cn(
            "flex flex-col overflow-y-auto",
            embedded ? "max-h-full" : "max-h-[85vh]",
          )}
        >
          {/* Category dropdown */}
          <section
            className="border-b border-slate-100 bg-slate-50/80 px-4 py-4"
            aria-label="Category"
          >
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Category
            </h3>
            <select
              value={currentCategoryId ?? ALL_CATEGORIES_VALUE}
              onChange={(e) => handleCategoryChange(e.target.value)}
              aria-label="Select category"
              className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#0046B7] focus:ring-2 focus:ring-[#0046B7]/20"
            >
              <option value={ALL_CATEGORIES_VALUE}>All categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </section>

          {/* Filter options (only when a category is selected) */}
          {currentCategoryId && (
            <section className="flex flex-1 flex-col p-4" aria-label="Filters">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <SlidersHorizontal className="size-4" aria-hidden />
                  </span>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Filters
                  </h2>
                  {hasActiveFilters && (
                    <span className="rounded-full bg-[#0046B7] px-2 py-0.5 text-[10px] font-medium text-white">
                      {selectedOptionIds.length}
                    </span>
                  )}
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100"
                  >
                    <X className="size-4" aria-hidden />
                    Clear
                  </button>
                )}
              </div>

              {categoryFilters.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-500">
                  No filters for this category.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {categoryFilters.map((filter) => (
                    <div key={filter.id}>
                      <h3 className="mb-2 text-sm font-semibold uppercase text-slate-800">
                        {filter.name}
                      </h3>
                      <ul className="flex flex-col gap-0.5">
                        {filter.options.map((option) => {
                          const isChecked = selectedOptionIds.includes(option.id);
                          return (
                            <li key={option.id}>
                              <button
                                type="button"
                                onClick={() => handleOptionToggle(option.id)}
                                className={cn(
                                  "flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                                  isChecked
                                    ? "text-[#0046B7]"
                                    : "text-slate-700 hover:bg-slate-100/80",
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2",
                                    isChecked
                                      ? "border-[#0046B7] bg-[#0046B7] text-white"
                                      : "border-slate-300 bg-white",
                                  )}
                                  aria-hidden
                                >
                                  {isChecked && (
                                    <svg
                                      className="size-3"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2.5}
                                      viewBox="0 0 24 24"
                                      aria-hidden
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </span>
                                <span className="font-medium">{option.value}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
