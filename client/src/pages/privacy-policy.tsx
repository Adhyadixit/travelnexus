import { DesktopLayout } from "@/components/layout/desktop-layout";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Helmet } from "react-helmet";

export default function PrivacyPolicyPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  
  return (
    <Layout>
      <Helmet>
        <title>Privacy Policy | Travel Ease by Expedia</title>
        <meta 
          name="description" 
          content="Learn how Travel Ease by Expedia collects, uses, and protects your personal information. Read our detailed privacy policy." 
        />
      </Helmet>
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-4">Last Updated: May 10, 2025</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-4">
            Welcome to Travel Ease by Expedia ("we," "our," or "us"). We respect your privacy and are committed to 
            protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard 
            your information when you visit our website or use our services.
          </p>
          <p className="mb-4">
            Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, 
            please do not access our website or use our services.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <h3 className="text-xl font-medium mb-3">2.1 Personal Information</h3>
          <p className="mb-4">
            We may collect personal information that you voluntarily provide to us when you register on our website, 
            express interest in obtaining information about us or our products and services, participate in activities 
            on our website, or otherwise contact us. The personal information we collect may include:
          </p>
          <ul className="list-disc pl-8 mb-4">
            <li>Name, email address, and contact details</li>
            <li>Billing information and payment details</li>
            <li>Travel preferences and travel history</li>
            <li>Account login credentials</li>
            <li>Content of communications with us</li>
            <li>Social media profile information (if you choose to connect with us through social media)</li>
          </ul>
          
          <h3 className="text-xl font-medium mb-3">2.2 Information Automatically Collected</h3>
          <p className="mb-4">
            When you visit our website, we may automatically collect certain information about your device, including 
            information about your web browser, IP address, time zone, and some of the cookies that are installed on 
            your device. Additionally, as you browse our website, we may collect information about the individual web 
            pages that you view, what websites or search terms referred you to our website, and information about how 
            you interact with the website.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="mb-4">We may use the information we collect for various purposes, including to:</p>
          <ul className="list-disc pl-8 mb-4">
            <li>Provide, operate, and maintain our website and services</li>
            <li>Process and complete transactions, and send related information including confirmations and receipts</li>
            <li>Manage user accounts, respond to comments, questions, and provide customer service</li>
            <li>Send administrative information, such as updates, security alerts, and support messages</li>
            <li>Personalize your experience and deliver content relevant to your interests</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our website</li>
            <li>Conduct research and develop new products and services</li>
            <li>Improve our website, marketing, and customer relationships</li>
            <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Sharing of Information</h2>
          <p className="mb-4">
            We may share your information with third parties in the following situations:
          </p>
          <ul className="list-disc pl-8 mb-4">
            <li>With service providers who perform services on our behalf</li>
            <li>With travel suppliers such as hotels, airlines, car rental companies, and activity providers to fulfill your bookings</li>
            <li>With affiliated companies within the Expedia Group family of companies</li>
            <li>To comply with legal obligations or respond to legal requests</li>
            <li>In connection with a business transaction such as a merger, acquisition, or sale of assets</li>
            <li>With your consent or at your direction</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
          <p className="mb-4">
            We have implemented appropriate technical and organizational security measures designed to protect the security 
            of any personal information we process. However, no security system is impenetrable and we cannot guarantee the 
            security of our systems 100%. In the event that any information under our control is compromised as a result of 
            a breach of security, we will take reasonable steps to investigate the situation and, where appropriate, notify 
            those individuals whose information may have been compromised.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Your Privacy Rights</h2>
          <p className="mb-4">
            Depending on your location, you may have certain rights regarding your personal information, such as:
          </p>
          <ul className="list-disc pl-8 mb-4">
            <li>Right to access personal information we hold about you</li>
            <li>Right to request correction of your personal information</li>
            <li>Right to request deletion of your personal information</li>
            <li>Right to object to processing of your personal information</li>
            <li>Right to data portability</li>
            <li>Right to withdraw consent</li>
          </ul>
          <p className="mb-4">
            To exercise these rights, please contact us at privacy@travelease-expedia.com.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Changes to This Privacy Policy</h2>
          <p className="mb-4">
            We may update this privacy policy from time to time. The updated version will be indicated by an updated 
            "Last Updated" date. We encourage you to review this privacy policy frequently to be informed of how we are 
            protecting your information.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
          <p className="mb-4">
            If you have questions or comments about this privacy policy, please contact us at:
          </p>
          <div className="mb-4">
            <p>Travel Ease by Expedia</p>
            <p>Email: privacy@travelease-expedia.com</p>
            <p>Address: 333 108th Avenue NE, Bellevue, WA 98004, USA</p>
          </div>
        </section>
      </div>
    </Layout>
  );
}