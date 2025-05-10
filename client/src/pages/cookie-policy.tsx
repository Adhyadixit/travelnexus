import { DesktopLayout } from "@/components/layout/desktop-layout";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Helmet } from "react-helmet";

export default function CookiePolicyPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  
  return (
    <Layout>
      <Helmet>
        <title>Cookie Policy | Travel Ease by Expedia</title>
        <meta 
          name="description" 
          content="Learn about how Travel Ease by Expedia uses cookies and similar technologies to enhance your browsing experience. Review our cookie policy." 
        />
      </Helmet>
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
        <p className="text-muted-foreground mb-4">Last Updated: May 10, 2025</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-4">
            Travel Ease by Expedia ("we," "our," or "us") uses cookies and similar technologies on our website and mobile 
            applications (collectively, our "Services"). This Cookie Policy explains how we use cookies, what types of cookies 
            we use, and how you can control cookies through your browser settings and other tools.
          </p>
          <p className="mb-4">
            By using our Services, you consent to our use of cookies in accordance with this Cookie Policy. If you do not 
            accept our use of cookies, please disable them following the instructions in this Cookie Policy.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. What Are Cookies?</h2>
          <p className="mb-4">
            Cookies are small text files that are stored on your computer or mobile device when you visit a website. They 
            are widely used to make websites work more efficiently and provide information to the website owners. Cookies 
            can be "persistent" or "session" cookies. Persistent cookies remain on your device after you close your browser, 
            while session cookies are deleted when you close your browser.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Cookies</h2>
          <p className="mb-4">We use cookies for several purposes, including:</p>
          <ul className="list-disc pl-8 mb-4">
            <li className="mb-3">
              <strong>Essential Cookies:</strong> These cookies are necessary for our Services to function properly and cannot be switched off. 
              They are usually set in response to actions you take, such as setting your privacy preferences, logging in, 
              or filling in forms. You can set your browser to block these cookies, but some parts of our Services may not 
              function properly.
            </li>
            <li className="mb-3">
              <strong>Performance Cookies:</strong> These cookies allow us to count visits and traffic sources so we can measure and 
              improve the performance of our Services. They help us know which pages are the most and least popular and 
              see how visitors move around our website. All information these cookies collect is aggregated.
            </li>
            <li className="mb-3">
              <strong>Functionality Cookies:</strong> These cookies enable our Services to provide enhanced functionality and personalization. 
              They may be set by us or by third-party providers whose services we have added to our pages. If you do not 
              allow these cookies, some or all of these features may not function properly.
            </li>
            <li className="mb-3">
              <strong>Targeting Cookies:</strong> These cookies may be set through our Services by our advertising partners. They may 
              be used by those companies to build a profile of your interests and show you relevant advertisements on other 
              websites. They do not directly store personal information but are based on uniquely identifying your browser 
              and internet device.
            </li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Types of Cookies We Use</h2>
          <h3 className="text-xl font-medium mb-3">4.1 First-Party Cookies</h3>
          <p className="mb-4">
            These are cookies that we set on our Services to enable features and functionality.
          </p>
          
          <h3 className="text-xl font-medium mb-3">4.2 Third-Party Cookies</h3>
          <p className="mb-4">
            These cookies are set by third parties on our Services, including:
          </p>
          <ul className="list-disc pl-8 mb-4">
            <li className="mb-2">Google Analytics: For analyzing website traffic and user behavior</li>
            <li className="mb-2">Social Media Platforms (Facebook, Twitter, Instagram): For social sharing functionality</li>
            <li className="mb-2">Advertising Partners: For delivering relevant advertisements</li>
            <li className="mb-2">Payment Processors: For facilitating secure transactions</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Similar Technologies</h2>
          <p className="mb-4">
            In addition to cookies, we may use other similar technologies on our Services, including:
          </p>
          <ul className="list-disc pl-8 mb-4">
            <li className="mb-3">
              <strong>Web Beacons:</strong> Small graphic files that allow us to monitor the use of our Services. A web beacon is typically 
              a transparent graphic image placed on a website or in an email.
            </li>
            <li className="mb-3">
              <strong>Pixels:</strong> Small blocks of code on webpages that allow websites to read and place cookies. The resulting 
              connection can include information such as a device's IP address, the time a person viewed the pixel, and the 
              type of browser being used.
            </li>
            <li className="mb-3">
              <strong>Local Storage:</strong> A storage mechanism similar to cookies but with a larger capacity and is stored on your device 
              rather than sent to the server with each request.
            </li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Managing Your Cookie Preferences</h2>
          <h3 className="text-xl font-medium mb-3">6.1 Browser Settings</h3>
          <p className="mb-4">
            Most web browsers allow you to control cookies through their settings preferences. To find out more about 
            cookies, including how to see what cookies have been set and how to manage and delete them, visit:
          </p>
          <ul className="list-disc pl-8 mb-4">
            <li className="mb-2">Chrome: <a href="https://support.google.com/chrome/answer/95647" className="text-primary hover:underline">https://support.google.com/chrome/answer/95647</a></li>
            <li className="mb-2">Firefox: <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-primary hover:underline">https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer</a></li>
            <li className="mb-2">Safari: <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-primary hover:underline">https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac</a></li>
            <li className="mb-2">Edge: <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-primary hover:underline">https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09</a></li>
          </ul>
          
          <h3 className="text-xl font-medium mb-3">6.2 Cookie Preference Tool</h3>
          <p className="mb-4">
            We provide a cookie preference tool on our website that allows you to customize your cookie preferences. 
            You can access this tool by clicking on "Cookie Preferences" in the footer of our website.
          </p>
          
          <h3 className="text-xl font-medium mb-3">6.3 Opt-Out of Specific Third-Party Cookies</h3>
          <p className="mb-4">
            You can opt-out of targeted advertising by visiting the following links:
          </p>
          <ul className="list-disc pl-8 mb-4">
            <li className="mb-2">Digital Advertising Alliance: <a href="http://www.aboutads.info/choices/" className="text-primary hover:underline">http://www.aboutads.info/choices/</a></li>
            <li className="mb-2">Network Advertising Initiative: <a href="http://www.networkadvertising.org/choices/" className="text-primary hover:underline">http://www.networkadvertising.org/choices/</a></li>
            <li className="mb-2">European Interactive Digital Advertising Alliance: <a href="http://www.youronlinechoices.eu/" className="text-primary hover:underline">http://www.youronlinechoices.eu/</a></li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Consequences of Disabling Cookies</h2>
          <p className="mb-4">
            If you disable or reject cookies, please note that some parts of our Services may become inaccessible or not 
            function properly. For example, you may not be able to log in, your preferences may not be saved, and you may 
            not be able to complete certain actions or transactions.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Changes to This Cookie Policy</h2>
          <p className="mb-4">
            We may update this Cookie Policy from time to time. The updated version will be indicated by an updated 
            "Last Updated" date. We encourage you to review this Cookie Policy periodically for any changes.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about our use of cookies, please contact us at:
          </p>
          <div className="mb-4">
            <p>Travel Ease by Expedia</p>
            <p>Email: cookies@travelease-expedia.com</p>
            <p>Address: 333 108th Avenue NE, Bellevue, WA 98004, USA</p>
          </div>
        </section>
      </div>
    </Layout>
  );
}