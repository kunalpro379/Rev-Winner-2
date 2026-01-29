import { HamburgerNav } from "@/components/hamburger-nav";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "wouter";

export default function ShippingPolicy() {
  useSEO({
    title: "Shipping & Delivery Policy - Rev Winner | Digital Product Access",
    description: "Rev Winner's shipping and delivery policy for our cloud-based SaaS platform. Instant access upon subscription with no physical shipping required.",
    ogUrl: "https://revwinner.com/shipping-policy"
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <HamburgerNav currentPath="/shipping-policy" />

      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sm:p-8 lg:p-12 shadow-xl">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-8">
              Shipping & Delivery Policy
            </h1>
            
            <p className="text-muted-foreground mb-8">
              <strong>Last Updated:</strong> December 12, 2024
            </p>

            <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg mb-8">
              <p className="text-lg font-medium text-foreground">
                Rev Winner is a 100% cloud-based Software-as-a-Service (SaaS) platform. All services are delivered digitally with no physical shipping involved.
              </p>
            </div>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">1. Digital Product Delivery</h2>
            <p>
              Rev Winner is a cloud-based AI-powered sales assistant platform. As a digital product:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>No Physical Shipping:</strong> There are no physical products to ship</li>
              <li><strong>Instant Access:</strong> Services are delivered immediately upon successful registration and payment</li>
              <li><strong>Online Delivery:</strong> All features, updates, and support are provided online</li>
              <li><strong>Global Availability:</strong> Access from anywhere with an internet connection</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">2. Service Activation</h2>
            
            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">2.1 Free Trial</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Instant activation upon email verification</li>
              <li>3 free sessions to explore the platform</li>
              <li>No payment required for trial access</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">2.2 Paid Subscriptions</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Instant activation upon successful payment confirmation</li>
              <li>Access credentials delivered to your registered email</li>
              <li>Subscription details visible in your account dashboard</li>
              <li>Payment confirmation sent via email within minutes</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">2.3 Add-on Purchases</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Session Minutes:</strong> Credits added instantly to your account</li>
              <li><strong>AI Tokens:</strong> Token balance updated immediately after payment</li>
              <li><strong>Additional Features:</strong> Unlocked within seconds of purchase</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">3. Delivery Timeline</h2>
            <table className="w-full border-collapse border border-border mt-4">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-4 py-2 text-left">Service Type</th>
                  <th className="border border-border px-4 py-2 text-left">Delivery Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-4 py-2">Free Trial Registration</td>
                  <td className="border border-border px-4 py-2">Instant (upon email verification)</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">Monthly/Annual Subscription</td>
                  <td className="border border-border px-4 py-2">Instant (upon payment confirmation)</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">Add-on Purchases</td>
                  <td className="border border-border px-4 py-2">Instant</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">Enterprise/Team Licenses</td>
                  <td className="border border-border px-4 py-2">Within 24 hours of payment confirmation</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">Platform Updates</td>
                  <td className="border border-border px-4 py-2">Automatic (no action required)</td>
                </tr>
              </tbody>
            </table>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">4. Access Requirements</h2>
            <p>To access Rev Winner services, you need:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Internet Connection:</strong> Stable broadband connection recommended</li>
              <li><strong>Web Browser:</strong> Latest version of Chrome, Firefox, Safari, or Edge</li>
              <li><strong>Email Access:</strong> For account verification and notifications</li>
              <li><strong>Microphone:</strong> For voice transcription features (optional)</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">5. Delivery Confirmation</h2>
            <p>Upon successful registration or purchase, you will receive:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email confirmation with access details</li>
              <li>Receipt/Invoice for paid purchases</li>
              <li>In-app notification confirming your subscription status</li>
              <li>Welcome email with getting started guide</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">6. Access Issues</h2>
            <p>
              If you experience any issues accessing the platform after payment, please contact our support team immediately:
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>Email:</strong> <a href="mailto:support@revwinner.com" className="text-primary hover:underline">support@revwinner.com</a></li>
              <li><strong>Phone (India):</strong> +91 8130276382</li>
              <li><strong>Phone (US):</strong> +1 832-632-8555</li>
            </ul>
            <p className="mt-4">
              Our support team typically responds within 2-4 business hours during working days.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">7. Service Availability</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Rev Winner is available 24/7 with 99.9% uptime target</li>
              <li>Scheduled maintenance windows are communicated in advance via email</li>
              <li>Emergency maintenance may occur without prior notice for security updates</li>
              <li>Service status updates available at the platform dashboard</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">8. Contact Information</h2>
            <p>For any delivery or access-related questions:</p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>Support Email:</strong> <a href="mailto:support@revwinner.com" className="text-primary hover:underline">support@revwinner.com</a></li>
              <li><strong>Billing Email:</strong> <a href="mailto:billing@revwinner.com" className="text-primary hover:underline">billing@revwinner.com</a></li>
              <li><strong>Phone (India):</strong> +91 8130276382</li>
              <li><strong>Phone (US):</strong> +1 832-632-8555</li>
            </ul>
            <p className="mt-6">
              <strong>Rev Winner</strong><br />
              Healthcaa Technologies Private Limited<br />
              Lucknow, Uttar Pradesh, India
            </p>

            <hr className="my-8 border-border" />

            <div className="mt-8 p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                By using Rev Winner, you acknowledge that this is a digital service with no physical delivery component.
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <Link href="/terms" className="text-primary hover:underline text-sm">
                  Terms & Conditions
                </Link>
                <Link href="/privacy-policy" className="text-primary hover:underline text-sm">
                  Privacy Policy
                </Link>
                <Link href="/cancellation-and-refund-policy" className="text-primary hover:underline text-sm">
                  Cancellation & Refund Policy
                </Link>
                <Link href="/contact" className="text-primary hover:underline text-sm">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
