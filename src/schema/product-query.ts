import { z } from "zod";

// Parse option_ids from URL (single value or multiple same key) into string array
const optionIdsSchema = z
  .union([
    z.string().transform((v) => (v ? [v] : [])),
    z.array(z.string()),
  ])
  .optional()
  .default([])
  .pipe(z.array(z.string().min(1)).catch(() => []));

export const productListQuerySchema = z.object({
  category_id: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  search: z.string().trim().toLowerCase().optional(),
  option_ids: optionIdsSchema,
  featured: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

/** Convert URLSearchParams to a plain object (multi-value keys become arrays) */
function searchParamsToRecord(searchParams: URLSearchParams): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {};
  searchParams.forEach((value, key) => {
    const existing = record[key];
    if (existing === undefined) {
      record[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      record[key] = [existing, value];
    }
  });
  return record;
}

const defaultQuery: ProductListQuery = {
  category_id: undefined,
  search: undefined,
  option_ids: [],
  featured: undefined,
};

/** Read and validate product list query from URL (category_id, search, option_ids, featured) */
export function getQueryFromSearchParams(searchParams: URLSearchParams): ProductListQuery {
  const record = searchParamsToRecord(searchParams);
  const result = productListQuerySchema.safeParse(record);
  return result.success ? result.data : defaultQuery;
}
