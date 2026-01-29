import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { HamburgerNav } from "@/components/hamburger-nav";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { 
  FileText, 
  Download,
  CheckCircle,
  Loader2,
  Package,
  Calendar,
  DollarSign,
  Home
} from "lucide-react";
import logoPath from "@assets/rev-winner-logo.png";

interface InvoiceItem {
  packageSku: string;
  packageName: string;
  addonType: string;
  quantity: number;
  basePrice: string;
  totalAmount: string;
  gstAmount: string;
  startDate: string;
  endDate: string | null;
}

interface InvoiceData {
  orderId: string;
  userId: number;
  totalAmount: string;
  status: string;
  createdAt: string;
  items: InvoiceItem[];
  subtotal: number;
  gst: number;
  total: number;
  userName: string;
  userEmail: string;
}

export default function Invoice() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  // Get orderId from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get('orderId');

  // Check if user is authenticated
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Fetch invoice data (include orderId in URL for backend)
  // Only construct queryKey when orderId exists to avoid caching 'null' URL
  const { data: invoiceData, isLoading } = useQuery<InvoiceData>({
    queryKey: orderId ? [`/api/billing/invoice?orderId=${orderId}`] : ['disabled-invoice-query'],
    enabled: !!orderId && !!authData,
  });

  // Redirect to login if not authenticated (but wait for auth check to complete)
  if (!authLoading && !authData) {
    setLocation('/login');
    return null;
  }

  // Redirect to packages if no orderId
  if (!orderId) {
    setLocation('/packages');
    return null;
  }

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      toast({
        title: "Generating PDF...",
        description: "Please wait while we generate your invoice.",
      });

      // Capture the invoice as canvas
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Convert canvas to PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${orderId}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: "Your invoice has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
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

  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950">
        <HamburgerNav currentPath={location} />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">Invoice Not Found</CardTitle>
              <CardDescription>
                We couldn't find the invoice you're looking for.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button onClick={() => setLocation('/packages')}>
                <Home className="mr-2 h-4 w-4" />
                Go to Packages
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950">
      <HamburgerNav currentPath={location} />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-500 rounded-full p-3">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-purple-100">
            Thank you for your purchase. Your order has been processed.
          </p>
        </div>

        {/* Download Button */}
        <div className="flex justify-center mb-8">
          <Button
            size="lg"
            onClick={handleDownloadPDF}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
            data-testid="button-download-pdf"
          >
            <Download className="mr-2 h-5 w-5" />
            Download PDF Invoice
          </Button>
        </div>

        {/* Invoice Card */}
        <Card 
          ref={invoiceRef}
          className="bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-700"
          data-testid="invoice-card"
        >
          {/* Invoice Header */}
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <img src={logoPath} alt="Rev Winner Logo" className="h-10 w-auto" />
                  <div>
                    <h2 className="text-2xl font-bold">Rev Winner</h2>
                    <p className="text-sm text-muted-foreground">AI-Powered Sales Assistant</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-green-500 hover:bg-green-600 mb-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Paid
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Invoice #{orderId.substring(0, 12)}...
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Bill To:</h3>
                <div className="text-sm text-muted-foreground">
                  <div>{invoiceData.userName}</div>
                  <div>{invoiceData.userEmail}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Purchase Date:</span>
                </div>
                <div className="font-semibold">{formatDate(invoiceData.createdAt)}</div>
              </div>
            </div>
          </CardHeader>

          {/* Invoice Items */}
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
              </h3>
              
              <div className="space-y-4">
                {invoiceData.items.map((item, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{item.packageName}</div>
                        <div className="text-sm text-muted-foreground">SKU: {item.packageSku}</div>
                        <Badge className="mt-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100">
                          {item.addonType.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          ${item.totalAmount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          + ${item.gstAmount} GST
                        </div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-semibold ml-2">{item.quantity}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unit Price:</span>
                        <span className="font-semibold ml-2">${item.basePrice}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Start Date:</span>
                        <span className="font-semibold ml-2">{formatDate(item.startDate)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expiry Date:</span>
                        <span className="font-semibold ml-2">{formatDate(item.endDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Price Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-lg">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">${invoiceData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <span>GST (18%)</span>
                </div>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  ${invoiceData.gst.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-2xl font-bold">
                <span>Total Paid</span>
                <span className="text-purple-600 dark:text-purple-400">
                  ${invoiceData.total.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/50 border-t">
            <div className="w-full text-center text-sm text-muted-foreground">
              <p>Thank you for your business!</p>
              <p className="mt-1">For any questions, please contact support@revwinner.com</p>
            </div>
          </CardFooter>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setLocation('/packages')}
            data-testid="button-continue-shopping"
          >
            Continue Shopping
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation('/profile')}
            data-testid="button-view-purchases"
          >
            View My Purchases
          </Button>
        </div>
      </div>
    </div>
  );
}
