import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueries } from "@tanstack/react-query";
import { HamburgerNav } from "@/components/hamburger-nav";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/use-seo";
import { StructuredData } from "@/components/structured-data";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ShoppingCart, 
  Check, 
  Clock, 
  GraduationCap, 
  Zap,
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  User,
  Plus,
  Minus,
  Mail,
  UserCircle,
  CreditCard,
  Building2,
  ArrowRight
} from "lucide-react";

interface PricingPackage {
  sku: string;
  name: string;
  price: number;
  listedPrice?: number | null;
  currency: string;
  billingType: string;
  totalUnits?: number;
  validityDays?: number;
  description: string;
}

interface Addon {
  id: string;
  slug: string;
  displayName: string;
  type: string;
  billingInterval?: string;
  pricingTiers?: Array<{ minutes: number; price: string; currency: string }>;
  flatPrice?: string;
  currency: string;
  features?: string[];
  metadata?: any;
}

interface ItemAvailability {
  available: boolean;
  reason?: string;
  status?: string;
}

interface TeamManagerInfo {
  name: string;
  email: string;
  companyName: string;
}

interface CartQuantities {
  platformAccess: { sku: string; quantity: number } | null;
  sessionMinutes: { sku: string; quantity: number }[];
  dai: { sku: string; quantity: number } | null;
  trainMe: { sku: string; quantity: number } | null;
}

// Pricing structured data for rich results
const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Rev Winner AI Sales Assistant",
  "description": "AI-powered sales assistant with real-time coaching, live transcription, BANT qualification tracking, and automated meeting minutes for sales professionals.",
  "brand": {
    "@type": "Brand",
    "name": "Rev Winner"
  },
  "category": "Sales Software",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "0",
    "highPrice": "99",
    "priceCurrency": "INR",
    "offerCount": "4",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "247"
  }
};

// Enterprise Purchase Form Component
function EnterpriseForm() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [packageType, setPackageType] = useState<"monthly" | "annual">("annual");
  const [totalSeats, setTotalSeats] = useState("5");
  const [isProcessing, setIsProcessing] = useState(false);

  const pricePerSeat = packageType === "annual" ? 60 : 6;
  const seats = parseInt(totalSeats, 10) || 0;
  const totalAmount = seats * pricePerSeat;

  const handlePurchase = async () => {
    if (!companyName.trim()) {
      toast({ title: "Company Name Required", description: "Please enter your company name", variant: "destructive" });
      return;
    }
    if (!billingEmail.trim() || !billingEmail.includes("@")) {
      toast({ title: "Valid Email Required", description: "Please enter a valid billing email", variant: "destructive" });
      return;
    }
    if (seats < 5) {
      toast({ title: "Minimum Seats Required", description: "Minimum 5 seats required for enterprise license", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const orderResponse = await apiRequest("POST", "/api/enterprise/purchase", { companyName, billingEmail, packageType, totalSeats: seats });
      const orderData = await orderResponse.json();
      if (!orderData.success) throw new Error(orderData.message || "Failed to create order");

      // Razorpay payment flow
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      script.onload = () => {
        const rzp = new (window as any).Razorpay({
          key: orderData.razorpayKeyId,
          amount: Math.round(orderData.amount * 100),
          currency: orderData.currency || 'USD',
          name: 'Rev Winner',
          description: `Enterprise License - ${seats} Seats (${packageType})`,
          order_id: orderData.razorpayOrderId,
          handler: async function (response: any) {
            try {
              const verifyResponse = await apiRequest("POST", "/api/enterprise/verify-purchase", {
                orderId: orderData.orderId, companyName, billingEmail, totalSeats: seats, packageType, pricePerSeat,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
              const verifyData = await verifyResponse.json();
              if (verifyData.success) {
                toast({ title: "Purchase Successful!", description: "Your enterprise license has been activated. Redirecting..." });
                queryClient.invalidateQueries({ queryKey: ['/api/enterprise/has-organization'] });
                setTimeout(() => setLocation("/license-manager?fromPayment=true"), 2000);
              } else {
                throw new Error(verifyData.message || "Verification failed");
              }
            } catch (error: any) {
              toast({ title: "Verification Failed", description: error.message || "Failed to verify payment", variant: "destructive" });
              setIsProcessing(false);
            }
          },
          modal: { ondismiss: () => { toast({ title: "Payment Cancelled" }); setIsProcessing(false); } },
          theme: { color: '#7c3aed' }
        });
        rzp.open();
      };
      script.onerror = () => { toast({ title: "Payment Gateway Error", variant: "destructive" }); setIsProcessing(false); };
    } catch (error: any) {
      toast({ title: "Purchase Failed", description: error?.message || "Failed to initiate purchase", variant: "destructive" });
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Details</CardTitle>
        <CardDescription>Enter your company information to get started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="companyName">Company Name *</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input id="companyName" placeholder="Enter your company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="pl-10" />
          </div>
        </div>
        <div>
          <Label htmlFor="billingEmail">Billing Email *</Label>
          <Input id="billingEmail" type="email" placeholder="billing@company.com" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="packageType">Package Type *</Label>
          <Select value={packageType} onValueChange={(value: "monthly" | "annual") => setPackageType(value)}>
            <SelectTrigger id="packageType"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly ($6/seat/month)</SelectItem>
              <SelectItem value="annual">Annual ($60/seat/year - Save 17%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="totalSeats">Number of Seats * (Minimum 5)</Label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input id="totalSeats" type="number" min="5" placeholder="Enter number of seats" value={totalSeats} onChange={(e) => setTotalSeats(e.target.value)} className="pl-10" />
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Seats:</span>
            <span className="font-medium">{seats}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Price per seat:</span>
            <span className="font-medium">${pricePerSeat.toLocaleString()}</span>
          </div>
          <div className="border-t dark:border-gray-700 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total Amount:</span>
              <span className="text-2xl font-bold text-purple-600">${totalAmount.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{packageType === "annual" ? "Billed annually" : "Billed monthly"} + 18% GST</p>
          </div>
        </div>
        <Button onClick={handlePurchase} disabled={isProcessing} className="w-full" size="lg">
          {isProcessing ? "Processing..." : `Purchase ${seats} Licenses - $${totalAmount.toLocaleString()}`}
        </Button>
        <p className="text-xs text-center text-muted-foreground">Secure payment powered by Razorpay</p>
      </CardContent>
    </Card>
  );
}

export default function Packages() {
  const [location, setLocation] = useLocation();
  const { addToCart, cart, clearCart } = useCart();
  const { toast } = useToast();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  
  // SEO optimization for pricing page
  useSEO({
    title: "Pricing Plans & Packages | Rev Winner AI Sales Assistant",
    description: "Choose the perfect Rev Winner plan for your sales team. Free trial with 3 sessions, flexible monthly plans, and enterprise team packages. Real-time AI coaching, live transcription, and auto meeting minutes. Start free today.",
    keywords: "Rev Winner pricing, AI sales assistant pricing, sales coaching software cost, conversation intelligence pricing, sales enablement plans, B2B sales software pricing, AI sales tools pricing, real-time sales coaching plans, meeting transcription pricing, enterprise sales software, team sales assistant, sales AI subscription",
    ogTitle: "Rev Winner Pricing - AI Sales Assistant Plans",
    ogDescription: "Flexible pricing for AI sales coaching. Free trial available. Choose individual or team plans with real-time coaching, transcription, and meeting minutes.",
    ogUrl: "https://revwinner.com/packages"
  });
  
  // Purchase mode state (support ?mode=team in URL for License Manager deep link)
  const [purchaseMode, setPurchaseMode] = useState<'user' | 'team'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'team' ? 'team' : 'user';
    }
    return 'user';
  });
  
  // Team manager info
  const [teamManager, setTeamManager] = useState<TeamManagerInfo>({ name: '', email: '', companyName: '' });
  const [teamFormSubmitted, setTeamFormSubmitted] = useState(false);
  
  // Team quantities (for team mode)
  const [teamQuantities, setTeamQuantities] = useState<CartQuantities>({
    platformAccess: null,
    sessionMinutes: [],
    dai: null,
    trainMe: null,
  });

  // Check if user is authenticated
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Check if user has an existing organization (for add-on purchases)
  const { data: orgData, isLoading: orgLoading, error: orgError } = useQuery<{ hasOrganization: boolean; organization?: { id: string; name: string; licenseManagerId: string } }>({
    queryKey: ['/api/enterprise/has-organization', purchaseMode],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('/api/enterprise/has-organization', {
        credentials: 'include',
        headers
      });
      if (!response.ok) {
        throw new Error(`Failed to check organization: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!authData, // Always check when authenticated
    retry: false,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache (replaces cacheTime in newer versions)
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Auto-populate team manager info from organization and user data when available
  useEffect(() => {
    if (purchaseMode === 'team') {
      console.log('Team mode - populating manager info', { 
        orgData, 
        authData,
        orgDataFull: JSON.stringify(orgData),
        authDataFull: JSON.stringify(authData)
      });
      
      // Auth data has user nested under .user property
      const user = authData ? ((authData as any).user || authData) : null;
      
      // Populate company name from organization if exists, otherwise use user's organization field
      if (orgData?.hasOrganization && orgData?.organization) {
        console.log('Setting company name from org:', orgData.organization.name, 'Full org:', JSON.stringify(orgData.organization));
        const companyName = orgData.organization?.name || (user?.organization) || 'My Organization';
        setTeamManager(prev => ({
          ...prev,
          companyName: prev.companyName || companyName,
        }));
      } else if (user?.organization) {
        // Fallback to user's organization field
        console.log('Using user organization as company name:', user.organization);
        setTeamManager(prev => ({
          ...prev,
          companyName: prev.companyName || user.organization,
        }));
      }
      
      // Populate user name and email from auth data
      if (user) {
        console.log('Auth user object:', JSON.stringify(user));
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';
        const userEmail = user.email || '';
        
        console.log('Setting user info:', { userName, userEmail, firstName: user.firstName, lastName: user.lastName, email: user.email });
        setTeamManager(prev => ({
          ...prev,
          name: prev.name || userName,
          email: prev.email || userEmail,
        }));
      }
    }
  }, [orgData, authData, purchaseMode]);

  // Fetch packages from the pricing API (Platform Access + Add-ons)
  const { data: packagesData, isLoading } = useQuery<{
    platformAccess: PricingPackage[];
    addons: Addon[];
  }>({
    queryKey: ['/api/billing/packages'],
    enabled: !!authData,
  });

  // Derive all SKUs from packages data (Platform Access + Add-ons)
  const allSkus = packagesData ? [
    ...(packagesData.platformAccess || []).map(p => p.sku),
    ...(packagesData.addons || []).map(a => a.id),
  ] : [];

  // Batch fetch all availability data using useQueries (team mode uses different availability)
  const availabilityQueries = useQueries({
    queries: allSkus.map(sku => ({
      queryKey: [`/api/cart/check-availability/${sku}`, purchaseMode],
      queryFn: async () => {
        const token = localStorage.getItem('accessToken');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const url = purchaseMode === 'team'
          ? `/api/cart/check-availability/${sku}?purchaseMode=team`
          : `/api/cart/check-availability/${sku}`;
        const response = await fetch(url, {
          credentials: 'include',
          headers
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch availability for ${sku}: ${response.status}`);
        }
        return response.json();
      },
      enabled: !!packagesData && !!authData,
      retry: false,
    })),
  });

  // Create availability map for easy lookup in render loops
  const availabilityMap = new Map<string, ItemAvailability>();
  allSkus.forEach((sku, index) => {
    const result = availabilityQueries[index];
    if (result.data) {
      availabilityMap.set(sku, result.data as ItemAvailability);
    }
  });

  // Redirect to login if not authenticated (AFTER all hooks are called)
  if (!authLoading && !authData) {
    setLocation('/login?redirect=/packages');
    return null;
  }

  // Check if user already has an item of a specific type in cart
  const hasItemInCart = (addonType: string) => {
    return cart?.items?.some(item => item.addonType === addonType) || false;
  };

  // Get total platform access quantity (for team mode validation)
  const getTotalPlatformAccessQuantity = () => {
    if (!teamQuantities.platformAccess) return 0;
    return teamQuantities.platformAccess.quantity;
  };

  // Get total session minutes quantity
  const getTotalSessionMinutesQuantity = () => {
    return teamQuantities.sessionMinutes.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Validate team cart constraints
  const validateTeamCart = (): { valid: boolean; message?: string } => {
    const platformAccessQty = getTotalPlatformAccessQuantity();
    const sessionMinutesQty = getTotalSessionMinutesQuantity();
    const daiQty = teamQuantities.dai?.quantity || 0;
    const trainMeQty = teamQuantities.trainMe?.quantity || 0;
    const hasExistingOrg = orgData?.hasOrganization || false;

    // CRITICAL RULE: Platform Access is ALWAYS required - no exceptions
    if (platformAccessQty === 0) {
      return { valid: false, message: "Platform Access subscription is required. Please add at least one Platform Access license to continue." };
    }

    // Add-ons cannot exceed platform access licenses
    if (daiQty > platformAccessQty) {
      return { valid: false, message: `DAI add-ons (${daiQty}) cannot exceed Platform Access licenses (${platformAccessQty})` };
    }

    if (trainMeQty > platformAccessQty) {
      return { valid: false, message: `Train Me add-ons (${trainMeQty}) cannot exceed Platform Access licenses (${platformAccessQty})` };
    }

    return { valid: true };
  };

  // Handle mode switch
  const handleModeSwitch = (isTeam: boolean) => {
    setPurchaseMode(isTeam ? 'team' : 'user');
    setTeamFormSubmitted(false);
    setTeamQuantities({
      platformAccess: null,
      sessionMinutes: [],
      dai: null,
      trainMe: null,
    });
  };

  // Handle team manager form submit
  const handleTeamFormSubmit = () => {
    if (!teamManager.companyName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your company name",
        variant: "destructive",
      });
      return;
    }
    
    if (!teamManager.name.trim() || !teamManager.email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both License Manager name and email",
        variant: "destructive",
      });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(teamManager.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    setTeamFormSubmitted(true);
  };

  // Update team quantity for a package
  const updateTeamQuantity = (sku: string, type: 'platformAccess' | 'sessionMinutes' | 'dai' | 'trainMe', change: number, displayName?: string) => {
    setTeamQuantities(prev => {
      // Get current Platform Access quantity for constraints
      const platformAccessQty = prev.platformAccess?.quantity || 0;
      const hasExistingOrg = orgData?.hasOrganization || false;
      
      if (type === 'platformAccess') {
        const currentQty = prev.platformAccess?.sku === sku ? prev.platformAccess.quantity : 0;
        const newQty = Math.max(0, currentQty + change);
        
        // When reducing Platform Access, also reduce other items that exceed the new limit
        let updatedSessionMinutes = prev.sessionMinutes;
        let updatedDai = prev.dai;
        let updatedTrainMe = prev.trainMe;
        
        if (newQty < platformAccessQty) {
          // Reduce session minutes if they exceed new Platform Access quantity
          const totalSessionMinutes = prev.sessionMinutes.reduce((sum, item) => sum + item.quantity, 0);
          if (totalSessionMinutes > newQty && newQty > 0) {
            // Proportionally reduce session minutes
            let remaining = newQty;
            updatedSessionMinutes = prev.sessionMinutes.map(item => {
              const reduced = Math.min(item.quantity, remaining);
              remaining -= reduced;
              return { ...item, quantity: reduced };
            }).filter(item => item.quantity > 0);
          } else if (newQty === 0) {
            updatedSessionMinutes = [];
          }
          
          // Reduce DAI if it exceeds new Platform Access quantity
          if (prev.dai && prev.dai.quantity > newQty) {
            updatedDai = newQty > 0 ? { ...prev.dai, quantity: newQty } : null;
          }
          
          // Reduce Train Me if it exceeds new Platform Access quantity
          if (prev.trainMe && prev.trainMe.quantity > newQty) {
            updatedTrainMe = newQty > 0 ? { ...prev.trainMe, quantity: newQty } : null;
          }
        }
        
        return {
          ...prev,
          platformAccess: newQty > 0 ? { sku, quantity: newQty } : null,
          sessionMinutes: updatedSessionMinutes,
          dai: updatedDai,
          trainMe: updatedTrainMe,
        };
      } else if (type === 'sessionMinutes') {
        // Calculate current total session minutes excluding this item
        const existingIndex = prev.sessionMinutes.findIndex(item => item.sku === sku);
        const currentQty = existingIndex >= 0 ? prev.sessionMinutes[existingIndex].quantity : 0;
        const otherSessionMinutesTotal = prev.sessionMinutes
          .filter(item => item.sku !== sku)
          .reduce((sum, item) => sum + item.quantity, 0);
        
        // New quantity for this item
        let newQty = Math.max(0, currentQty + change);
        
        // Session minutes cannot exceed Platform Access quantity
        const maxAllowed = Math.max(0, platformAccessQty - otherSessionMinutesTotal);
        newQty = Math.min(newQty, maxAllowed);
        
        if (newQty === 0) {
          return {
            ...prev,
            sessionMinutes: prev.sessionMinutes.filter(item => item.sku !== sku),
          };
        } else if (existingIndex >= 0) {
          const newItems = [...prev.sessionMinutes];
          newItems[existingIndex] = { sku, quantity: newQty };
          return { ...prev, sessionMinutes: newItems };
        } else {
          return {
            ...prev,
            sessionMinutes: [...prev.sessionMinutes, { sku, quantity: newQty }],
          };
        }
      } else if (type === 'dai') {
        const currentQty = prev.dai?.sku === sku ? prev.dai.quantity : 0;
        let newQty = Math.max(0, currentQty + change);
        // DAI cannot exceed Platform Access quantity
        newQty = Math.min(newQty, platformAccessQty);
        return {
          ...prev,
          dai: newQty > 0 ? { sku, quantity: newQty } : null,
        };
      } else if (type === 'trainMe') {
        const currentQty = prev.trainMe?.sku === sku ? prev.trainMe.quantity : 0;
        let newQty = Math.max(0, currentQty + change);
        // Train Me cannot exceed Platform Access quantity
        newQty = Math.min(newQty, platformAccessQty);
        return {
          ...prev,
          trainMe: newQty > 0 ? { sku, quantity: newQty } : null,
        };
      }
      return prev;
    });
  };

  // Get quantity for a package in team mode
  const getTeamQuantity = (sku: string, type: 'platformAccess' | 'sessionMinutes' | 'dai' | 'trainMe'): number => {
    if (type === 'platformAccess') {
      return teamQuantities.platformAccess?.sku === sku ? teamQuantities.platformAccess.quantity : 0;
    } else if (type === 'sessionMinutes') {
      const item = teamQuantities.sessionMinutes.find(i => i.sku === sku);
      return item?.quantity || 0;
    } else if (type === 'dai') {
      return teamQuantities.dai?.sku === sku ? teamQuantities.dai.quantity : 0;
    } else if (type === 'trainMe') {
      return teamQuantities.trainMe?.sku === sku ? teamQuantities.trainMe.quantity : 0;
    }
    return 0;
  };

  const handleAddToCart = async (packageSku: string, quantity: number = 1) => {
    setAddingToCart(packageSku);
    try {
      await addToCart(
        packageSku, 
        quantity, 
        purchaseMode, 
        purchaseMode === 'team' ? teamManager : undefined
      );
    } catch (error: any) {
      // Error toast is already shown by the cart context
    } finally {
      setAddingToCart(null);
    }
  };

  // Handle adding all team items to cart
  const handleAddTeamToCart = async () => {
    const validation = validateTeamCart();
    if (!validation.valid) {
      toast({
        title: "Invalid Team Cart",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    // Validate team manager info is populated
    if (!teamManager.name || !teamManager.email || !teamManager.companyName) {
      console.error('Team manager info incomplete:', teamManager);
      toast({
        title: "Missing Information",
        description: "Please wait while we load your organization details, then try again.",
        variant: "destructive",
      });
      return;
    }

    console.log('Adding team items to cart with manager:', teamManager);

    setAddingToCart('team');
    try {
      // Always clear cart first for team mode to avoid "Item already in cart" errors
      // This ensures a clean slate for the new team purchase
      try {
        await clearCart();
      } catch (clearError) {
        // Ignore clear errors (cart might already be empty)
      }

      // Add platform access
      if (teamQuantities.platformAccess) {
        await addToCart(
          teamQuantities.platformAccess.sku,
          teamQuantities.platformAccess.quantity,
          'team',
          teamManager
        );
      }

      // Add session minutes
      for (const item of teamQuantities.sessionMinutes) {
        await addToCart(item.sku, item.quantity, 'team', teamManager);
      }

      // Add DAI if selected
      if (teamQuantities.dai) {
        await addToCart(teamQuantities.dai.sku, teamQuantities.dai.quantity, 'team', teamManager);
      }

      // Add Train Me if selected
      if (teamQuantities.trainMe) {
        await addToCart(teamQuantities.trainMe.sku, teamQuantities.trainMe.quantity, 'team', teamManager);
      }

      toast({
        title: "Team packages added",
        description: "All team packages have been added to your cart",
      });

      setLocation('/cart');
    } catch (error: any) {
      console.error('Failed to add team packages:', error);
      toast({
        title: "Failed to add team packages",
        description: error.message || "Could not add all items to cart",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(null);
    }
  };

  const getAvailabilityBadge = (availability: ItemAvailability | undefined) => {
    if (!availability) return null;

    if (availability.available) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600" data-testid="badge-available">
          <CheckCircle className="h-3 w-3 mr-1" />
          Available
        </Badge>
      );
    }

    if (availability.status === 'active') {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600" data-testid="badge-active">
          <Check className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }

    if (availability.status === 'expiring_soon') {
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600" data-testid="badge-expiring">
          <AlertCircle className="h-3 w-3 mr-1" />
          Expiring Soon
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" data-testid="badge-unavailable">
        <XCircle className="h-3 w-3 mr-1" />
        {availability.reason || 'Not Available'}
      </Badge>
    );
  };

  // Determine addon type from slug/id
  const getAddonType = (addon: Addon): 'sessionMinutes' | 'dai' | 'trainMe' | null => {
    if (addon.type === 'usage_bundle') return 'sessionMinutes';
    if (addon.slug?.includes('dai')) return 'dai';
    if (addon.slug?.includes('train-me')) return 'trainMe';
    return null;
  };

  // Check if user can add item in user mode
  const canAddInUserMode = (addonType: string): boolean => {
    if (addonType === 'platform_access' || addonType === 'dai' || addonType === 'train_me' || addonType === 'service') {
      return !hasItemInCart(addonType);
    }
    return true; // Session minutes can be added multiple times
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950">
        <HamburgerNav currentPath={location} />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      </div>
    );
  }

  // Calculate team cart total
  const calculateTeamTotal = () => {
    let total = 0;
    
    if (teamQuantities.platformAccess) {
      const pkg = packagesData?.platformAccess?.find(p => p.sku === teamQuantities.platformAccess?.sku);
      if (pkg) total += pkg.price * teamQuantities.platformAccess.quantity;
    }
    
    teamQuantities.sessionMinutes.forEach(item => {
      const addon = packagesData?.addons?.find(a => a.id === item.sku);
      if (addon) total += parseFloat(addon.flatPrice || '0') * item.quantity;
    });
    
    if (teamQuantities.dai) {
      const addon = packagesData?.addons?.find(a => a.id === teamQuantities.dai?.sku);
      if (addon) total += parseFloat(addon.flatPrice || '0') * teamQuantities.dai.quantity;
    }
    
    if (teamQuantities.trainMe) {
      const addon = packagesData?.addons?.find(a => a.id === teamQuantities.trainMe?.sku);
      if (addon) total += parseFloat(addon.flatPrice || '0') * teamQuantities.trainMe.quantity;
    }
    
    return total;
  };

  return (
    <>
    <StructuredData data={pricingSchema} />
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950">
      <HamburgerNav currentPath={location} />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Rev Winner Marketplace
          </h1>
          <p className="text-lg text-purple-100 mb-2">
            Browse and add packages to your cart
          </p>
          <p className="text-sm text-purple-200">
            Build your perfect sales assistant setup with flexible packages
          </p>
        </div>

        {/* Purchase Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 inline-flex items-center gap-6">
            <div className={`flex items-center gap-2 ${purchaseMode === 'user' ? 'text-white' : 'text-purple-200'}`}>
              <User className="h-5 w-5" />
              <span className="font-medium">Individual</span>
            </div>
            <Switch
              checked={purchaseMode === 'team'}
              onCheckedChange={handleModeSwitch}
              data-testid="toggle-purchase-mode"
            />
            <div className={`flex items-center gap-2 ${purchaseMode === 'team' ? 'text-white' : 'text-purple-200'}`}>
              <Users className="h-5 w-5" />
              <span className="font-medium">Team</span>
            </div>
          </div>
        </div>

        {/* Mode Description */}
        <div className="text-center mb-8">
          {purchaseMode === 'user' ? (
            <p className="text-purple-100 text-sm">
              Purchase for yourself: One platform access, session minutes, and optional add-ons
            </p>
          ) : (
            <p className="text-purple-100 text-sm">
              Purchase for your team: Multiple licenses with a dedicated License Manager
            </p>
          )}
        </div>

        {/* Enterprise Purchase Form (only for team mode without organization) */}
        {purchaseMode === 'team' && !orgData?.hasOrganization && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Enterprise License Purchase</h2>
              <p className="text-purple-100">Get bulk licenses for your organization with centralized management</p>
            </div>
            
            {/* Pricing Info Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card data-testid="card-pricing-monthly">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    Monthly Plan
                  </CardTitle>
                  <CardDescription>Pay as you go, cancel anytime</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">$6</div>
                  <p className="text-sm text-muted-foreground">per seat per month</p>
                </CardContent>
              </Card>

              <Card data-testid="card-pricing-annual">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Annual Plan
                    <span className="ml-auto text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-2 py-1 rounded">
                      Save 17%
                    </span>
                  </CardTitle>
                  <CardDescription>Best value for your team</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">$60</div>
                  <p className="text-sm text-muted-foreground">per seat per year</p>
                </CardContent>
              </Card>
            </div>

            {/* Enterprise Purchase Form */}
            <EnterpriseForm />
          </div>
        )}

        {/* Show packages - for user mode always, for team mode only if has organization */}
        {(purchaseMode === 'user' || (purchaseMode === 'team' && orgData?.hasOrganization)) && (
          <>
            {/* Platform Access Subscriptions - Show for both user and team mode */}
            <section className="mb-16">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                  <Zap className="h-8 w-8" />
                  Platform Access Subscriptions
                </h2>
                <p className="text-purple-100">
                  {purchaseMode === 'user' 
                    ? 'Choose your preferred billing cycle for platform access (one per user)'
                    : orgData?.hasOrganization
                      ? 'Add platform access licenses for your team (required for new team purchases)'
                      : 'Platform access licenses for your team'
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {packagesData?.platformAccess?.map((pkg, index) => {
                  const availability = availabilityMap.get(pkg.sku);
                  const teamQty = getTeamQuantity(pkg.sku, 'platformAccess');
                  const hasInCart = hasItemInCart('platform_access');
                  const canAdd = !hasInCart && availability?.available;

                  return (
                    <Card
                      key={pkg.sku}
                      className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur border-2 transition-all hover:scale-105 ${
                        pkg.billingType === '36_months' ? 'border-purple-400 shadow-lg shadow-purple-500/20' : 'border-purple-300 dark:border-purple-700'
                      }`}
                      data-testid={`card-platform-${index}`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                            {pkg.name}
                          </CardTitle>
                          {pkg.billingType === '36_months' && (
                            <Badge className="bg-gradient-to-r from-fuchsia-600 to-purple-600">
                              Best Value
                            </Badge>
                          )}
                        </div>
                        {getAvailabilityBadge(availability)}
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          {pkg.listedPrice && pkg.listedPrice > pkg.price && (
                            <span className="text-lg text-muted-foreground line-through mr-2">
                              ${pkg.listedPrice}
                            </span>
                          )}
                          <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            ${pkg.price}
                          </span>
                          {pkg.listedPrice && pkg.listedPrice > pkg.price && (
                            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Save ${(pkg.listedPrice - pkg.price).toFixed(0)}
                            </Badge>
                          )}
                          {purchaseMode === 'team' && teamQty > 0 && (
                            <span className="text-lg font-normal text-muted-foreground ml-2">
                              × {teamQty} = ${pkg.price * teamQty}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                        <ul className="space-y-2 mb-4">
                          <li className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{pkg.validityDays} days access</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>All AI features included</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Priority support</span>
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        {purchaseMode === 'user' ? (
                          <Button
                            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                            onClick={() => handleAddToCart(pkg.sku)}
                            disabled={!canAdd || addingToCart === pkg.sku}
                            data-testid={`button-add-to-cart-${pkg.sku}`}
                          >
                            {addingToCart === pkg.sku ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : hasInCart ? (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                In Cart
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Add to Cart
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="w-full flex items-center justify-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateTeamQuantity(pkg.sku, 'platformAccess', -1)}
                              disabled={teamQty === 0}
                              data-testid={`button-decrease-${pkg.sku}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-semibold text-lg">{teamQty}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateTeamQuantity(pkg.sku, 'platformAccess', 1)}
                              data-testid={`button-increase-${pkg.sku}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Session Minutes Add-on */}
            {(packagesData?.addons?.filter(a => a.type === 'usage_bundle')?.length ?? 0) > 0 && (
              <section className="mb-16">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <Clock className="h-8 w-8" />
                    Session Minutes Packages
                  </h2>
                  <p className="text-purple-100">
                    {purchaseMode === 'user' 
                      ? 'Add session time to your account (required for platform access)'
                      : getTotalPlatformAccessQuantity() === 0
                        ? 'Session minutes are required (add Platform Access first)'
                        : `Select session minutes for your team (must equal ${getTotalPlatformAccessQuantity()} platform license${getTotalPlatformAccessQuantity() !== 1 ? 's' : ''})`
                    }
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packagesData?.addons
                    ?.filter(addon => addon.type === 'usage_bundle')
                    .map((addon) => {
                      const availability = availabilityMap.get(addon.id);
                      const features = Array.isArray(addon.features) ? addon.features : [];
                      const price = addon.flatPrice || '0';
                      const teamQty = getTeamQuantity(addon.id, 'sessionMinutes');

                      return (
                        <Card
                          key={addon.id}
                          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-2 border-purple-300 dark:border-purple-700 hover:scale-105 transition-all"
                          data-testid={`card-addon-${addon.slug}`}
                        >
                          <CardHeader>
                            <CardTitle className="text-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                              {addon.displayName}
                            </CardTitle>
                            {getAvailabilityBadge(availability)}
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                              ${price}
                              {purchaseMode === 'team' && teamQty > 0 && (
                                <span className="text-lg font-normal text-muted-foreground ml-2">
                                  × {teamQty} = ${parseFloat(price) * teamQty}
                                </span>
                              )}
                            </div>
                            {features.length > 0 && (
                              <ul className="space-y-2">
                                {features.map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </CardContent>
                          <CardFooter>
                            {purchaseMode === 'user' ? (
                              <Button
                                className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                                onClick={() => handleAddToCart(addon.id)}
                                disabled={!availability?.available || addingToCart === addon.id}
                                data-testid={`button-add-to-cart-${addon.id}`}
                              >
                                {addingToCart === addon.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Add to Cart
                                  </>
                                )}
                              </Button>
                            ) : (
                              <div className="w-full flex items-center justify-center gap-3">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateTeamQuantity(addon.id, 'sessionMinutes', -1)}
                                  disabled={teamQty === 0}
                                  data-testid={`button-decrease-${addon.id}`}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-12 text-center font-semibold text-lg">{teamQty}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateTeamQuantity(addon.id, 'sessionMinutes', 1)}
                                  data-testid={`button-increase-${addon.id}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      );
                    })}
                </div>
              </section>
            )}

            {/* Service Add-ons (DAI, Train Me) */}
            {(packagesData?.addons?.filter(a => a.type === 'service')?.length ?? 0) > 0 && (
              <section className="mb-16">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <Brain className="h-8 w-8" />
                    Premium Add-ons
                  </h2>
                  <p className="text-purple-100">
                    {purchaseMode === 'user' 
                      ? 'Enhance your sales assistant with powerful features (optional)'
                      : getTotalPlatformAccessQuantity() === 0
                        ? 'Optional add-ons (add Platform Access first to enable)'
                        : `Optional add-ons for your team (max ${getTotalPlatformAccessQuantity()} each)`
                    }
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packagesData?.addons
                    ?.filter(addon => addon.type === 'service')
                    .map((addon) => {
                      const availability = availabilityMap.get(addon.id);
                      const features = Array.isArray(addon.features) ? addon.features : [];
                      const price = addon.flatPrice || '0';
                      const isDai = addon.slug?.includes('dai');
                      const isTrainMe = addon.slug?.includes('train-me');
                      const addonType = isDai ? 'dai' : isTrainMe ? 'trainMe' : null;
                      const teamQty = addonType ? getTeamQuantity(addon.id, addonType) : 0;
                      const hasInCart = hasItemInCart(isDai ? 'dai' : isTrainMe ? 'train_me' : 'service');
                      const canAdd = purchaseMode === 'user' ? !hasInCart && availability?.available : availability?.available;

                      return (
                        <Card
                          key={addon.id}
                          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-2 border-purple-300 dark:border-purple-700 hover:scale-105 transition-all"
                          data-testid={`card-addon-${addon.slug}`}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <CardTitle className="text-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                                {addon.displayName}
                              </CardTitle>
                              {isTrainMe && (
                                <GraduationCap className="h-5 w-5 text-fuchsia-600" />
                              )}
                              {isDai && (
                                <Brain className="h-5 w-5 text-purple-600" />
                              )}
                            </div>
                            {getAvailabilityBadge(availability)}
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                              ${price}
                              <span className="text-sm font-normal text-muted-foreground">/{addon.billingInterval || 'month'}</span>
                              {purchaseMode === 'team' && teamQty > 0 && (
                                <span className="text-lg font-normal text-muted-foreground ml-2">
                                  × {teamQty} = ${parseFloat(price) * teamQty}
                                </span>
                              )}
                            </div>
                            {features.length > 0 && (
                              <ul className="space-y-2">
                                {features.slice(0, 4).map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </CardContent>
                          <CardFooter>
                            {purchaseMode === 'user' ? (
                              <Button
                                className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                                onClick={() => handleAddToCart(addon.id)}
                                disabled={!canAdd || addingToCart === addon.id}
                                data-testid={`button-add-to-cart-${addon.id}`}
                              >
                                {addingToCart === addon.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                  </>
                                ) : hasInCart ? (
                                  <>
                                    <Check className="mr-2 h-4 w-4" />
                                    In Cart
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Add to Cart
                                  </>
                                )}
                              </Button>
                            ) : addonType ? (
                              <div className="w-full flex items-center justify-center gap-3">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateTeamQuantity(addon.id, addonType, -1)}
                                  disabled={teamQty === 0}
                                  data-testid={`button-decrease-${addon.id}`}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-12 text-center font-semibold text-lg">{teamQty}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateTeamQuantity(addon.id, addonType, 1)}
                                  disabled={teamQty >= getTotalPlatformAccessQuantity()}
                                  data-testid={`button-increase-${addon.id}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : null}
                          </CardFooter>
                        </Card>
                      );
                    })}
                </div>
              </section>
            )}

            {/* Team Cart Summary (for team mode with organization) */}
            {purchaseMode === 'team' && orgData?.hasOrganization && (
              <Card className="max-w-2xl mx-auto mb-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                    Team Order Summary
                  </CardTitle>
                  <CardDescription>
                    {teamManager.name && teamManager.email ? (
                      <>License Manager: {teamManager.name} ({teamManager.email})</>
                    ) : (
                      <span className="text-amber-600">Loading organization details...</span>
                    )}
                    {teamManager.companyName && (
                      <div className="text-xs text-muted-foreground mt-1">Company: {teamManager.companyName}</div>
                    )}
                  </CardDescription>
                  {/* Debug info - remove after testing */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      Debug: name={teamManager.name || 'empty'}, email={teamManager.email || 'empty'}, company={teamManager.companyName || 'empty'}
                    </div>
                  )}
                  {getTotalPlatformAccessQuantity() === 0 ? (
                    <div className="mt-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-700 dark:text-red-400">Platform Access Required</p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            You must add at least one Platform Access license to purchase team packages. Scroll up to select Platform Access packages.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                      Select your quantities above, then click the button below to add all items to your cart at once.
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Platform Access Licenses:</span>
                    <span className="font-medium">{getTotalPlatformAccessQuantity()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Session Minutes Packages:</span>
                    <span className="font-medium">{getTotalSessionMinutesQuantity()}</span>
                  </div>
                  {teamQuantities.dai && (
                    <div className="flex justify-between text-sm">
                      <span>DAI Add-ons:</span>
                      <span className="font-medium">{teamQuantities.dai.quantity}</span>
                    </div>
                  )}
                  {teamQuantities.trainMe && (
                    <div className="flex justify-between text-sm">
                      <span>Train Me Add-ons:</span>
                      <span className="font-medium">{teamQuantities.trainMe.quantity}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Estimated Total:</span>
                    <span className="text-purple-600">${calculateTeamTotal().toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">+ 18% GST will be added at checkout</p>
                  
                  {/* Validation message */}
                  {!validateTeamCart().valid && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600 dark:text-red-400">{validateTeamCart().message}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                    onClick={handleAddTeamToCart}
                    disabled={
                      !validateTeamCart().valid || 
                      addingToCart === 'team' ||
                      !teamManager.name ||
                      !teamManager.email ||
                      !teamManager.companyName
                    }
                    data-testid="button-add-team-to-cart"
                  >
                    {addingToCart === 'team' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding to Cart...
                      </>
                    ) : !teamManager.name || !teamManager.email || !teamManager.companyName ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading Details...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add All to Cart & Checkout
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* View Cart Button (for user mode) */}
            {purchaseMode === 'user' && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                  onClick={() => setLocation('/cart')}
                  data-testid="button-view-cart"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  View Cart
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
