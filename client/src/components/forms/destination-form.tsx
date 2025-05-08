import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader2 } from "lucide-react";
import { insertDestinationSchema, type Destination } from "@shared/schema";

// Extend the schema to include validation
const destinationFormSchema = insertDestinationSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  imageUrl: z.string().url("Please provide a valid URL or upload an image"),
});

type DestinationFormValues = z.infer<typeof destinationFormSchema>;

interface DestinationFormProps {
  initialData?: Destination;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export default function DestinationForm({
  initialData,
  onSubmit,
  isSubmitting,
}: DestinationFormProps) {
  const { toast } = useToast();
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<DestinationFormValues>({
    resolver: zodResolver(destinationFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      country: initialData?.country || "",
      description: initialData?.description || "",
      imageUrl: initialData?.imageUrl || "",
      featured: initialData?.featured || false,
    },
  });

  // Upload image to Cloudinary
  const uploadImageMutation = useMutation({
    mutationFn: async (dataUrl: string) => {
      const res = await apiRequest("POST", "/api/upload-image", { file: dataUrl, folder: "destinations" });
      return await res.json();
    },
    onSuccess: (data) => {
      form.setValue("imageUrl", data.url, { shouldValidate: true });
      setIsUploadingImage(false);
      toast({
        title: "Image uploaded",
        description: "The image has been uploaded successfully.",
      });
    },
    onError: (error: Error) => {
      setIsUploadingImage(false);
      toast({
        title: "Image upload failed",
        description: error.message || "An error occurred while uploading the image.",
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (dataUrl: string) => {
    setImageDataUrl(dataUrl);
    if (dataUrl) {
      setIsUploadingImage(true);
      uploadImageMutation.mutate(dataUrl);
    } else {
      form.setValue("imageUrl", "", { shouldValidate: true });
    }
  };

  const handleSubmit = (data: DestinationFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Paris" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. France" {...field} />
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
                      placeholder="Describe this destination..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <ImageUpload
                        onImageSelect={handleImageSelect}
                        previewUrl={field.value || initialData?.imageUrl}
                        isUploading={isUploadingImage}
                      />
                      {field.value && !imageDataUrl && (
                        <Input
                          placeholder="Image URL"
                          {...field}
                          className="mt-2"
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <FormLabel className="font-normal">
                        Feature this destination on homepage
                      </FormLabel>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || isUploadingImage}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Destination"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}