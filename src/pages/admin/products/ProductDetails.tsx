import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetProduct,
  useDeleteProduct,
  useAddProductImage,
  useDeleteProductImage,
} from "@/hooks/useProducts";
import type { Product } from "@/types/product.type";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageCropper } from "@/components/shared/ImageCropper";
import { uploadFile } from "@/services/api/file";
import { toast } from "react-hot-toast";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: productData, isLoading, error } = useGetProduct(id || "");
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const { mutate: addImage, isPending: isAddingImage } = useAddProductImage(
    id || ""
  );
  const { mutate: deleteImage, isPending: isDeletingImage } =
    useDeleteProductImage(id || "");
  const [isDeletingState, setIsDeletingState] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Extract product from response
  const product = productData
    ? (productData as unknown as { data?: Product })?.data ||
      (productData as unknown as Product | undefined)
    : undefined;

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setIsDeletingState(true);
      deleteProduct(id || "", {
        onSuccess: () => {
          navigate("/products");
        },
        onSettled: () => {
          setIsDeletingState(false);
        },
      });
    }
  };

  const formatPrice = (price: number) => {
    return `₹${(price / 100).toFixed(2)}`;
  };

  const getPrimaryImage = () => {
    if (!product?.images || product.images.length === 0) return null;
    const primaryImage = product.images.find((img) => img.is_primary);
    return primaryImage?.image?.url || product.images[0]?.image?.url || null;
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    }
    setShowCropper(false);
    setUploadingImage(true);

    try {
      const croppedFile = new File(
        [croppedImageBlob],
        `cropped-image-${Date.now()}.png`,
        { type: "image/png" }
      );

      const formData = new FormData();
      formData.append("file", croppedFile);

      const response = await uploadFile(formData);
      const imageId = (response as any)?.id;

      if (imageId) {
        addImage(imageId);
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

  const handleDeleteImage = (imageId: string, isPrimary: boolean) => {
    if (isPrimary) {
      toast.error("Cannot delete primary image");
      return;
    }
    if (window.confirm("Are you sure you want to remove this image?")) {
      deleteImage(imageId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Product not found</p>
      </div>
    );
  }

  const primaryImageUrl = getPrimaryImage();
  const otherImages =
    product.images?.filter((img) => img.image?.url !== primaryImageUrl) || [];

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
        <div className="flex items-center gap-4">
          <Link to="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{product.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link to={`/products/${product.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || isDeletingState}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Images</CardTitle>
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
                  disabled={uploadingImage || showCropper || isAddingImage}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={uploadingImage || showCropper || isAddingImage}
                >
                  <span>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Image
                  </span>
                </Button>
              </label>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {primaryImageUrl && (
              <div>
                <p className="text-sm font-medium mb-2">Primary Image</p>
                <div className="aspect-square w-full max-w-md mx-auto relative">
                  <img
                    src={primaryImageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-md border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                    Primary
                  </span>
                </div>
              </div>
            )}
            {otherImages.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Other Images</p>
                <div className="grid grid-cols-2 gap-4">
                  {otherImages.map((img, idx) => (
                    <div
                      key={img.image_id || idx}
                      className="aspect-square relative group"
                    >
                      <img
                        src={img.image?.url}
                        alt={`${product.name} - Image ${idx + 2}`}
                        className="w-full h-full object-cover rounded-md border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          handleDeleteImage(img.image_id, img.is_primary)
                        }
                        disabled={isDeletingImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!primaryImageUrl && product.images?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No images available
                </p>
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
                    disabled={uploadingImage || showCropper || isAddingImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    disabled={uploadingImage || showCropper || isAddingImage}
                  >
                    <span>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Image
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg">{product.name}</p>
            </div>

            {product.category && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Category
                </p>
                <p className="text-lg">{product.category.name}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Sale Price
              </p>
              <p className="text-2xl font-bold">
                {formatPrice(product.sale_price)}
              </p>
            </div>

            {product.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Description
                </p>
                <p className="text-base whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {product.tags && product.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-muted rounded text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.points && product.points.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Points
                </p>
                <ul className="space-y-2">
                  {product.points.map((point, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-base"
                    >
                      <span className="text-primary mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.created_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created At
                </p>
                <p className="text-base">
                  {new Date(product.created_at).toLocaleString()}
                </p>
              </div>
            )}

            {product.updated_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Updated At
                </p>
                <p className="text-base">
                  {new Date(product.updated_at).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
