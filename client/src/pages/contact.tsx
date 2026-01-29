import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Send, Sparkles } from "lucide-react";
import { HamburgerNav } from "@/components/hamburger-nav";
import { DemoRequestModal } from "@/components/demo-request-modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useSEO } from "@/hooks/use-seo";
import { StructuredData } from "@/components/structured-data";

// Contact page structured data - Using Organization schema for SaaS product
const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Rev Winner",
  "alternateName": "Healthcaa Technologies",
  "description": "AI-powered sales assistant platform providing real-time conversation intelligence, live transcription, and automated meeting minutes for B2B sales teams.",
  "url": "https://revwinner.com",
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+1-832-632-8555",
      "contactType": "customer support",
      "email": "support@revwinner.com",
      "areaServed": ["US", "CA"],
      "availableLanguage": ["English"]
    },
    {
      "@type": "ContactPoint",
      "telephone": "+1-832-632-8555",
      "contactType": "sales",
      "email": "sales@revwinner.com",
      "areaServed": ["US", "CA"],
      "availableLanguage": ["English"]
    },
    {
      "@type": "ContactPoint",
      "telephone": "+91-8130276382",
      "contactType": "customer support",
      "email": "support@revwinner.com",
      "areaServed": "Worldwide",
      "availableLanguage": ["English"]
    }
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Business Plaza",
    "addressLocality": "Lucknow",
    "addressRegion": "Uttar Pradesh",
    "postalCode": "226001",
    "addressCountry": "IN"
  },
  "sameAs": [
    "https://www.linkedin.com/company/revwinner",
    "https://twitter.com/revwinner"
  ]
};

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  department: z.enum(["sales", "support"], {
    required_error: "Please select a department",
  }),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  
  useSEO({
    title: "Contact Us - Rev Winner | Sales Support & Inquiries",
    description: "Get in touch with Rev Winner's sales and support team. Located in Lucknow, India. Call +91 8130276382 or send us a message for assistance with your sales intelligence needs.",
    keywords: "Rev Winner contact, sales intelligence support, AI sales assistant support, conversation intelligence contact, sales software support, Rev Winner sales team, B2B sales software contact, AI sales coach support, Lucknow India sales software, sales enablement support",
    ogImage: "https://revwinner.com/og-image.png",
    ogUrl: "https://revwinner.com/contact"
  });

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "sales",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/leads/contact-form", data);
      
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });
      
      form.reset();
    } catch (error: any) {
      toast({
        title: "Failed to Send",
        description: error.message || "Please try again or email us directly at support@revwinner.com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <StructuredData data={contactPageSchema} />
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <HamburgerNav currentPath="/contact" />

      {/* Contact Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground dark:text-white mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground dark:text-white/70 max-w-2xl mx-auto mb-6">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
          <Button 
            onClick={() => setIsDemoModalOpen(true)}
            className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white"
            size="lg"
            data-testid="button-request-demo-contact"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Request a Demo
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Company Info Cards */}
          <Card className="p-6 border-border/50 hover:border-fuchsia-600/50 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">Email</h3>
            <p className="text-muted-foreground dark:text-white/70">support@revwinner.com</p>
            <p className="text-muted-foreground dark:text-white/70">sales@revwinner.com</p>
          </Card>

          <Card className="p-6 border-border/50 hover:border-fuchsia-600/50 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">Phone</h3>
            <div className="space-y-2">
              <div>
                <p className="text-muted-foreground dark:text-white/70 font-medium">🇺🇸 USA / Canada</p>
                <a href="tel:+18326328555" className="text-fuchsia-600 dark:text-fuchsia-400 hover:underline font-semibold">+1 (832) 632-8555</a>
              </div>
              <div>
                <p className="text-muted-foreground dark:text-white/70 font-medium">🇮🇳 India</p>
                <a href="tel:+918130276382" className="text-muted-foreground dark:text-white/70 hover:underline">+91 8130276382</a>
              </div>
            </div>
            <p className="text-sm text-muted-foreground dark:text-white/60 mt-3">Demo bookings, support & inquiries</p>
          </Card>

          <Card className="p-6 border-border/50 hover:border-fuchsia-600/50 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">Address</h3>
            <p className="text-muted-foreground dark:text-white/70">34, Vigyan Khand, Gomti Nagar Extension</p>
            <p className="text-muted-foreground dark:text-white/70">Lucknow, Uttar Pradesh (India) - 226010</p>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 border-border/50">
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">Send us a Message</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your name" 
                          {...field} 
                          data-testid="input-contact-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="your.email@example.com" 
                          {...field} 
                          data-testid="input-contact-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-department">
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sales" data-testid="option-sales">
                            Sales - sales@revwinner.com
                          </SelectItem>
                          <SelectItem value="support" data-testid="option-support">
                            Support - support@revwinner.com
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="How can we help you?" 
                          className="min-h-[150px]"
                          {...field} 
                          data-testid="input-contact-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
                  disabled={isSubmitting}
                  data-testid="button-submit-contact"
                >
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </Card>
        </div>

      </section>

      {/* Full Footer */}
      <footer className="bg-gradient-to-br from-purple-50/80 via-slate-50 to-pink-50/80 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 border-t border-purple-200/50 dark:border-purple-500/20 mt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-4">Rev Winner</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4 max-w-md">
                AI-powered sales assistant for real-time conversation intelligence. Close more deals with live transcription, instant coaching, and automated meeting minutes.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
                📍 Location: Lucknow, Uttar Pradesh, India
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                📞 USA/Canada: <a href="tel:+18326328555" className="text-purple-600 dark:text-purple-400 hover:underline">+1 (832) 632-8555</a> • India: <a href="tel:+918130276382" className="text-purple-600 dark:text-purple-400 hover:underline">+91 8130276382</a>
              </p>
            </div>

            {/* Footer Links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              {/* Company */}
              <div>
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-4">Company</h3>
                <ul className="space-y-2">
                  <li>
                    <button onClick={() => setLocation('/')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      Home
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setLocation('/blog')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      Blog
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setLocation('/help')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      Help Center
                    </button>
                  </li>
                </ul>
              </div>

              {/* Product */}
              <div>
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-4">Product</h3>
                <ul className="space-y-2">
                  <li>
                    <button onClick={() => setLocation('/packages')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      Pricing
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setLocation('/register')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
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
                    <button onClick={() => setLocation('/terms')} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      Terms & Conditions
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-purple-200/50 dark:border-purple-500/20 pt-8 text-center text-slate-600 dark:text-slate-400">
            <p>© 2025 Rev Winner. All rights reserved.</p>
            <p className="text-sm mt-2">A Product from Healthcaa Technologies</p>
          </div>
        </div>
      </footer>
    </div>
    
    <DemoRequestModal 
      open={isDemoModalOpen} 
      onOpenChange={setIsDemoModalOpen} 
    />
    </>
  );
}
