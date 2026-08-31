"use client";

import ImageKit from "imagekit-javascript";
import { useState, type ChangeEvent } from "react";
import { useToast } from "@storeforge/ui";
import { addProductImageAction } from "./actions";

export function ImageUploader({ productId, onUploaded }: { productId: string; onUploaded: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const authResponse = await fetch("/api/admin/imagekit-auth");
      if (!authResponse.ok) throw new Error("Could not authenticate the upload.");
      const auth = (await authResponse.json()) as {
        token: string;
        expire: number;
        signature: string;
        publicKey: string;
        urlEndpoint: string;
      };

      const imagekit = new ImageKit({ publicKey: auth.publicKey, urlEndpoint: auth.urlEndpoint });
      const uploadResult = await imagekit.upload({
        file,
        fileName: file.name,
        token: auth.token,
        expire: auth.expire,
        signature: auth.signature,
        folder: "/beautifulmess",
      });

      const result = await addProductImageAction(productId, uploadResult.url);
      if (!result.ok) {
        showToast(result.error ?? "Failed to save the image.", "error");
      } else {
        showToast("Image uploaded.");
        onUploaded();
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Upload failed.", "error");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading} aria-label="Upload image" />
      {isUploading ? <p className="mt-1 text-sm text-muted">Uploading...</p> : null}
    </div>
  );
}
