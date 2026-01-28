import { X, Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product.type";

interface ProductImageGridProps {
  fields: Array<{ id: string }>;
  imagePreviews: Record<string, string>;
  product?: Product;
  getImageId: (index: number) => string;
  getIsPrimary: (index: number) => boolean;
  onRemove: (index: number) => void;
  onSetPrimary: (index: number) => void;
  onReplace: (index: number, file: File) => void;
  onAdd: (file: File) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ProductImageGrid({
  fields,
  imagePreviews,
  product,
  getImageId,
  getIsPrimary,
  onRemove,
  onSetPrimary,
  onReplace,
  onAdd,
  maxImages = 5,
  disabled = false,
}: ProductImageGridProps) {
  const getImageUrl = (imageId: string) => {
    return (
      imagePreviews[imageId] ||
      product?.images?.find((img) => img.image_id === imageId)?.image?.url
    );
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">
        Images * (Up to {maxImages}, one must be primary)
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {fields.map((field, index) => {
          const imageId = getImageId(index);
          const isPrimary = getIsPrimary(index);
          const imageUrl = imageId ? getImageUrl(imageId) : null;

          return (
            <div key={field.id} className="relative">
              <div className="relative aspect-square border-2 rounded-md overflow-hidden bg-muted">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      if (target.parentElement) {
                        target.parentElement.innerHTML = `
                          <div class="w-full h-full bg-muted flex items-center justify-center">
                            <p class="text-xs text-muted-foreground">Image ${index + 1}</p>
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">
                      Image {index + 1}
                    </p>
                  </div>
                )}
                {isPrimary && (
                  <div className="absolute top-2 right-2 bg-yellow-500 rounded-full p-1">
                    <Star className="h-3 w-3 text-white fill-white" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 left-2 h-6 w-6 p-0"
                  onClick={() => onRemove(index)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant={isPrimary ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => onSetPrimary(index)}
                  disabled={disabled}
                >
                  {isPrimary ? "Primary" : "Set Primary"}
                </Button>
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onReplace(index, file);
                      }
                      e.target.value = "";
                    }}
                    disabled={disabled}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    asChild
                  >
                    <span>Replace</span>
                  </Button>
                </label>
              </div>
            </div>
          );
        })}

        {fields.length < maxImages && (
          <div className="relative">
            <label className="flex aspect-square border-2 border-dashed rounded-md overflow-hidden cursor-pointer hover:border-primary transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onAdd(file);
                  }
                  e.target.value = "";
                }}
                disabled={disabled}
              />
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <Plus className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground text-center px-2">
                  Add Image
                </p>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

