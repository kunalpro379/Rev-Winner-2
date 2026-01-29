import { HamburgerNav } from "@/components/hamburger-nav";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  useSEO({
    title: "Privacy Policy - Rev Winner | Data Protection & Security",
    description: "Read Rev Winner's privacy policy. Learn how we collect, use, and protect your data. Your privacy is our priority - we never sell your data to third parties.",
    ogUrl: "https://revwinner.com/privacy-policy"
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <HamburgerNav currentPath="/privacy-policy" />

      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sm:p-8 lg:p-12 shadow-xl">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-8">
              Privacy Policy
            </h1>
            
            <p className="text-muted-foreground mb-8">
              <strong>Last Updated:</strong> December 12, 2024
            </p>

            <p>
              Rev Winner ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered sales assistant platform.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">1.1 Personal Information</h3>
            <p>When you register for an account or use our services, we may collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Contact Information:</strong> Name, email address, phone number, and company name</li>
              <li><strong>Account Credentials:</strong> Username and encrypted password</li>
              <li><strong>Billing Information:</strong> Payment details processed securely through our payment partners (Cashfree/Razorpay)</li>
              <li><strong>Profile Information:</strong> Job title, industry, and preferences you provide</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">1.2 Usage Data</h3>
            <p>We automatically collect certain information when you use our platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Session Data:</strong> Login times, session duration, and feature usage</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
              <li><strong>Log Data:</strong> IP address, access times, and pages viewed</li>
              <li><strong>AI Usage Metrics:</strong> Token usage for AI features (for billing and service improvement)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">1.3 Conversation Data</h3>
            <p>During your sales calls and sessions:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Transcripts:</strong> Real-time transcriptions are processed temporarily and not stored permanently unless you explicitly save meeting minutes</li>
              <li><strong>Meeting Minutes:</strong> Saved summaries are stored in your account and can be deleted at any time</li>
              <li><strong>Audio Recordings:</strong> If enabled, recordings are retained for 7 days then automatically deleted</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Delivery:</strong> To provide, operate, and maintain our AI sales assistant platform</li>
              <li><strong>Account Management:</strong> To create and manage your account, process subscriptions, and handle billing</li>
              <li><strong>Communication:</strong> To send service updates, security alerts, and support messages</li>
              <li><strong>Product Improvement:</strong> To analyze usage patterns and improve our features</li>
              <li><strong>Customer Support:</strong> To respond to your inquiries and resolve issues</li>
              <li><strong>Security:</strong> To detect, prevent, and address fraud, unauthorized access, or technical issues</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">3. Data Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">3.1 We Do Not Sell Your Data</h3>
            <p className="font-semibold text-primary">
              Rev Winner does not sell, rent, or trade your personal information to third parties for marketing purposes.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">3.2 Service Providers</h3>
            <p>We may share information with trusted third-party service providers who assist us in:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Payment Processing:</strong> Cashfree and Razorpay for secure payment handling</li>
              <li><strong>AI Services:</strong> OpenAI, Anthropic, Google, DeepSeek, X.AI, and Moonshot for AI-powered features</li>
              <li><strong>Speech Recognition:</strong> Deepgram for real-time transcription</li>
              <li><strong>Email Delivery:</strong> For transactional emails and notifications</li>
              <li><strong>Cloud Infrastructure:</strong> For hosting and data storage</li>
            </ul>
            <p className="mt-4">
              These providers are contractually obligated to protect your data and use it only for the services they provide to us.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">3.3 Legal Requirements</h3>
            <p>We may disclose your information if required by law or in response to valid legal requests from public authorities.</p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Encryption:</strong> All data is encrypted in transit (TLS/SSL) and at rest</li>
              <li><strong>Password Security:</strong> Passwords are hashed using bcrypt with salt</li>
              <li><strong>API Key Protection:</strong> Your AI provider API keys are encrypted before storage</li>
              <li><strong>Access Controls:</strong> Role-based access with single-device session enforcement</li>
              <li><strong>Audit Logging:</strong> Comprehensive logging of security-relevant activities</li>
              <li><strong>Regular Security Reviews:</strong> Periodic security assessments and updates</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">5. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Data:</strong> Retained while your account is active and for 30 days after deletion request</li>
              <li><strong>Session Transcripts:</strong> Temporary, not stored unless saved as meeting minutes</li>
              <li><strong>Meeting Minutes:</strong> Retained until you delete them or close your account</li>
              <li><strong>Call Recordings:</strong> Automatically deleted after 7 days</li>
              <li><strong>Usage Logs:</strong> Retained for 90 days for analytics and billing purposes</li>
              <li><strong>Backup Data:</strong> Retained for disaster recovery purposes up to 30 days</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">6. Your Rights and Choices</h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Export:</strong> Request a portable copy of your data</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Consent Withdrawal:</strong> Withdraw consent for optional data processing</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at <a href="mailto:privacy@revwinner.com" className="text-primary hover:underline">privacy@revwinner.com</a>.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">7. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for platform functionality (authentication, security)</li>
              <li><strong>Analytics Cookies:</strong> To understand how users interact with our platform (with consent)</li>
              <li><strong>Preference Cookies:</strong> To remember your settings (theme, language)</li>
            </ul>
            <p className="mt-4">
              You can manage cookie preferences through our cookie banner or your browser settings.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">8. Third-Party AI Services</h2>
            <p>Our platform integrates with third-party AI providers. When using these features:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Conversation context is sent to the selected AI provider for processing</li>
              <li>AI providers have their own privacy policies governing data handling</li>
              <li>We do not use your data to train AI models</li>
              <li>You can choose which AI provider to use based on your privacy preferences</li>
            </ul>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">9. Children's Privacy</h2>
            <p>
              Rev Winner is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will delete it promptly.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">10. International Data Transfers</h2>
            <p>
              Your data may be processed in countries other than your own. We ensure appropriate safeguards are in place when transferring data internationally, including standard contractual clauses and ensuring our service providers maintain adequate data protection standards.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. Continued use of the platform after changes constitutes acceptance of the updated policy.
            </p>

            <hr className="my-8 border-border" />

            <h2 className="text-2xl font-bold text-foreground mb-4">12. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>Email:</strong> <a href="mailto:privacy@revwinner.com" className="text-primary hover:underline">privacy@revwinner.com</a></li>
              <li><strong>Support:</strong> <a href="mailto:support@revwinner.com" className="text-primary hover:underline">support@revwinner.com</a></li>
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
                By using Rev Winner, you acknowledge that you have read and understood this Privacy Policy and agree to the collection and use of your information as described herein.
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <Link href="/terms" className="text-primary hover:underline text-sm">
                  Terms & Conditions
                </Link>
                <Link href="/contact" className="text-primary hover:underline text-sm">
                  Contact Us
                </Link>
                <Link href="/help" className="text-primary hover:underline text-sm">
                  Help Center
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
