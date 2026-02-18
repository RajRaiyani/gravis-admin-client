import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  productCategoryFormSchema,
  type ProductCategoryFormValues,
} from "@/schema/product-category";
import {
  useGetProductCategory,
  useCreateProductCategory,
  useUpdateProductCategory,
} from "@/hooks/useProductCategories";
import { uploadFile } from "@/services/api/file";
import { ImageCropInput } from "@/components/shared/ImageCropInput";
import type { ProductCategory } from "@/types/product-category.type";
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

export default function AddOrUpdateProductCategory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: categoryData, isLoading: isLoadingCategory } =
    useGetProductCategory(id || "");
  const { mutate: createCategory, isPending: isCreating } =
    useCreateProductCategory();
  const { mutate: updateCategory, isPending: isUpdating } =
    useUpdateProductCategory();

  const category = categoryData
    ? (categoryData as unknown as { data?: ProductCategory })?.data ||
      (categoryData as unknown as ProductCategory | undefined)
    : undefined;

  const form = useForm<ProductCategoryFormValues>({
    resolver: zodResolver(productCategoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      imageFile: null,
      bannerImageFile: null,
    },
  });

  useEffect(() => {
    if (category && isEditing) {
      form.reset({
        name: category.name || "",
        description: category.description || "",
        imageFile: null,
        bannerImageFile: null,
      });
    }
  }, [category, isEditing, form]);

  const onSubmit = async (data: ProductCategoryFormValues) => {
    const existingImageId = category?.image?.id || "";
    const existingBannerImageId = category?.banner_image?.id || "";
    const imageFile = data.imageFile ?? null;
    const bannerImageFile = data.bannerImageFile ?? null;

    if (!imageFile && !existingImageId) {
      form.setError("imageFile", {
        type: "manual",
        message: "Category image is required",
      });
      return;
    }

    let imageId = existingImageId;
    let bannerImageId = existingBannerImageId;

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

    if (bannerImageFile) {
      try {
        const formData = new FormData();
        formData.append("file", bannerImageFile);
        const response = await uploadFile(formData);
        bannerImageId = (response as { id?: string })?.id ?? "";
        if (!bannerImageId) {
          toast.error("Failed to upload banner image");
          return;
        }
      } catch (error: unknown) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message: string }).message)
            : "Failed to upload banner image";
        toast.error(message);
        return;
      }
    }

    const submitData = {
      name: data.name,
      description: data.description || "",
      image_id: imageId,
      banner_image_id: bannerImageId || undefined,
    };

    if (isEditing && id) {
      updateCategory(
        { id, data: submitData },
        {
          onSuccess: () => {
            navigate("/product-categories");
          },
        },
      );
    } else {
      createCategory(submitData, {
        onSuccess: () => {
          navigate("/product-categories");
        },
      });
    }
  };

  if (isLoadingCategory && isEditing) {
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
          {isEditing ? "Edit Product Category" : "Add Product Category"}
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate("/product-categories")}
        >
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter category name"
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
                        placeholder="Enter category description"
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
                name="imageFile"
                render={() => (
                  <FormItem>
                    <FormLabel>Category Image *</FormLabel>
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
                            existingPreviewUrl={category?.image?.url ?? null}
                            aria-label="Category image"
                          />
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bannerImageFile"
                render={() => (
                  <FormItem>
                    <FormLabel>Banner Image (Optional)</FormLabel>
                    <FormControl>
                      <FormField
                        control={form.control}
                        name="bannerImageFile"
                        render={({ field: fileField }) => (
                          <ImageCropInput
                            value={fileField.value ?? null}
                            onChange={fileField.onChange}
                            onBlur={fileField.onBlur}
                            disabled={isPending}
                            aspect={2}
                            cropShape="rect"
                            existingPreviewUrl={
                              category?.banner_image?.url ?? null
                            }
                            aria-label="Category banner image"
                          />
                        )}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground mt-2">
                      Large banner for category page header (Recommended:
                      1920x960px or 2:1 ratio)
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
                      ? "Update Category"
                      : "Create Category"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/product-categories")}
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
