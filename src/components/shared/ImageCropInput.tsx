"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Dropzone, DropzoneEmptyState } from "@/components/lib/dropzone";
import { ImageCropper } from "@/components/shared/ImageCropper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPT = { "image/*": [".png", ".jpg", ".jpeg", ".gif"] } as const;

export interface ImageCropInputProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  onBlur?: () => void;
  disabled?: boolean;
  aspect?: number;
  cropShape?: "rect" | "round";
  maxSize?: number;
  existingPreviewUrl?: string | null;
  className?: string;
  "aria-label"?: string;
}

export function ImageCropInput({
  value,
  onChange,
  onBlur,
  disabled = false,
  aspect = 1,
  cropShape = "rect",
  maxSize = DEFAULT_MAX_SIZE,
  existingPreviewUrl,
  className,
  "aria-label": ariaLabel,
}: ImageCropInputProps) {
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const previewUrlFromFile = useMemo(
    () => (value ? URL.createObjectURL(value) : null),
    [value],
  );

  useEffect(() => {
    return () => {
      if (previewUrlFromFile) URL.revokeObjectURL(previewUrlFromFile);
    };
  }, [previewUrlFromFile]);

  const previewUrl =
    previewUrlFromFile ?? (value ? null : (existingPreviewUrl ?? null));

  const openCropper = (file: File) => {
    const url = URL.createObjectURL(file);
    setImageToCrop(url);
    setShowCropper(true);
  };

  const closeCropper = () => {
    setShowCropper(false);
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    }
  };

  const handleFileDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || disabled) return;
    onChange(null);
    openCropper(file);
  };

  const handleCropDone = (blob: Blob) => {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    }
    setShowCropper(false);

    const file = new File([blob], `cropped-image-${Date.now()}.png`, {
      type: "image/png",
    });
    onChange(file);
  };

  const handleClear = () => {
    onChange(null);
    onBlur?.();
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropDone}
          onCancel={closeCropper}
          aspect={aspect}
          cropShape={cropShape}
        />
      )}

      <Dropzone
        src={undefined}
        onDrop={handleFileDrop}
        accept={ACCEPT}
        maxSize={maxSize}
        maxFiles={1}
        disabled={disabled}
        className={cn(
          "w-full min-h-52",
          previewUrl && "p-4 flex flex-col items-start",
        )}
      >
        {previewUrl ? (
          <div className="relative w-full flex flex-col gap-2">
            <div
              className="relative w-48 h-48 border-2 rounded-md bg-muted shrink-0"
              role="img"
              aria-label={ariaLabel ?? "Image preview"}
            >
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute hover:cursor-pointer top-0 right-0 z-10 translate-x-1/2 -translate-y-1/2 size-7 p-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleClear();
                }}
                disabled={disabled}
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              or drag & drop / click to replace
            </p>
          </div>
        ) : (
          <DropzoneEmptyState />
        )}
      </Dropzone>
    </div>
  );
}
