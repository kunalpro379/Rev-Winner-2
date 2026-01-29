import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft, Search } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  
  useSEO({
    title: "404 - Page Not Found | Rev Winner AI Sales Assistant",
    description: "The page you're looking for doesn't exist. Return to Rev Winner to access AI-powered sales coaching, conversation intelligence, and real-time sales assistance.",
    keywords: "404 error, page not found, Rev Winner, AI sales assistant"
  });
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-lg border-purple-200 dark:border-purple-800 shadow-xl">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Page Not Found</h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. It may have been moved, deleted, or never existed.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => setLocation('/')}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white"
              data-testid="button-go-home"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className="border-purple-300 dark:border-purple-700"
              data-testid="button-go-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Looking for something specific?</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/packages')} data-testid="link-packages">
                Pricing
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setLocation('/help')} data-testid="link-help">
                Help Center
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setLocation('/contact')} data-testid="link-contact">
                Contact Us
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setLocation('/blog')} data-testid="link-blog">
                Blog
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
