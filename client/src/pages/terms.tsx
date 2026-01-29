import { HamburgerNav } from "@/components/hamburger-nav";
import { useSEO } from "@/hooks/use-seo";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

interface TermsData {
  title: string;
  content: string;
  version: string;
  lastUpdated: string;
}

export default function TermsAndConditions() {
  const [, setLocation] = useLocation();
  const [termsData, setTermsData] = useState<TermsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useSEO({
    title: "Terms & Conditions - Rev Winner | Legal Terms & Policies",
    description: "Read Rev Winner's terms and conditions, privacy policy, refund policy, and fair use guidelines. Understand your rights and responsibilities when using our AI sales assistant platform.",
  });

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await fetch("/api/terms");
        if (response.ok) {
          const data = await response.json();
          setTermsData(data);
        } else {
          setError("Failed to load terms and conditions");
        }
      } catch (err) {
        console.error("Error fetching terms:", err);
        setError("Failed to load terms and conditions");
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error || !termsData) {
      return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-8">
            Rev Winner – Terms & Conditions
          </h1>
          <p className="text-red-600">
            {error || "Terms and conditions are currently unavailable. Please try again later."}
          </p>
        </div>
      );
    }

    return (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-8">
          {termsData.title}
        </h1>
        
        <div className="whitespace-pre-wrap">
          {termsData.content}
        </div>

        <hr className="my-8 border-border" />

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Version {termsData.version} • Last updated: {new Date(termsData.lastUpdated).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <HamburgerNav currentPath="/terms" />

      {/* Main Content */}
      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sm:p-8 lg:p-12 shadow-xl">
          {renderContent()}
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
