import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CookiePreferences } from "@/components/cookie-preferences";
import { Cookie } from "lucide-react";
import { triggerGtagInit } from "@/lib/gtag";

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const cookiePreferences = localStorage.getItem('cookie-preferences');
    if (!cookiePreferences) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookie-preferences', JSON.stringify({
      targeting: true,
      social: true,
      analytics: true,
      necessary: true
    }));
    setShowBanner(false);
    
    // Trigger Google Tag initialization if user accepted analytics/targeting
    triggerGtagInit();
  };

  const handleRejectAll = () => {
    localStorage.setItem('cookie-preferences', JSON.stringify({
      targeting: false,
      social: false,
      analytics: false,
      necessary: true
    }));
    setShowBanner(false);
  };

  const handleCustomize = () => {
    setShowPreferences(true);
    setShowBanner(false);
  };

  if (!showBanner) {
    return (
      <>
        {/* Floating Cookie Settings Button */}
        <button
          onClick={() => setShowPreferences(true)}
          className="fixed bottom-4 left-4 z-40 p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all"
          data-testid="button-open-cookie-settings"
          aria-label="Cookie Settings"
        >
          <Cookie className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </button>
        
        <CookiePreferences 
          open={showPreferences} 
          onOpenChange={setShowPreferences}
        />
      </>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-2xl p-6" data-testid="cookie-banner">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  We Value Your Privacy
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                  We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                onClick={handleRejectAll}
                variant="outline"
                className="w-full sm:w-auto"
                data-testid="button-reject-all"
              >
                Reject All
              </Button>
              <Button
                onClick={handleCustomize}
                variant="outline"
                className="w-full sm:w-auto"
                data-testid="button-customize-cookies"
              >
                Customize
              </Button>
              <Button
                onClick={handleAcceptAll}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-accept-all"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CookiePreferences 
        open={showPreferences} 
        onOpenChange={(open) => {
          setShowPreferences(open);
          if (!open && !localStorage.getItem('cookie-preferences')) {
            setShowBanner(true);
          }
        }}
      />
    </>
  );
}
