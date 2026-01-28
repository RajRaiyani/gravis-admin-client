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
    .array(z.string())
    .max(20, "Maximum 20 tags allowed")
    .default([]),
  metadata: z.object({}).default({}),
  points: z
    .array(z.string().trim().max(70, "Points must be less than 70 characters"))
    .default([]),
  sale_price: z
    .number()
    .min(0, "Sale price must be greater than or equal to 0"),
  image_id: z.uuid({ version: "v7", message: "Invalid image ID" }),
});

// Use z.input to get the type before transformation (for form values)
export type ProductFormValues = z.input<typeof productFormSchema>;

