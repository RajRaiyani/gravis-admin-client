import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Area, Point } from "react-easy-crop";

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspect?: number;
  cropShape?: "rect" | "round";
}

export function ImageCropper({
  image,
  onCropComplete,
  onCancel,
  aspect = 1, // Square by default
  cropShape = "rect",
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop: Point) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: false });

    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Set canvas size to match the cropped area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Clear canvas to ensure transparency is preserved
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      // Use PNG format to preserve transparency
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          resolve(blob);
        },
        "image/png",
        1.0 // PNG quality is always 1.0 (lossless)
      );
    });
  };

  const handleDone = async () => {
    if (!croppedAreaPixels || isProcessing) return;

    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImageBlob);
    } catch (error) {
      console.error("Error cropping image:", error);
      // Error will be handled by parent component
      onCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Crop Image</h2>
            {aspect === 1 && (
              <p className="text-sm text-muted-foreground mt-1">
                Square crop (1:1 aspect ratio)
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative w-full h-[400px] bg-gray-100">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            style={{
              containerStyle: {
                width: "100%",
                height: "100%",
                position: "relative",
              },
            }}
          />
        </div>

        <div className="p-4 border-t space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDone}
              disabled={isProcessing || !croppedAreaPixels}
            >
              {isProcessing ? "Processing..." : "Done"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
