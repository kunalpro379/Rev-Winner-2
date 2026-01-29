import { HamburgerNav } from "@/components/hamburger-nav";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "wouter";

export default function CancellationRefundPolicy() {
  useSEO({
    title: "Cancellation & Refund Policy - Rev Winner | Fair & Transparent",
    description: "Rev Winner's cancellation and refund policy. Understand our 3-session free trial, subscription cancellation process, and refund eligibility criteria.",
    ogUrl: "https://revwinner.com/cancellation-and-refund-policy"
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <HamburgerNav currentPath="/cancellation-and-refund-policy" />

      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sm:p-8 lg:p-12 shadow-xl">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-8">
              Cancellation & Refund Policy
            </h1>
            
            <p className="text-muted-foreground mb-8">
              <strong>Last Updated:</strong> December 12, 2024
            </p>

            <p>
              At Rev Winner, we strive to provide a transparent and fair cancellation and refund policy. Please read the following terms carefully before subscribing to our services.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">1. Free Trial</h2>
            <p>
              Rev Winner provides a <strong>3-session free trial</strong> for new users to evaluate our AI-powered sales assistant platform. During the trial period:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access to core features with session limitations</li>
              <li>No payment information required to start</li>
              <li>Full access to help documentation and support</li>
              <li>No automatic charges at trial end</li>
            </ul>
            <p className="mt-4 font-semibold text-primary">
              We encourage all users to fully utilize the free trial before purchasing a subscription.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">2. Subscription Cancellation</h2>
            
            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">2.1 How to Cancel</h3>
            <p>Users may cancel their subscription at any time through:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Dashboard:</strong> Navigate to Settings &gt; Manage Subscription &gt; Cancel Subscription</li>
              <li><strong>Email Request:</strong> Send a cancellation request to <a href="mailto:support@revwinner.com" className="text-primary hover:underline">support@revwinner.com</a></li>
              <li><strong>Support Contact:</strong> Contact our support team for assistance</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">2.2 Cancellation Terms</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cancellation takes effect at the end of your current billing cycle</li>
              <li>You retain full access to the platform until your subscription period ends</li>
              <li>No further charges will be applied after cancellation</li>
              <li>Cancellation does not automatically initiate a refund</li>
              <li>You can reactivate your subscription at any time</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">2.3 Data After Cancellation</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your account data is retained for 30 days after cancellation</li>
              <li>Meeting minutes and saved documents can be exported before cancellation</li>
              <li>After 30 days, your data may be permanently deleted</li>
              <li>You can request immediate data deletion by contacting support</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">3. Refund Policy</h2>
            
            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">3.1 General Policy</h3>
            <p>
              Since Rev Winner offers a free trial, <strong>no refunds will be issued after subscription activation</strong>, except in specific circumstances outlined below.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">3.2 Eligible Refund Scenarios</h3>
            <p>Refunds may be considered in the following cases:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Duplicate Payment:</strong> If you were charged multiple times for the same subscription period</li>
              <li><strong>Technical Billing Error:</strong> System errors causing incorrect charges on our end</li>
              <li><strong>Unused Service:</strong> Subscription purchased but service not used at all, with refund request submitted within 7 days of payment</li>
              <li><strong>Service Unavailability:</strong> Extended platform downtime (over 48 hours) preventing use of paid features</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">3.3 Non-Refundable Scenarios</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Partial month/period usage after cancellation</li>
              <li>Dissatisfaction after using the service beyond the trial period</li>
              <li>Failure to cancel before the next billing cycle</li>
              <li>Changes in personal circumstances or business needs</li>
              <li>Add-on purchases (Session Minutes, AI Tokens) already consumed</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">3.4 Refund Process</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Submit a refund request to <a href="mailto:billing@revwinner.com" className="text-primary hover:underline">billing@revwinner.com</a></li>
              <li>Include your account email, transaction ID, and reason for refund</li>
              <li>Our team will review your request within 3-5 business days</li>
              <li>If approved, refunds are processed within 7-14 business days</li>
              <li>Refunds are credited to the original payment method</li>
            </ol>

            <p className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <strong>Note:</strong> Refund eligibility is at the sole discretion of Rev Winner management. We reserve the right to refuse refund requests that do not meet the criteria above.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">4. Enterprise & Team Licenses</h2>
            <p>For enterprise and team license purchases:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Team license cancellations must be initiated by the License Manager</li>
              <li>Unused licenses within a package are non-refundable</li>
              <li>License transfers within the organization are permitted</li>
              <li>Custom enterprise agreements may have separate terms</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">5. Promotional & Discounted Purchases</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Purchases made with promotional codes or special discounts follow the same refund policy</li>
              <li>Refund amounts for discounted purchases are based on the actual amount paid</li>
              <li>Promotional credits or bonuses are non-refundable</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">6. Contact Us</h2>
            <p>For questions about cancellation or refunds, please contact us:</p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>Billing Inquiries:</strong> <a href="mailto:billing@revwinner.com" className="text-primary hover:underline">billing@revwinner.com</a></li>
              <li><strong>General Support:</strong> <a href="mailto:support@revwinner.com" className="text-primary hover:underline">support@revwinner.com</a></li>
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
                By subscribing to Rev Winner, you acknowledge that you have read, understood, and agree to this Cancellation & Refund Policy.
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <Link href="/terms" className="text-primary hover:underline text-sm">
                  Terms & Conditions
                </Link>
                <Link href="/privacy-policy" className="text-primary hover:underline text-sm">
                  Privacy Policy
                </Link>
                <Link href="/shipping-policy" className="text-primary hover:underline text-sm">
                  Shipping Policy
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
