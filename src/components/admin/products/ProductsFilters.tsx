import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 700;

interface ProductsFiltersProps {
  className?: string;
}

export function ProductsFilters({ className }: ProductsFiltersProps) {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const searchFromUrl = searchParams.get("search") ?? "";
  const [value, setValue] = useState(searchFromUrl);
  const debouncedValue = useDebounce(value, DEBOUNCE_MS);

  useEffect(() => {
    setValue(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    if (debouncedValue === searchFromUrl) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedValue) {
      params.set("search", debouncedValue);
    } else {
      params.delete("search");
    }
    navigate(`${pathname}?${params.toString()}`, { replace: true });
  }, [debouncedValue, pathname, navigate, searchParams, searchFromUrl]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors",
        "focus-within:border-[#0046B7] focus-within:ring-2 focus-within:ring-[#0046B7]/15",
        "hover:border-slate-300",
        className,
      )}
    >
      <Search className="size-5 shrink-0 text-slate-400" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products by name..."
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        aria-label="Search products"
        autoComplete="off"
      />
    </div>
  );
}
