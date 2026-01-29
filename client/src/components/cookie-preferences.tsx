import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { triggerGtagInit } from "@/lib/gtag";

interface CookiePreferencesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CookiePreferences({ open, onOpenChange }: CookiePreferencesProps) {
  const [targetingCookies, setTargetingCookies] = useState(true);
  const [socialMediaCookies, setSocialMediaCookies] = useState(true);
  const [analyticsCookies, setAnalyticsCookies] = useState(true);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    targeting: false,
    necessary: false,
    social: false,
    analytics: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleRejectAll = () => {
    setTargetingCookies(false);
    setSocialMediaCookies(false);
    setAnalyticsCookies(false);
    
    localStorage.setItem('cookie-preferences', JSON.stringify({
      targeting: false,
      social: false,
      analytics: false,
      necessary: true
    }));
    
    onOpenChange(false);
  };

  const handleConfirmChoices = () => {
    localStorage.setItem('cookie-preferences', JSON.stringify({
      targeting: targetingCookies,
      social: socialMediaCookies,
      analytics: analyticsCookies,
      necessary: true
    }));
    
    // Trigger Google Tag initialization if user accepted analytics/targeting
    if (targetingCookies || analyticsCookies) {
      triggerGtagInit();
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0" data-testid="dialog-cookie-preferences">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
          data-testid="button-close-cookie-preferences"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-semibold text-slate-800 dark:text-white">
              Privacy Preference Center
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Description */}
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3">
              <p>
                When you visit any website, it may store or retrieve information on your browser, mostly in the form of cookies. This information might be about you, your preferences or your device and is mostly used to make the site work as you expect it to. The information does not usually directly identify you, but it can give you a more personalized web experience. Because we respect your right to privacy, you can choose not to allow some types of cookies. Click on the different category headings to find out more and change our default settings. However, blocking some types of cookies may impact your experience of the site and the services we are able to offer.
              </p>
              <a 
                href="/terms" 
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                data-testid="link-more-information"
              >
                More information
              </a>
            </div>

            {/* Manage Consent Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
                Manage Consent Preferences
              </h3>

              <div className="space-y-2">
                {/* Targeting Cookies */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <div className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <button
                      onClick={() => toggleSection('targeting')}
                      className="flex items-center gap-3 flex-1 text-left"
                      data-testid="button-toggle-targeting"
                    >
                      {expandedSections.targeting ? (
                        <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      )}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Targeting Cookies
                      </span>
                    </button>
                    <Switch
                      checked={targetingCookies}
                      onCheckedChange={setTargetingCookies}
                      data-testid="switch-targeting-cookies"
                    />
                  </div>
                  {expandedSections.targeting && (
                    <div className="p-4 pt-0 text-sm text-slate-600 dark:text-slate-400">
                      These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.
                    </div>
                  )}
                </div>

                {/* Strictly Necessary Cookies */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('necessary')}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    data-testid="button-toggle-necessary"
                  >
                    <div className="flex items-center gap-3">
                      {expandedSections.necessary ? (
                        <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      )}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Strictly Necessary Cookies
                      </span>
                    </div>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Always Active
                    </span>
                  </button>
                  {expandedSections.necessary && (
                    <div className="p-4 pt-0 text-sm text-slate-600 dark:text-slate-400">
                      These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms.
                    </div>
                  )}
                </div>

                {/* Social Media Cookies */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <div className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <button
                      onClick={() => toggleSection('social')}
                      className="flex items-center gap-3 flex-1 text-left"
                      data-testid="button-toggle-social"
                    >
                      {expandedSections.social ? (
                        <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      )}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Social Media Cookies
                      </span>
                    </button>
                    <Switch
                      checked={socialMediaCookies}
                      onCheckedChange={setSocialMediaCookies}
                      data-testid="switch-social-cookies"
                    />
                  </div>
                  {expandedSections.social && (
                    <div className="p-4 pt-0 text-sm text-slate-600 dark:text-slate-400">
                      These cookies are set by a range of social media services that we have added to the site to enable you to share our content with your friends and networks. They are capable of tracking your browser across other sites and building up a profile of your interests.
                    </div>
                  )}
                </div>

                {/* Analytics Cookies */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <div className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <button
                      onClick={() => toggleSection('analytics')}
                      className="flex items-center gap-3 flex-1 text-left"
                      data-testid="button-toggle-analytics"
                    >
                      {expandedSections.analytics ? (
                        <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      )}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Analytics Cookies
                      </span>
                    </button>
                    <Switch
                      checked={analyticsCookies}
                      onCheckedChange={setAnalyticsCookies}
                      data-testid="switch-analytics-cookies"
                    />
                  </div>
                  {expandedSections.analytics && (
                    <div className="p-4 pt-0 text-sm text-slate-600 dark:text-slate-400">
                      These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleRejectAll}
                variant="outline"
                className="flex-1"
                data-testid="button-reject-all-cookies"
              >
                Reject All
              </Button>
              <Button
                onClick={handleConfirmChoices}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-confirm-choices"
              >
                Confirm My Choices
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
