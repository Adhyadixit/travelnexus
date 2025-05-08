import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email is required",
        description: "Please enter your email address to subscribe."
      });
      return;
    }
    
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulating API call
    setTimeout(() => {
      toast({
        title: "Subscription successful!",
        description: "Thank you for subscribing to our newsletter."
      });
      setEmail('');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <section className="py-10 bg-primary text-neutral-800">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
        <p className="text-neutral-700 mb-6 max-w-xl mx-auto">
          Get exclusive travel deals, insider tips, and updates on our latest offers delivered straight to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col md:flex-row gap-3">
          <Input
            type="email"
            placeholder="Your email address"
            className="px-4 py-3 rounded-lg w-full text-neutral-800 focus:outline-none focus:ring-2 focus:ring-secondary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
          <Button 
            type="submit" 
            className="px-6 py-3 bg-secondary text-neutral-800 font-medium rounded-lg hover:bg-secondary-dark transition-colors whitespace-nowrap"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </form>
      </div>
    </section>
  );
}
