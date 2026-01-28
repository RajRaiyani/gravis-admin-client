import { useState } from "react";
import { toast } from "react-hot-toast";
import { uploadFile } from "@/services/api/file";

interface UseProductImageUploadReturn {
  imagePreviews: Record<string, string>;
  showCropper: boolean;
  imageToCrop: string | null;
  croppingIndex: number | null;
  openCropper: (file: File, index?: number) => void;
  closeCropper: () => void;
  handleCropComplete: (
    croppedImageBlob: Blob,
    onSuccess: (imageId: string) => void
  ) => Promise<void>;
  removePreview: (imageId: string) => void;
  clearAllPreviews: () => void;
}

export function useProductImageUpload(): UseProductImageUploadReturn {
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>(
    {}
  );
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [croppingIndex, setCroppingIndex] = useState<number | null>(null);

  const openCropper = (file: File, index?: number) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setCroppingIndex(index !== undefined ? index : null);
    setShowCropper(true);
  };

  const closeCropper = () => {
    setShowCropper(false);
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    }
    setCroppingIndex(null);
  };

  const handleCropComplete = async (
    croppedImageBlob: Blob,
    onSuccess: (imageId: string) => void
  ) => {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    }

    setShowCropper(false);

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
        const previewUrl = URL.createObjectURL(croppedImageBlob);
        setImagePreviews((prev) => ({
          ...prev,
          [imageId]: previewUrl,
        }));
        onSuccess(imageId);
        toast.success("Image uploaded successfully");
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to upload image";
      toast.error(errorMessage);
    }
  };

  const removePreview = (imageId: string) => {
    if (imagePreviews[imageId]) {
      URL.revokeObjectURL(imagePreviews[imageId]);
      setImagePreviews((prev) => {
        const next = { ...prev };
        delete next[imageId];
        return next;
      });
    }
  };

  const clearAllPreviews = () => {
    Object.values(imagePreviews).forEach((url) => {
      URL.revokeObjectURL(url);
    });
    setImagePreviews({});
  };

  return {
    imagePreviews,
    showCropper,
    imageToCrop,
    croppingIndex,
    openCropper,
    closeCropper,
    handleCropComplete,
    removePreview,
    clearAllPreviews,
  };
}

