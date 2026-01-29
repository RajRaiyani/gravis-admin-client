import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { productFormSchema, type ProductFormValues } from "@/schema/product";
import {
  useGetProduct,
  useCreateProduct,
  useUpdateProduct,
} from "@/hooks/useProducts";
import { useGetProductCategories } from "@/hooks/useProductCategories";
import { ImageCropInput } from "@/components/shared/ImageCropInput";
import { uploadFile } from "@/services/api/file";
import { toast } from "react-hot-toast";
import { TagsInput } from "@/components/shared/TagsInput";
import type { Product } from "@/types/product.type";
import { Plus, Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AddOrUpdateProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: productData, isLoading: isLoadingProduct } = useGetProduct(
    id || "",
  );
  const { data: categoriesData } = useGetProductCategories();
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

  // Extract product from response
  const product = productData
    ? (productData as unknown as { data?: Product })?.data ||
      (productData as unknown as Product | undefined)
    : undefined;

  // Extract categories from response
  const categories = categoriesData
    ? Array.isArray((categoriesData as any)?.data)
      ? (categoriesData as any).data
      : Array.isArray(categoriesData)
        ? categoriesData
        : []
    : [];

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      category_id: "",
      name: "",
      description: "",
      tags: [],
      points: [],
      technical_details: [],
      metadata: {},
      sale_price: 0,
      image_id: "",
      imageFile: null,
    },
  });

  // Load product data when editing
  useEffect(() => {
    if (product && isEditing) {
      // Ensure tags is always an array
      const tags = Array.isArray(product.tags)
        ? product.tags.filter(
            (tag) => tag && typeof tag === "string" && tag.trim().length > 0,
          )
        : [];

      // Ensure points is always an array
      const points = Array.isArray(product.points)
        ? product.points.filter(
            (point) =>
              point && typeof point === "string" && point.trim().length > 0,
          )
        : [];

      // Ensure technical_details is always an array
      const technicalDetails = Array.isArray(product.technical_details)
        ? product.technical_details
            .filter(
              (detail: any) =>
                detail &&
                typeof detail === "object" &&
                detail.label &&
                detail.value,
            )
            .map((detail: any) => ({
              label: String(detail.label),
              value: String(detail.value),
            }))
        : [];

      // Get primary image ID (backend now uses single image)
      const primaryImage = product.images?.find((img) => img.is_primary);
      const imageId =
        primaryImage?.image_id || product.images?.[0]?.image_id || "";

      form.reset({
        category_id: product.category_id || "",
        name: product.name || "",
        description: product.description || "",
        tags: tags,
        points: points,
        technical_details: technicalDetails,
        metadata: product.metadata || {},
        sale_price: product.sale_price_in_rupee,
        image_id: imageId,
        imageFile: null,
      });
    }
  }, [product, isEditing, form]);

  const onSubmit = async (data: ProductFormValues) => {
    const existingImageId = data.image_id || "";
    const imageFile = data.imageFile ?? null;

    if (!imageFile && !existingImageId) {
      form.setError("image_id", {
        type: "manual",
        message: "Product image is required",
      });
      return;
    }

    let imageId = existingImageId;

    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append("file", imageFile);
        const response = await uploadFile(formData);
        imageId = (response as { id?: string })?.id ?? "";
        if (!imageId) {
          toast.error("Failed to upload image");
          return;
        }
      } catch (error: unknown) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message: string }).message)
            : "Failed to upload image";
        toast.error(message);
        return;
      }
    }

    const submitData = {
      category_id: data.category_id,
      name: data.name,
      description: data.description || "",
      tags: data.tags || [],
      points: data.points || [],
      technical_details: data.technical_details || [],
      metadata: data.metadata || {},
      sale_price: data.sale_price,
      image_id: imageId,
    };

    if (isEditing && id) {
      updateProduct(
        { id, data: submitData },
        {
          onSuccess: () => {
            navigate("/products");
          },
        },
      );
    } else {
      createProduct(submitData, {
        onSuccess: () => {
          navigate("/products");
        },
      });
    }
  };

  const primaryImgUrl = useMemo(() => {
    return product?.images?.find((img) => img.is_primary)?.image?.url;
  }, [product]);

  if (isLoadingProduct && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  const isPending = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {isEditing ? "Edit Product" : "Add Product"}
        </h1>
        <Button variant="outline" onClick={() => navigate("/products")}>
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center gap-4">
                <FormField
                  control={form.control}
                  name="image_id"
                  render={() => (
                    <FormItem className="flex-1">
                      <FormLabel>Product Image *</FormLabel>
                      <FormControl>
                        <FormField
                          control={form.control}
                          name="imageFile"
                          render={({ field: fileField }) => (
                            <ImageCropInput
                              value={fileField.value ?? null}
                              onChange={fileField.onChange}
                              onBlur={fileField.onBlur}
                              disabled={isPending}
                              aspect={1}
                              cropShape="rect"
                              aria-label="Product image"
                            />
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {primaryImgUrl && (
                  <div>
                    <img
                      className="size-48"
                      src={primaryImgUrl}
                      alt="Product image"
                    />
                  </div>
                )}
              </div>
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter product name"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter product description"
                        rows={4}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sale_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price (in ₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter price in rupees (e.g., 100.00)"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        value={field.value || ""}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      {field.value
                        ? `₹${(field.value as number).toFixed(2)}`
                        : ""}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <TagsInput
                        value={field.value || []}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Type and press Enter to add tags"
                        maxTags={20}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points</FormLabel>
                    <FormControl>
                      <TagsInput
                        value={field.value || []}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Type and press Enter to add points (max 70 characters each)"
                        maxLength={70}
                        disabled={isPending}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Add key points about the product (max 70 characters per
                      point)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technical_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technical Details</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {(field.value || []).map((detail, index) => (
                          <div
                            key={index}
                            className="flex gap-2 items-start p-3 border rounded-md"
                          >
                            <div className="flex-1 space-y-2">
                              <Input
                                placeholder="Label (e.g., Weight, Dimensions)"
                                value={detail.label}
                                onChange={(e) => {
                                  const newDetails = [...(field.value || [])];
                                  newDetails[index] = {
                                    ...newDetails[index],
                                    label: e.target.value,
                                  };
                                  field.onChange(newDetails);
                                }}
                                disabled={isPending}
                              />
                              <Input
                                placeholder="Value (e.g., 2.5 kg, 10x5x3 cm)"
                                value={detail.value}
                                onChange={(e) => {
                                  const newDetails = [...(field.value || [])];
                                  newDetails[index] = {
                                    ...newDetails[index],
                                    value: e.target.value,
                                  };
                                  field.onChange(newDetails);
                                }}
                                disabled={isPending}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newDetails = (field.value || []).filter(
                                  (_, i) => i !== index,
                                );
                                field.onChange(newDetails);
                              }}
                              disabled={isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            field.onChange([
                              ...(field.value || []),
                              { label: "", value: "" },
                            ]);
                          }}
                          disabled={isPending}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Technical Detail
                        </Button>
                      </div>
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Add technical specifications like weight, dimensions,
                      materials, etc.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? isEditing
                      ? "Updating..."
                      : "Creating..."
                    : isEditing
                      ? "Update Product"
                      : "Create Product"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/products")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
