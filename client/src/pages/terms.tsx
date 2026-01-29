import { HamburgerNav } from "@/components/hamburger-nav";
import { useSEO } from "@/hooks/use-seo";
import { useLocation } from "wouter";

export default function TermsAndConditions() {
  const [, setLocation] = useLocation();
  
  useSEO({
    title: "Terms & Conditions - Rev Winner | Legal Terms & Policies",
    description: "Read Rev Winner's terms and conditions, privacy policy, refund policy, and fair use guidelines. Understand your rights and responsibilities when using our AI sales assistant platform.",
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <HamburgerNav currentPath="/terms" />

      {/* Main Content */}
      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sm:p-8 lg:p-12 shadow-xl">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-8">
              Rev Winner – Terms & Conditions
            </h1>

            <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
            <p>
              Welcome to Rev Winner ("Platform", "Service"). By accessing or using this Platform, you agree to be bound by these Terms & Conditions.
            </p>
            <p>
              Rev Winner is a SaaS-based sales intelligence and productivity tool. The platform provides AI-powered assistance, meeting intelligence, and real-time sales enablement features.
            </p>
            <p className="font-semibold">
              If you do not agree with these terms, please do not use the platform.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">2. Eligibility</h2>
            <p>
              Users must be at least 18 years of age to use this platform and must provide accurate registration information.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">3. Account & Access</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Users are responsible for maintaining confidentiality of login credentials.</li>
              <li>Sharing accounts or unauthorized access is strictly prohibited.</li>
              <li>Rev Winner reserves the right to suspend accounts for suspicious activity or policy violations.</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">4. Subscription & Payment</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All paid plans require advance payment.</li>
              <li>Subscription will auto-renew unless canceled by the user.</li>
              <li>Prices are subject to change with prior notice.</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">5. Cancellation Policy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Users may cancel their subscription anytime from the account dashboard or by contacting <a href="mailto:support@revwinner.com" className="text-primary hover:underline">support@revwinner.com</a>.</li>
              <li>Once canceled, access will remain active till the end of the billing cycle.</li>
              <li>Cancellation does not automatically initiate a refund unless eligible under refund terms.</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">6. Refund Policy</h2>
            <p>Rev Winner provides a 3-session free trial.</p>
            <p>No refunds will be issued after subscription activation, except in cases of:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Duplicate payment charged</li>
              <li>Technical billing error by Rev Winner</li>
              <li>Subscription purchased but service not used at all and request submitted within 7 days</li>
            </ul>
            <p className="mt-4">
              Refund eligibility is at the discretion of Rev Winner management.
            </p>
            <p>
              Refunds, if approved, will be processed within 7-14 business days back to the original payment method.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">7. Privacy Policy</h2>
            <p>Rev Winner values user privacy and follows industry-standard security practices.</p>
            
            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Data We Collect</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name, Email, Contact details (provided by user)</li>
              <li>Usage logs for product improvement & billing</li>
              <li>AI interaction logs only for usage metering, not stored for training or sale</li>
              <li>We do not store meeting audio or conversation content unless explicitly enabled by the user</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">How We Use Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Authentication & user verification</li>
              <li>Billing and usage analytics</li>
              <li>Enhancing product performance</li>
              <li>Customer support and security monitoring</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Data Security</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encrypted storage and secure access policies are enforced.</li>
              <li>Users may request data export or deletion (subject to account validation).</li>
            </ul>
            <p className="mt-4 font-semibold">
              We do not sell user data to third parties.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">8. Shipping / Delivery Policy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Rev Winner is a cloud-based digital product.</li>
              <li>No physical shipping required.</li>
              <li>Access is delivered instantly upon successful sign-up.</li>
              <li>Support and feature updates are delivered online.</li>
            </ul>
            <p className="mt-4">
              If you face access issues after payment, contact: <a href="mailto:support@revwinner.com" className="text-primary hover:underline">support@revwinner.com</a>
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">9. Intellectual Property</h2>
            <p>
              All platform content, branding, code, and assets belong to Rev Winner. Users may not reverse engineer, copy, or resell the platform.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">10. Fair Use & Restrictions</h2>
            <p>Users must not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the platform for illegal or unethical activity</li>
              <li>Attempt to extract, clone, or misuse AI models</li>
              <li>Share proprietary platform outputs commercially without consent</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">11. Disclaimer & Limitation of Liability</h2>
            <p>
              Rev Winner is a productivity tool. It does not guarantee revenue results or business outcomes.
            </p>
            <p>
              The service is provided "as-is" without warranty.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">12. Product Maturity, Accuracy & Experimental Features</h2>
            <p>
              Rev Winner is an evolving AI-powered platform. While several core features are stable and production-ready, certain features are currently in an experimental or early-stage release phase and may continue to improve over time.
            </p>
            <p>
              Due to the nature of artificial intelligence and machine-learning systems, outputs generated by Rev Winner may occasionally contain inaccuracies, incomplete information, or unexpected behavior. Accuracy, performance, and reliability may vary based on usage, data inputs, configurations, and ongoing model improvements.
            </p>
            <p className="font-semibold mt-4">
              By signing up for and using Rev Winner, you acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Some features may be in beta, experimental, or under active development</li>
              <li>Feature behavior, accuracy levels, and performance may evolve over time</li>
              <li>Temporary limitations, inaccuracies, or changes may occur as the platform continues to mature</li>
              <li>Rev Winner does not guarantee absolute accuracy or uninterrupted availability at all times</li>
            </ul>
            <p className="mt-4">
              Rev Winner is continuously working to enhance platform stability, accuracy, and feature reliability. Updates, improvements, and refinements will be rolled out periodically without prior notice as part of ongoing development.
            </p>
            <p className="font-semibold mt-4">
              By proceeding with registration and usage of the platform, you confirm that you understand and accept the current state of the product and agree to use it accordingly.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">13. Updates to Terms</h2>
            <p>
              Rev Winner may update these terms periodically. Continued use indicates acceptance of updates.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">14. Contact Information</h2>
            <p>For support or policy inquiries:</p>
            <ul className="list-none space-y-2 mt-4">
              <li>📧 <a href="mailto:support@revwinner.com" className="text-primary hover:underline">support@revwinner.com</a></li>
            </ul>

            <hr className="my-8 border-border" />

            <div className="mt-12 pt-8 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Last updated: January 2025
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-200/50 dark:border-purple-500/20 bg-white/30 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => setLocation('/')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-home">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => setLocation('/blog')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-blog">
                    Blog
                  </button>
                </li>
                <li>
                  <button onClick={() => setLocation('/contact')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-contact">
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => setLocation('/ai-sales-assistant')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-app">
                    Rev Winner App
                  </button>
                </li>
                <li>
                  <button onClick={() => setLocation('/subscribe')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-pricing">
                    Pricing
                  </button>
                </li>
                <li>
                  <button onClick={() => setLocation('/register')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-trial">
                    Start Free Trial
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => setLocation('/terms')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-terms">
                    Terms & Conditions
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-sitemap">
                    Sitemap
                  </a>
                </li>
                <li>
                  <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" data-testid="footer-link-robots">
                    Robots.txt
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-purple-200/50 dark:border-purple-500/20 pt-8 text-center text-slate-600 dark:text-slate-400">
            <p>© 2025 Rev Winner. All rights reserved.</p>
            <p className="text-sm mt-2">A Product from Healthcaa Technologies</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
