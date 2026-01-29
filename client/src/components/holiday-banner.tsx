import { useState, useEffect } from "react";
import { X, Snowflake, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HolidayBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  const EXPIRY_DATE = new Date("2026-01-02T23:59:59");
  const now = new Date();
  const isHolidaySeason = now <= EXPIRY_DATE;

  useEffect(() => {
    const dismissed = sessionStorage.getItem("holiday-banner-dismissed");
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  if (!isHolidaySeason || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("holiday-banner-dismissed", "true");
  };

  const handleContactSales = () => {
    window.location.href = "/contact";
  };

  return (
    <div 
      className={`relative overflow-hidden transition-all duration-500 ${isVisible ? 'max-h-40' : 'max-h-0'}`}
      data-testid="holiday-banner"
    >
      <div className="relative bg-gradient-to-r from-purple-900 via-fuchsia-800 to-pink-800 dark:from-purple-950 dark:via-fuchsia-900 dark:to-pink-900 py-3 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-snowfall"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            >
              <Snowflake 
                className="text-white/30 w-3 h-3" 
                style={{ 
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
          <div className="absolute top-0 left-1/4 animate-twinkle">
            <Sparkles className="text-yellow-300/50 w-4 h-4" />
          </div>
          <div className="absolute top-1 right-1/4 animate-twinkle" style={{ animationDelay: '1s' }}>
            <Sparkles className="text-yellow-300/50 w-3 h-3" />
          </div>
          <div className="absolute bottom-1 left-1/3 animate-twinkle" style={{ animationDelay: '0.5s' }}>
            <Sparkles className="text-yellow-300/40 w-3 h-3" />
          </div>
          <div className="absolute bottom-0 right-1/3 animate-twinkle" style={{ animationDelay: '1.5s' }}>
            <Sparkles className="text-yellow-300/40 w-4 h-4" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-white/10 rounded-full animate-bounce-gentle">
              <Gift className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <p className="text-white font-bold text-sm sm:text-base flex items-center gap-2 justify-center sm:justify-start">
                <span className="animate-pulse">✨</span>
                Holiday Special Offer!
                <span className="animate-pulse">✨</span>
              </p>
              <p className="text-white/90 text-xs sm:text-sm">
                Celebrate the season with exclusive pricing on all plans
              </p>
            </div>
          </div>

          <Button
            onClick={handleContactSales}
            className="bg-white hover:bg-yellow-50 text-purple-900 font-semibold px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-xs sm:text-sm whitespace-nowrap"
            size="sm"
            data-testid="button-holiday-contact-sales"
          >
            <Gift className="w-4 h-4 mr-1.5 text-pink-600" />
            Contact Sales for Holiday Pricing
          </Button>

          <button
            onClick={handleDismiss}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Dismiss holiday banner"
            data-testid="button-dismiss-holiday-banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(60px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-snowfall {
          animation: snowfall linear infinite;
        }

        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
