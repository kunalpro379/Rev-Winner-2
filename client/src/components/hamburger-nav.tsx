import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { useCart } from "@/contexts/cart-context";
import { queryClient } from "@/lib/queryClient";
import { clearAllSessionData } from "@/lib/session";
import logoPath from "@assets/rev-winner-logo.png";
import { Menu, Home, Zap, Mail, FileText, User, Settings, CreditCard, LogOut, BookOpen, GraduationCap, HelpCircle, ShoppingCart, Building2, Gamepad2 } from "lucide-react";

interface HamburgerNavProps {
  currentPath?: string;
}

interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface AuthResponse {
  user: AuthUser;
  subscription?: any;
}

export function HamburgerNav({ currentPath = "/" }: HamburgerNavProps) {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const { cart } = useCart();

  // Check if user is authenticated
  const { data: authData } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  const navigateTo = (path: string) => {
    setLocation(path);
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      // Attempt to call backend to invalidate session (best effort)
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout error (backend unreachable):', error);
      // Continue with cleanup even if backend fails
    } finally {
      // GUARANTEED: Clear session data regardless of backend success/failure
      clearAllSessionData({ clearCache: () => queryClient.clear() });
      
      // Always redirect to login after logout
      setLocation('/login');
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 gradient-header backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <img 
              src={logoPath} 
              alt="Rev Winner Logo" 
              className="h-5 sm:h-7 w-auto object-contain cursor-pointer"
              onClick={() => navigateTo('/')}
              data-testid="img-logo"
            />
            <div className="hidden sm:block">
              <h2 className="text-base font-bold text-foreground dark:text-white tracking-tight">Rev Winner</h2>
              <p className="text-[10px] text-muted-foreground dark:text-white/80 font-medium">AI-Powered Sales Assistant</p>
            </div>
          </div>

          {/* Right Side - Feedback + Cart + Theme Toggle + Hamburger Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Feedback Button - Only for authenticated users */}
            {authData && <FeedbackDialog />}
            
            <ThemeToggle />
            
            {/* Shopping Cart Icon with Badge */}
            {authData && (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 relative"
                onClick={() => navigateTo('/cart')}
                data-testid="button-cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cart && cart.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center" data-testid="cart-badge">
                    {cart.itemCount}
                  </span>
                )}
                <span className="sr-only">Shopping cart</span>
              </Button>
            )}
            
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-10 w-10"
                  data-testid="button-hamburger-menu"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              
              <SheetContent side="right" className="w-[300px] sm:w-[350px] flex flex-col">
                <SheetHeader className="flex-shrink-0">
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-4 mt-6 overflow-y-auto flex-1 pr-2">
                  {/* Navigation Links */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Navigation</h3>
                    
                    <Button
                      variant={currentPath === '/' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => navigateTo('/')}
                      data-testid="nav-home"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </Button>
                    
                    <Button
                      variant={currentPath === '/ai-sales-assistant' || currentPath === '/app' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        if (authData) {
                          navigateTo('/ai-sales-assistant');
                        } else {
                          navigateTo('/login?redirect=/ai-sales-assistant');
                        }
                      }}
                      data-testid="nav-app"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Rev Winner
                    </Button>
                    
                    <Button
                      variant={currentPath === '/blog' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => navigateTo('/blog')}
                      data-testid="nav-blog"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Blog
                    </Button>
                    
                    <Button
                      variant={currentPath === '/help' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => navigateTo('/help')}
                      data-testid="nav-help"
                    >
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Help
                    </Button>
                    
                    <Button
                      variant={currentPath === '/sales-challenge' || currentPath.startsWith('/sales-challenge/') ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => navigateTo('/sales-challenge')}
                      data-testid="nav-sales-challenge"
                    >
                      <Gamepad2 className="mr-2 h-4 w-4" />
                      Sales Challenge
                    </Button>
                    
                    <Button
                      variant={currentPath === '/terms' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => navigateTo('/terms')}
                      data-testid="nav-terms"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Terms & Conditions
                    </Button>
                    
                    <Button
                      variant={currentPath === '/contact' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => navigateTo('/contact')}
                      data-testid="nav-contact"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Contact Us
                    </Button>
                  </div>

                  <Separator />

                  {/* User Actions */}
                  {authData ? (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Account</h3>
                      
                      <Button
                        variant={currentPath === '/profile' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => navigateTo('/profile')}
                        data-testid="nav-profile"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                      
                      <Button
                        variant={currentPath === '/settings' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => navigateTo('/settings')}
                        data-testid="nav-settings"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                      
                      <Button
                        variant={currentPath === '/train-me' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => navigateTo('/train-me')}
                        data-testid="nav-train-me"
                      >
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Train Me
                      </Button>
                      
                      <Button
                        variant={currentPath === '/packages' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => navigateTo('/packages')}
                        data-testid="nav-packages"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Packages
                      </Button>
                      
                      {/* License Manager Menu Item */}
                      {(authData?.user?.role === 'license_manager' || authData?.user?.role === 'admin') && (
                        <Button
                          variant={currentPath === '/license-manager' ? 'default' : 'ghost'}
                          className="w-full justify-start"
                          onClick={() => navigateTo('/license-manager')}
                          data-testid="nav-license-manager"
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          License Manager
                        </Button>
                      )}
                      
                      <Separator className="my-2" />
                      
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive"
                        onClick={handleLogout}
                        data-testid="nav-logout"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Get Started</h3>
                      
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigateTo('/login')}
                        data-testid="nav-login"
                      >
                        Sign In
                      </Button>
                      
                      <Button
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                        onClick={() => navigateTo('/register')}
                        data-testid="nav-register"
                      >
                        Start Free Trial
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
