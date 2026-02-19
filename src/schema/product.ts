import { z } from "zod";

export const productFormSchema = z.object({
  category_id: z.uuid({ version: "v7", message: "Invalid category ID" }),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .min(3, "Name must be at least 3 characters")
    .max(255, "Name must be less than 255 characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
  tags: z
    .array(z.object({ value: z.string() }))
    .max(20, "Maximum 20 tags allowed")
    .default([]),
  metadata: z.object({}).default({}),
  points: z
    .array(
      z.object({
        value: z
          .string()
          .trim()
          .max(70, "Points must be less than 70 characters"),
      }),
    )
    .default([]),
  technical_details: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    )
    .default([]),
  sale_price: z
    .number()
    .min(0, "Sale price must be greater than or equal to 0"),
  product_label: z
    .string()
    .max(100, "Product label must be less than 100 characters")
    .optional(),
  warranty_label: z
    .string()
    .max(255, "Warranty label must be less than 255 characters")
    .optional(),
  is_featured: z.boolean().default(false),
  imageFile: z.instanceof(File).nullable().optional(),
  attribute_mappings: z
    .array(
      z.object({
        filter_id: z.string(),
        filter_option_id: z.string(),
      })
    )
    .default([]),
});

// Use z.input to get the type before transformation (for form values)
export type ProductFormValues = z.input<typeof productFormSchema>;

