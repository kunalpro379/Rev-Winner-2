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
  unitPrice: string;
  basePrice: string;
  discount?: string;  // CRITICAL FIX: Add discount field
  totalAmount: string;
  gstRate: number;
  gstAmount: string;
  totalWithGst: string;
  currency: string;
  startDate: string;
  endDate: string | null;
  description: string;
}

interface InvoiceData {
  // Invoice Header
  invoiceNumber: string;
  orderId: string;
  invoiceDate: string;
  dueDate: string;
  
  // Company Information
  company: {
    name: string;
    address: string;
    email: string;
    website: string;
    gstNumber: string | null;
  };
  
  // Customer Information
  customer: {
    id: string;
    name: string;
    email: string;
    mobile: string | null;
    organization: string | null;
  };
  
  // Payment Information
  payment: {
    method: string;
    status: string;
    transactionId: string;
    paymentDate: string;
  };
  
  // Line Items
  items: InvoiceItem[];
  
  // Financial Summary
  summary: {
    subtotal: number;
    gst: number;
    gstRate: number;
    total: number;
    currency: string;
    amountInWords: string;
  };
  
  // Metadata
  createdAt: string;
  generatedAt: string;
  
  // Terms and Conditions
  terms: string[];
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
  const { data: invoiceData, isLoading, error } = useQuery<InvoiceData>({
    queryKey: orderId ? [`/api/billing/invoice?orderId=${orderId}`] : ['disabled-invoice-query'],
    enabled: !!orderId && !!authData,
  });

  // Debug logging
  console.log('Invoice Debug:', {
    orderId,
    authData: !!authData,
    invoiceData,
    isLoading,
    error
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
    if (!invoiceRef.current || !invoiceData) return;

    try {
      toast({
        title: "Generating PDF...",
        description: "Please wait while we generate your invoice.",
      });

      // Wait a bit for any dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Ensure the element is visible and has content
      const element = invoiceRef.current;
      if (!element.offsetHeight || !element.offsetWidth) {
        throw new Error('Invoice element is not visible or has no content');
      }

      console.log('Element dimensions:', {
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight
      });

      // Capture the invoice as canvas with optimized options
      const canvas = await html2canvas(element, {
        scale: 2, // Reduced scale for better compatibility
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true, // Enable logging for debugging
        foreignObjectRendering: false, // Disable for better compatibility
        imageTimeout: 15000,
        removeContainer: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure styles are applied to cloned document
          const clonedElement = clonedDoc.querySelector('[data-testid="invoice-card"]');
          if (clonedElement) {
            (clonedElement as HTMLElement).style.backgroundColor = '#ffffff';
            (clonedElement as HTMLElement).style.color = '#000000';
            (clonedElement as HTMLElement).style.fontFamily = 'Arial, sans-serif';
            (clonedElement as HTMLElement).style.fontSize = '14px';
            (clonedElement as HTMLElement).style.lineHeight = '1.4';
            (clonedElement as HTMLElement).style.padding = '20px';
            (clonedElement as HTMLElement).style.minHeight = 'auto';
            (clonedElement as HTMLElement).style.display = 'block';
            (clonedElement as HTMLElement).style.visibility = 'visible';
            
            // Force all text to be black
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach((el) => {
              (el as HTMLElement).style.color = '#000000';
            });
          }
        }
      });

      console.log('Canvas dimensions:', {
        width: canvas.width,
        height: canvas.height
      });

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has zero dimensions - content may not be visible');
      }

      // Convert canvas to PDF with better sizing
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      if (imgData === 'data:,') {
        throw new Error('Canvas is empty - no content captured');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const imgWidth = pdfWidth - 20; // Leave 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Center the image on the page
      const xOffset = 10; // 10mm margin
      let yOffset = 10; // 10mm margin from top
      
      // If the image is taller than one page, split into multiple pages
      if (imgHeight > pdfHeight - 20) { // Account for margins
        let remainingHeight = imgHeight;
        let sourceY = 0;
        let pageNumber = 1;
        
        while (remainingHeight > 0) {
          const pageHeight = Math.min(pdfHeight - 20, remainingHeight);
          const sourceHeight = (pageHeight / imgHeight) * canvas.height;
          
          // Create a cropped canvas for this page
          const pageCanvas = document.createElement('canvas');
          const pageCtx = pageCanvas.getContext('2d');
          
          if (!pageCtx) {
            throw new Error('Could not get canvas context');
          }
          
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
          
          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          
          if (pageNumber > 1) {
            pdf.addPage();
          }
          
          pdf.addImage(pageImgData, 'PNG', xOffset, yOffset, imgWidth, pageHeight);
          
          sourceY += sourceHeight;
          remainingHeight -= pageHeight;
          pageNumber++;
        }
      } else {
        // Single page
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      }
      
      const filename = `${invoiceData?.invoiceNumber || `invoice-${orderId}`}.pdf`;
      pdf.save(filename);

      toast({
        title: "PDF Downloaded",
        description: `Your invoice has been downloaded as ${filename}`,
      });
    } catch (error: any) {
      console.error('PDF generation error:', error);
      
      // Fallback: Create a simple text-based PDF
      try {
        console.log('Attempting fallback PDF generation...');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 20;
        const lineHeight = 7;
        let yPosition = margin;
        
        // Helper function to add text with word wrapping
        const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
          pdf.setFontSize(fontSize);
          if (isBold) {
            pdf.setFont('helvetica', 'bold');
          } else {
            pdf.setFont('helvetica', 'normal');
          }
          
          const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
          lines.forEach((line: string) => {
            if (yPosition > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(line, margin, yPosition);
            yPosition += lineHeight;
          });
          yPosition += 3; // Extra spacing after text block
        };
        
        // Add invoice content
        addText('REV WINNER', 20, true);
        addText('AI-Powered Sales Intelligence Platform', 12);
        addText('Healthcaa Technologies Inc.', 12);
        addText('support@revwinner.com | https://revwinner.com', 10);
        yPosition += 10;
        
        addText(`INVOICE #${invoiceData?.invoiceNumber || 'N/A'}`, 16, true);
        addText(`Order ID: ${invoiceData?.orderId || orderId}`, 10);
        addText(`Date: ${formatDate(invoiceData?.invoiceDate || new Date().toISOString())}`, 10);
        yPosition += 10;
        
        addText('BILL TO:', 12, true);
        addText(`${invoiceData?.customer?.name || 'Customer'}`, 12);
        addText(`${invoiceData?.customer?.email || 'N/A'}`, 10);
        if (invoiceData?.customer?.mobile) {
          addText(`${invoiceData.customer.mobile}`, 10);
        }
        if (invoiceData?.customer?.organization) {
          addText(`${invoiceData.customer.organization}`, 10);
        }
        yPosition += 10;
        
        addText('ORDER DETAILS:', 12, true);
        if (invoiceData?.items && invoiceData.items.length > 0) {
          invoiceData.items.forEach((item, index) => {
            addText(`${index + 1}. ${item.packageName}`, 11, true);
            addText(`   SKU: ${item.packageSku}`, 9);
            addText(`   ${item.description}`, 9);
            
            // Show discount if applicable
            if (item.discount && parseFloat(item.discount) > 0) {
              addText(`   Quantity: ${item.quantity} | Original: $${item.basePrice} | Discounted: $${item.unitPrice}`, 9);
            } else {
              addText(`   Quantity: ${item.quantity} | Unit Price: $${item.unitPrice}`, 9);
            }
            
            addText(`   Total: $${item.totalWithGst}`, 10, true);
            yPosition += 5;
          });
        } else {
          addText('No items found for this order.', 10);
        }
        
        yPosition += 10;
        addText('PAYMENT SUMMARY:', 12, true);
        addText(`Subtotal: $${invoiceData?.summary?.subtotal?.toFixed(2) || '0.00'}`, 11);
        if (invoiceData?.summary?.discount && invoiceData.summary.discount > 0) {
          addText(`Discount: -$${invoiceData.summary.discount.toFixed(2)}`, 11);
        }
        if (invoiceData?.summary?.gst && invoiceData.summary.gst > 0) {
          addText(`GST (${invoiceData.summary.gstRate}%): $${invoiceData.summary.gst.toFixed(2)}`, 11);
        }
        addText(`TOTAL PAID: $${invoiceData?.summary?.total?.toFixed(2) || '0.00'}`, 14, true);
        
        if (invoiceData?.summary?.amountInWords) {
          yPosition += 5;
          addText(`Amount in Words: ${invoiceData.summary.amountInWords}`, 9);
        }
        
        yPosition += 15;
        addText('PAYMENT DETAILS:', 12, true);
        addText(`Payment Method: ${invoiceData?.payment?.method || 'N/A'}`, 10);
        addText(`Transaction ID: ${invoiceData?.payment?.transactionId || 'N/A'}`, 10);
        addText(`Payment Date: ${formatDate(invoiceData?.payment?.paymentDate || new Date().toISOString())}`, 10);
        addText(`Status: ${invoiceData?.payment?.status?.toUpperCase() || 'COMPLETED'}`, 10);
        
        yPosition += 15;
        addText('TERMS & CONDITIONS:', 12, true);
        if (invoiceData?.terms) {
          invoiceData.terms.forEach((term, index) => {
            addText(`${index + 1}. ${term}`, 9);
          });
        }
        
        yPosition += 10;
        addText('Thank you for your business!', 12, true);
        if (invoiceData?.company?.email) {
          addText(`For any questions, please contact ${invoiceData.company.email}`, 10);
        }
        
        const filename = `${invoiceData?.invoiceNumber || `invoice-${orderId}`}.pdf`;
        pdf.save(filename);
        
        toast({
          title: "PDF Downloaded (Text Version)",
          description: `Your invoice has been downloaded as ${filename}`,
        });
      } catch (fallbackError) {
        console.error('Fallback PDF generation also failed:', fallbackError);
        toast({
          title: "Download Failed",
          description: `Failed to generate PDF: ${error.message}. Please try again or contact support.`,
          variant: "destructive",
        });
      }
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
        <div className="flex justify-center gap-4 mb-8">
          <Button
            size="lg"
            onClick={handleDownloadPDF}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
            data-testid="button-download-pdf"
          >
            <Download className="mr-2 h-5 w-5" />
            Download PDF Invoice
          </Button>
          
          {/* Debug button - temporary */}
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              console.log('Invoice Data:', invoiceData);
              console.log('Order ID:', orderId);
              console.log('Invoice Ref:', invoiceRef.current);
              if (invoiceRef.current) {
                console.log('Element dimensions:', {
                  offsetWidth: invoiceRef.current.offsetWidth,
                  offsetHeight: invoiceRef.current.offsetHeight,
                  scrollWidth: invoiceRef.current.scrollWidth,
                  scrollHeight: invoiceRef.current.scrollHeight
                });
              }
            }}
          >
            Debug Info
          </Button>
        </div>

        {/* Invoice Card */}
        <Card 
          ref={invoiceRef}
          className="bg-white border-2 border-gray-300 max-w-4xl mx-auto"
          data-testid="invoice-card"
          style={{ 
            minHeight: '800px',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            lineHeight: '1.4',
            padding: '16px',
            display: 'block',
            visibility: 'visible',
            position: 'relative'
          }}
        >
          {/* Invoice Header */}
          <CardHeader className="space-y-3 pb-4" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <img src={logoPath} alt="Company Logo" className="h-10 w-auto" />
                  <div>
                    {(invoiceData.company.name || invoiceData.company.email || invoiceData.company.website) ? (
                      <>
                        {invoiceData.company.name && <h2 className="text-xl font-bold" style={{ color: '#000000' }}>{invoiceData.company.name}</h2>}
                        {invoiceData.company.address && invoiceData.company.address.split('\n').filter(Boolean).map((line, i) => (
                          <p key={i} className="text-sm" style={{ color: '#666666' }}>{line}</p>
                        ))}
                        {invoiceData.company.email && <p className="text-xs" style={{ color: '#666666' }}>{invoiceData.company.email}</p>}
                        {invoiceData.company.website && <p className="text-xs" style={{ color: '#666666' }}>{invoiceData.company.website}</p>}
                      </>
                    ) : (
                      <h2 className="text-xl font-bold" style={{ color: '#000000' }}>Invoice</h2>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex justify-end mb-2">
                  <Badge className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-sm font-semibold rounded-full flex items-center justify-center min-w-[120px]" style={{ backgroundColor: '#22c55e', color: '#ffffff' }}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {invoiceData.payment.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm font-semibold" style={{ color: '#000000' }}>
                  Invoice #{invoiceData.invoiceNumber}
                </div>
                <div className="text-xs" style={{ color: '#666666' }}>
                  Order: {invoiceData.orderId.substring(0, 12)}...
                </div>
              </div>
            </div>

            <Separator style={{ backgroundColor: '#e5e7eb' }} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2" style={{ color: '#000000' }}>Bill To:</h3>
                <div className="text-sm space-y-1" style={{ color: '#666666' }}>
                  <div className="font-medium" style={{ color: '#000000' }}>{invoiceData.customer.name}</div>
                  <div>{invoiceData.customer.email}</div>
                  {invoiceData.customer.mobile && <div>{invoiceData.customer.mobile}</div>}
                  {invoiceData.customer.organization && <div>{invoiceData.customer.organization}</div>}
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center gap-2 text-sm mb-1" style={{ color: '#666666' }}>
                      <Calendar className="h-4 w-4" />
                      <span>Invoice Date:</span>
                    </div>
                    <div className="font-semibold" style={{ color: '#000000' }}>{formatDate(invoiceData.invoiceDate)}</div>
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: '#666666' }}>Payment Date:</div>
                    <div className="font-semibold" style={{ color: '#000000' }}>{formatDate(invoiceData.payment.paymentDate)}</div>
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: '#666666' }}>Payment Method:</div>
                    <div className="font-semibold capitalize" style={{ color: '#000000' }}>{invoiceData.payment.method}</div>
                  </div>
                  {invoiceData.payment.transactionId && (
                    <div>
                      <div className="text-sm" style={{ color: '#666666' }}>Transaction ID:</div>
                      <div className="font-mono text-xs break-all" style={{ color: '#000000' }}>{invoiceData.payment.transactionId}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Invoice Items */}
          <CardContent className="space-y-4 py-4" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#000000' }}>
                <Package className="h-5 w-5" />
                Order Details
              </h3>
              
              {(!invoiceData?.items || invoiceData.items.length === 0) ? (
                <div className="border border-gray-300 rounded-lg p-4 text-center" style={{ backgroundColor: '#f9fafb' }}>
                  <p style={{ color: '#666666' }}>No items found for this order.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoiceData.items.map((item, index) => (
                    <div key={index} className="border border-gray-300 rounded-lg p-3" style={{ backgroundColor: '#ffffff' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-base" style={{ color: '#000000' }}>{item.packageName}</div>
                          <div className="text-sm mb-1" style={{ color: '#666666' }}>SKU: {item.packageSku}</div>
                          <div className="text-sm mb-2" style={{ color: '#666666' }}>{item.description}</div>
                          <div className="inline-block px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                            {item.addonType.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold" style={{ color: '#7c3aed' }}>
                            ${item.totalWithGst}
                          </div>
                          {parseFloat(item.gstAmount) > 0 && (
                            <div className="text-xs" style={{ color: '#666666' }}>
                              (incl. ${item.gstAmount} GST @ {item.gstRate}%)
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '8px 0' }}></div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span style={{ color: '#666666' }}>Quantity:</span>
                          <span className="font-semibold ml-2" style={{ color: '#000000' }}>{item.quantity}</span>
                        </div>
                        <div>
                          <span style={{ color: '#666666' }}>Unit Price:</span>
                          {item.discount && parseFloat(item.discount) > 0 ? (
                            <span className="ml-2">
                              <span className="line-through text-muted-foreground mr-2" style={{ color: '#999999' }}>${item.basePrice}</span>
                              <span className="font-semibold" style={{ color: '#16a34a' }}>${item.unitPrice}</span>
                            </span>
                          ) : (
                            <span className="font-semibold ml-2" style={{ color: '#000000' }}>${item.unitPrice}</span>
                          )}
                        </div>
                        <div>
                          <span style={{ color: '#666666' }}>Start Date:</span>
                          <span className="font-semibold ml-2" style={{ color: '#000000' }}>{formatDate(item.startDate)}</span>
                        </div>
                        <div>
                          <span style={{ color: '#666666' }}>Expiry Date:</span>
                          <span className="font-semibold ml-2" style={{ color: '#000000' }}>
                            {item.endDate ? formatDate(item.endDate) : 'No expiry'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ height: '1px', backgroundColor: '#e5e7eb' }}></div>

            {/* Price Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-base">
                <span style={{ color: '#666666' }}>Subtotal</span>
                <span className="font-semibold" style={{ color: '#000000' }}>
                  ${invoiceData.summary.subtotal.toFixed(2)}
                </span>
              </div>
              {invoiceData.summary.discount > 0 && (
                <div className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2" style={{ color: '#16a34a' }}>
                    <span>Discount</span>
                  </div>
                  <span className="font-semibold" style={{ color: '#16a34a' }}>
                    -${invoiceData.summary.discount.toFixed(2)}
                  </span>
                </div>
              )}
              {invoiceData.summary.gst > 0 && (
                <div className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2" style={{ color: '#666666' }}>
                    <DollarSign className="h-4 w-4" style={{ color: '#7c3aed' }} />
                    <span>GST ({invoiceData.summary.gstRate}%)</span>
                  </div>
                  <span className="font-semibold" style={{ color: '#7c3aed' }}>
                    ${invoiceData.summary.gst.toFixed(2)}
                  </span>
                </div>
              )}
              <div style={{ height: '1px', backgroundColor: '#e5e7eb' }}></div>
              <div className="flex items-center justify-between text-xl font-bold">
                <span style={{ color: '#000000' }}>Total Paid</span>
                <span style={{ color: '#7c3aed' }}>
                  ${invoiceData.summary.total.toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-center mt-2" style={{ color: '#666666' }}>
                <strong>Amount in Words:</strong> {invoiceData.summary.amountInWords}
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t pt-4" style={{ backgroundColor: '#f9fafb', borderTopColor: '#e5e7eb' }}>
            <div className="w-full space-y-3">
              {/* Terms and Conditions */}
              <div>
                <h4 className="font-semibold mb-2" style={{ color: '#000000' }}>Terms & Conditions:</h4>
                <ul className="text-xs space-y-1" style={{ color: '#666666' }}>
                  {invoiceData.terms.map((term, index) => (
                    <li key={index}>• {term}</li>
                  ))}
                </ul>
              </div>
              
              <div style={{ height: '1px', backgroundColor: '#e5e7eb' }}></div>
              
              {/* Footer */}
              <div className="text-center text-sm" style={{ color: '#666666' }}>
                <p className="font-semibold" style={{ color: '#000000' }}>Thank you for your business!</p>
                {invoiceData.company.email && <p className="mt-1">For any questions, please contact {invoiceData.company.email}</p>}
                <p className="text-xs mt-2">
                  Generated on {formatDate(invoiceData.generatedAt)} | 
                  Invoice #{invoiceData.invoiceNumber}
                </p>
                {invoiceData.company.gstNumber && (
                  <p className="text-xs">GST Number: {invoiceData.company.gstNumber}</p>
                )}
              </div>
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
