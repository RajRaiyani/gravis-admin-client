import { useEffect, useState } from "react";
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
import type { ProductCategory } from "@/types/product-category.type";
import { ImageCropper } from "@/components/shared/ImageCropper";
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  // Extract category from response (handle both { data: {...} } and {...} formats)
  const category = categoryData
    ? (categoryData as unknown as { data?: ProductCategory })?.data ||
      (categoryData as unknown as ProductCategory | undefined)
    : undefined;

  const form = useForm<ProductCategoryFormValues>({
    resolver: zodResolver(productCategoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      image_id: "",
    },
  });

  // Load category data when editing
  useEffect(() => {
    if (category && isEditing) {
      form.reset({
        name: category.name || "",
        description: category.description || "",
        image_id: category.image_id || "",
      });
      if (category.image?.url) {
        setImagePreview(category.image.url);
      } else if (category.image_id) {
        // Fallback if image object is not available
        setImagePreview(null);
      }
    }
  }, [category, isEditing, form]);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Create object URL for the cropper
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    // Clean up object URL first
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    }

    setShowCropper(false);
    setUploadingImage(true);

    try {
      // Convert blob to File (PNG format to preserve transparency)
      const croppedFile = new File(
        [croppedImageBlob],
        `cropped-image-${Date.now()}.png`,
        { type: "image/png" }
      );

      const formData = new FormData();
      formData.append("file", croppedFile);

      const response = await uploadFile(formData);
      // Handle both response formats: { data: {...} } or {...}
      const imageId = (response as any)?.id;

      if (imageId) {
        form.setValue("image_id", imageId);
        // Create preview from cropped blob
        const previewUrl = URL.createObjectURL(croppedImageBlob);
        setImagePreview(previewUrl);
        toast.success("Image cropped and uploaded successfully");
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to upload image";
      toast.error(errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    }
  };

  const onSubmit = (data: ProductCategoryFormValues) => {
    // Ensure description is a string (not undefined) for backend validation
    const submitData = {
      ...data,
      description: data.description || "",
    };

    if (isEditing && id) {
      updateCategory(
        { id, data: submitData },
        {
          onSuccess: () => {
            navigate("/product-categories");
          },
        }
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
      {showCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspect={1}
          cropShape="rect"
        />
      )}

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
                name="image_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image *</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileSelect(file);
                            }
                            // Reset input value to allow selecting the same file again
                            e.target.value = "";
                          }}
                          disabled={uploadingImage || showCropper}
                        />
                        {imagePreview && (
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">
                              Cropped Image Preview (Square)
                            </p>
                            <div className="w-48 h-48 mx-auto">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-md border"
                              />
                            </div>
                          </div>
                        )}
                        {field.value &&
                          !imagePreview &&
                          category?.image?.url && (
                            <div className="mt-4">
                              <img
                                src={category.image.url}
                                alt="Current"
                                className="w-full h-48 object-cover rounded-md border"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            </div>
                          )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={isPending || uploadingImage}>
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
