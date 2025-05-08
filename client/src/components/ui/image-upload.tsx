import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, X, Upload as UploadIcon, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (dataUrl: string) => void;
  previewUrl?: string | null;
  isUploading?: boolean;
  className?: string;
  label?: string;
}

export function ImageUpload({
  onImageSelect,
  previewUrl,
  isUploading = false,
  className = '',
  label = 'Image',
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onImageSelect(result);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageSelect('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="image-upload">{label}</Label>
      
      {preview ? (
        <div className="relative border rounded-md overflow-hidden">
          <img 
            src={preview} 
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 bg-neutral-800/70 text-white rounded-full p-1"
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div 
          className="border-2 border-dashed rounded-md p-4 text-center bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center py-4">
            <ImageIcon className="h-8 w-8 text-neutral-400 mb-2" />
            <p className="text-sm text-neutral-500">Click to select an image</p>
            <p className="text-xs text-neutral-400 mt-1">
              JPG, PNG or GIF, max 5MB
            </p>
          </div>
        </div>
      )}
      
      <Input
        id="image-upload"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
      
      {!preview && (
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <UploadIcon className="h-4 w-4 mr-2" />
              Browse...
            </>
          )}
        </Button>
      )}
    </div>
  );
}