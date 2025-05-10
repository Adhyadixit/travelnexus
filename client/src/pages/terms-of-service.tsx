import { DesktopLayout } from "@/components/layout/desktop-layout";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Helmet } from "react-helmet";

export default function TermsOfServicePage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  
  return (
    <Layout>
      <Helmet>
        <title>Terms of Service | Travel Ease by Expedia</title>
        <meta 
          name="description" 
          content="Review the terms and conditions for using Travel Ease by Expedia's website and services. Our terms of service outline user rights and responsibilities." 
        />
      </Helmet>
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-4">Last Updated: May 10, 2025</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-4">
            Welcome to Travel Ease by Expedia. These Terms of Service ("Terms") govern your use of our website, 
            mobile applications, and services (collectively, the "Services") operated by Travel Ease by Expedia 
            ("we," "us," or "our"). By accessing or using our Services, you agree to be bound by these Terms. If 
            you disagree with any part of these Terms, you may not access our Services.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Definitions</h2>
          <ul className="list-disc pl-8 mb-4">
            <li className="mb-3"><strong>Account:</strong> Your registration and personal information and preferences you provide to us.</li>
            <li className="mb-3"><strong>Booking:</strong> A reservation of travel services through our Services.</li>
            <li className="mb-3"><strong>Content:</strong> Text, images, photos, audio, video, and all other forms of data or communication.</li>
            <li className="mb-3"><strong>Travel Supplier:</strong> The third-party provider of travel services, such as hotels, airlines, car rental agencies, or activity providers.</li>
            <li className="mb-3"><strong>User:</strong> An individual who uses our Services, including you.</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
          <p className="mb-4">
            To access certain features of our Services, you may be required to register for an account. You agree to 
            provide accurate, current, and complete information during the registration process and to update such 
            information to keep it accurate, current, and complete. You are responsible for safeguarding your account 
            credentials and for all activity that occurs under your account. You agree to notify us immediately of any 
            unauthorized access to or use of your account.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Bookings and Financial Terms</h2>
          <h3 className="text-xl font-medium mb-3">4.1 Travel Services</h3>
          <p className="mb-4">
            We provide a platform for you to search, compare, and book travel services offered by Travel Suppliers. The 
            booking constitutes a contractual agreement between you and the Travel Supplier. We act solely as an intermediary 
            and are not a party to this contractual relationship.
          </p>
          
          <h3 className="text-xl font-medium mb-3">4.2 Pricing and Payment</h3>
          <p className="mb-4">
            All prices displayed are subject to change until a booking is confirmed. Taxes and fees may apply to your 
            booking and are displayed during the booking process. Payment for bookings must be made with a valid payment 
            method. You agree to pay all charges at the prices in effect when the charges are incurred.
          </p>
          
          <h3 className="text-xl font-medium mb-3">4.3 Cancellations and Refunds</h3>
          <p className="mb-4">
            Cancellation and refund policies vary by Travel Supplier and are communicated during the booking process. 
            We are not responsible for any changes, cancellations, or refunds, which are subject to the Travel Supplier's 
            policies. In the event of canceled or altered travel plans, we will make reasonable efforts to secure a refund 
            from the Travel Supplier, but do not guarantee that one will be provided.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. User Conduct and Content</h2>
          <p className="mb-4">
            You agree not to use our Services for any purpose that is unlawful or prohibited by these Terms. You may not:
          </p>
          <ul className="list-disc pl-8 mb-4">
            <li className="mb-2">Use our Services in any manner that could disable, overburden, damage, or impair our Services</li>
            <li className="mb-2">Use any robot, spider, or other automatic device to access our Services</li>
            <li className="mb-2">Introduce any viruses, trojan horses, worms, logic bombs, or other harmful material</li>
            <li className="mb-2">Attempt to gain unauthorized access to our Services</li>
            <li className="mb-2">Post or transmit any content that is unlawful, fraudulent, or harmful</li>
            <li className="mb-2">Impersonate any person or entity or misrepresent your affiliation with a person or entity</li>
          </ul>
          <p className="mb-4">
            By posting content on our Services (such as reviews), you grant us a non-exclusive, worldwide, royalty-free 
            license to use, reproduce, adapt, publish, translate, and distribute such content in any media. You represent 
            and warrant that you own or have the necessary rights to post the content and that the content is accurate and 
            not misleading.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
          <p className="mb-4">
            Our Services and their content, features, and functionality are owned by us or our licensors and are protected 
            by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or 
            lease any part of our Services without our express written permission.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Disclaimers</h2>
          <p className="mb-4">
            Our Services are provided "as is" and "as available" without any warranties of any kind, either express or 
            implied. We do not guarantee that our Services will be uninterrupted, timely, secure, or error-free. We are 
            not responsible for the accuracy, reliability, or availability of information provided by Travel Suppliers 
            or other third parties.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
          <p className="mb-4">
            To the maximum extent permitted by law, in no event shall we be liable for any indirect, incidental, special, 
            consequential, or punitive damages, including without limitation, loss of profits, data, or goodwill, arising 
            out of or in connection with your access to or use of our Services, even if we have been advised of the 
            possibility of such damages.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
          <p className="mb-4">
            These Terms shall be governed by and construed in accordance with the laws of the State of Washington, USA, 
            without regard to its conflict of law provisions. Any legal action or proceeding arising out of or relating to 
            these Terms shall be brought exclusively in the courts located in King County, Washington.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Changes to These Terms</h2>
          <p className="mb-4">
            We may update these Terms from time to time. The updated Terms will be indicated by an updated "Last Updated" 
            date. We encourage you to review these Terms periodically for any changes. Your continued use of our Services 
            following the posting of revised Terms means that you accept and agree to the changes.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about these Terms, please contact us at:
          </p>
          <div className="mb-4">
            <p>Travel Ease by Expedia</p>
            <p>Email: terms@travelease-expedia.com</p>
            <p>Address: 333 108th Avenue NE, Bellevue, WA 98004, USA</p>
          </div>
        </section>
      </div>
    </Layout>
  );
}