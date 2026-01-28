import { z } from "zod";

export const productCategoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  image_id: z.string().uuid({ message: "Invalid image ID" }),
});

export type ProductCategoryFormValues = z.infer<typeof productCategoryFormSchema>;

