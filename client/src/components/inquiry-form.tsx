import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Loader2 } from "lucide-react";

// Form schema for inquiry
const inquiryFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(7, { message: "Please enter a valid phone number" }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
});

type InquiryFormValues = z.infer<typeof inquiryFormSchema>;

interface InquiryFormProps {
  // Optional props to pre-fill fields
  defaultSubject?: string;
  productName?: string;
  triggerButtonText?: string;
  triggerButtonFullWidth?: boolean;
  onInquirySubmitted?: (conversationId: number) => void;
}

export function InquiryForm({
  defaultSubject = "",
  productName = "",
  triggerButtonText = "Inquire Now",
  triggerButtonFullWidth = false,
  onInquirySubmitted,
}: InquiryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Create form with zod validation
  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: productName ? `Inquiry about ${productName}` : defaultSubject,
      message: "",
    },
  });

  // Send message mutation
  const inquiryMutation = useMutation({
    mutationFn: async (data: InquiryFormValues) => {
      const response = await apiRequest("POST", "/api/conversations", {
        guestName: data.name,
        guestEmail: data.email,
        guestPhone: data.phone,
        subject: data.subject,
        message: data.message,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Inquiry Sent",
        description: "We've received your inquiry and will get back to you soon.",
      });
      form.reset();
      setIsOpen(false);
      
      // If a callback was provided, call it with the conversation ID
      if (onInquirySubmitted && data && data.id) {
        onInquirySubmitted(data.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to send inquiry: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: InquiryFormValues) {
    inquiryMutation.mutate(data);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          className={triggerButtonFullWidth ? "w-full" : ""}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {triggerButtonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact Us</DialogTitle>
          <DialogDescription>
            Fill out the form below and our team will get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="What is this regarding?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Your message" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={inquiryMutation.isPending}
                className="w-full"
              >
                {inquiryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}