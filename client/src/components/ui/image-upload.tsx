import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (url: string) => void;
  onUpload?: (data: { url: string; publicId: string }) => void;
  value: string;
  folder?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  disabled,
  onChange,
  onUpload,
  value,
  folder = "travelease",
  className,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      const fileReader = new FileReader();
      
      fileReader.onload = async () => {
        if (typeof fileReader.result === "string") {
          const response = await apiRequest("POST", "/api/upload-image", {
            file: fileReader.result,
            folder,
          });
          
          const data = await response.json();
          
          if (response.ok) {
            onChange(data.url);
            if (onUpload) {
              onUpload(data);
            }
          } else {
            console.error("Upload failed:", data.error);
          }
          
          setIsUploading(false);
        }
      };
      
      fileReader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = () => {
    onChange("");
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
      
      {value ? (
        <div className="relative rounded-md overflow-hidden w-full h-60">
          <div className="absolute top-2 right-2 z-10">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemoveImage}
              disabled={disabled || isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <img
            src={value}
            alt="Uploaded image"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-gray-300 rounded-md p-12 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition"
          onClick={handleButtonClick}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-gray-500" />
              <p className="text-sm text-gray-500 text-center">
                Click to upload an image
                <br />
                <span className="text-xs">PNG, JPG or WEBP (max 5MB)</span>
              </p>
            </div>
          )}
        </div>
      )}
      
      {!value && !isUploading && (
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={disabled || isUploading}
          className="mt-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </>
          )}
        </Button>
      )}
    </div>
  );
};