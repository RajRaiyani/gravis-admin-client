import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    id || "",
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

  const formatPrice = (priceInRupees: number) => {
    return `₹${Number(priceInRupees).toFixed(2)}`;
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
        { type: "image/png" },
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
                  <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600">
                    Primary
                  </Badge>
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
          <CardContent className="space-y-6">
            {/* Status chips */}
            <div className="flex flex-wrap gap-2">
              {product.is_featured && (
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                  ⭐ Featured
                </Badge>
              )}
              {product.product_label && (
                <Badge
                  className={
                    product.product_label === "New"
                      ? "bg-blue-100 text-blue-800"
                      : product.product_label === "Best Seller"
                        ? "bg-green-100 text-green-800"
                        : product.product_label === "Hot Deal"
                          ? "bg-red-100 text-red-800"
                          : product.product_label === "Limited Edition"
                            ? "bg-purple-100 text-purple-800"
                            : product.product_label === "Top Rated"
                              ? "bg-yellow-100 text-yellow-800"
                              : product.product_label === "Sale"
                                ? "bg-orange-100 text-orange-800"
                                : product.product_label === "Exclusive"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-gray-100 text-gray-800"
                  }
                >
                  {product.product_label}
                </Badge>
              )}
            </div>

            {/* Core info */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Overview
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase">
                    Name
                  </dt>
                  <dd className="text-sm md:text-base font-medium">
                    {product.name}
                  </dd>
                </div>

                {product.category && (
                  <div className="space-y-1">
                    <dt className="text-xs font-medium text-muted-foreground uppercase">
                      Category
                    </dt>
                    <dd className="text-sm md:text-base">
                      {product.category.name}
                    </dd>
                  </div>
                )}

                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase">
                    Sale Price
                  </dt>
                  <dd className="text-xl md:text-2xl font-semibold">
                    {formatPrice(
                      product.sale_price_in_rupee ?? product.sale_price,
                    )}
                  </dd>
                </div>

                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase">
                    Product Label
                  </dt>
                  <dd className="text-sm md:text-base">
                    {product.product_label || "None"}
                  </dd>
                </div>

                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase">
                    Warranty
                  </dt>
                  <dd className="text-sm md:text-base">
                    {product.warranty_label ? (
                      <span className="inline-flex items-center gap-1">
                        <span>🛡️</span>
                        <span>{product.warranty_label}</span>
                      </span>
                    ) : (
                      "No warranty info"
                    )}
                  </dd>
                </div>

                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase">
                    Featured Status
                  </dt>
                  <dd
                    className={
                      product.is_featured ? "text-green-600" : "text-gray-500"
                    }
                  >
                    {product.is_featured
                      ? "✓ Featured Product"
                      : "Not Featured"}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Description full width */}
            {product.description && (
              <section className="border-t pt-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Description
                </h2>
                <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              </section>
            )}

            {/* Tags & key points */}
            {(product.tags?.length ?? 0) > 0 ||
            (product.points?.length ?? 0) > 0 ? (
              <section className="border-t pt-4 space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Highlights
                </h2>

                {product.tags && product.tags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs md:text-sm py-1 px-2 md:py-1.5 md:px-3"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {product.points && product.points.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Key Points
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.points.map((point, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs md:text-sm py-1 px-2 md:py-1.5 md:px-3"
                        >
                          {point}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ) : null}

            {/* Technical details */}
            {product.technical_details &&
              Array.isArray(product.technical_details) &&
              product.technical_details.length > 0 && (
                <section className="border-t pt-4 space-y-2">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Technical Specifications
                  </h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Specification</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.technical_details
                        .filter(
                          (d: { label?: string; value?: string }) =>
                            d && (d.label || d.value),
                        )
                        .map(
                          (
                            d: { label?: string; value?: string },
                            idx: number,
                          ) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {d.label || "—"}
                              </TableCell>
                              <TableCell>{d.value || "—"}</TableCell>
                            </TableRow>
                          ),
                        )}
                    </TableBody>
                  </Table>
                </section>
              )}

            {/* Filter attributes */}
            {product.filter_options && product.filter_options.length > 0 && (
              <section className="border-t pt-4 space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Attributes
                </h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Filter</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.filter_options.map((fo) => (
                      <TableRow key={fo.filter_option_id}>
                        <TableCell className="font-medium">
                          {fo.filter_name || "—"}
                        </TableCell>
                        <TableCell>{fo.value || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
            )}

            {/* System & metadata info */}
            <section className="border-t pt-4 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                System Information
              </h2>

              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase">
                    Product ID
                  </dt>
                  <dd className="text-xs md:text-sm font-mono break-all">
                    {product.id}
                  </dd>
                </div>

                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase">
                    Category ID
                  </dt>
                  <dd className="text-xs md:text-sm font-mono break-all">
                    {product.category_id}
                  </dd>
                </div>

                {product.created_at && (
                  <div className="space-y-1">
                    <dt className="text-xs font-medium text-muted-foreground uppercase">
                      Created At
                    </dt>
                    <dd className="text-xs md:text-sm">
                      {new Date(product.created_at).toLocaleString()}
                    </dd>
                  </div>
                )}

                {product.updated_at && (
                  <div className="space-y-1">
                    <dt className="text-xs font-medium text-muted-foreground uppercase">
                      Updated At
                    </dt>
                    <dd className="text-xs md:text-sm">
                      {new Date(product.updated_at).toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>

              {product.metadata && Object.keys(product.metadata).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Metadata
                  </p>
                  <pre className="bg-muted rounded-md p-3 text-xs md:text-sm font-mono whitespace-pre-wrap break-all max-h-64 overflow-auto">
                    {JSON.stringify(product.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
