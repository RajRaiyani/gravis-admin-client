import { useEffect } from "react";
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
import { useProductImageUpload } from "@/hooks/useProductImageUpload";
import { ImageCropper } from "@/components/shared/ImageCropper";
import { TagsInput } from "@/components/shared/TagsInput";
import type { Product } from "@/types/product.type";
import { X, Plus } from "lucide-react";
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

  const {
    imagePreviews,
    showCropper,
    imageToCrop,
    openCropper,
    closeCropper,
    handleCropComplete,
    removePreview,
  } = useProductImageUpload();

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
      metadata: {},
      sale_price: 0,
      image_id: "",
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
        metadata: product.metadata || {},
        sale_price: product.sale_price_in_rupee,
        image_id: imageId,
      });
    }
  }, [product, isEditing, form]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(imagePreviews).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = (file: File) => {
    // Remove old image preview if exists before opening cropper
    const currentImageId = form.watch("image_id");
    if (currentImageId) {
      removePreview(currentImageId);
    }
    openCropper(file);
  };

  const handleImageUploadSuccess = (imageId: string) => {
    // Set new image ID
    form.setValue("image_id", imageId);
  };

  const onSubmit = (data: ProductFormValues) => {
    // Schema has already transformed sale_price from rupees to paise
    const submitData = {
      category_id: data.category_id,
      name: data.name,
      description: data.description || "",
      tags: data.tags || [],
      points: data.points || [],
      metadata: data.metadata || {},
      sale_price: data.sale_price,
      image_id: data.image_id,
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
      {showCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={(blob) =>
            handleCropComplete(blob, (imageId) =>
              handleImageUploadSuccess(imageId),
            )
          }
          onCancel={closeCropper}
          aspect={1}
          cropShape="rect"
        />
      )}

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
                        disabled={isPending || showCropper}
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
                        disabled={isPending || showCropper}
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
                name="image_id"
                render={({ field }) => {
                  const imageId = field.value;
                  const imageUrl = imageId
                    ? imagePreviews[imageId] ||
                      product?.images?.find((img) => img.image_id === imageId)
                        ?.image?.url
                    : null;

                  return (
                    <FormItem>
                      <FormLabel>Product Image *</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {imageUrl ? (
                            <div className="space-y-2">
                              <div className="relative inline-block">
                                <div className="relative w-48 h-48 border-2 rounded-md overflow-hidden bg-muted">
                                  <img
                                    src={imageUrl}
                                    alt="Product image"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                    }}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() => {
                                    if (imageId) {
                                      removePreview(imageId);
                                    }
                                    field.onChange("");
                                  }}
                                  disabled={isPending || showCropper}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleFileSelect(file);
                                    }
                                    e.target.value = "";
                                  }}
                                  disabled={isPending || showCropper}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  disabled={isPending || showCropper}
                                >
                                  <span>Replace Image</span>
                                </Button>
                              </label>
                            </div>
                          ) : (
                            <label className="flex w-48 h-48 border-2 border-dashed rounded-md overflow-hidden cursor-pointer hover:border-primary transition-colors">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileSelect(file);
                                  }
                                  e.target.value = "";
                                }}
                                disabled={isPending || showCropper}
                              />
                              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                <Plus className="h-8 w-8 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground text-center px-2">
                                  Add Image
                                </p>
                              </div>
                            </label>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
