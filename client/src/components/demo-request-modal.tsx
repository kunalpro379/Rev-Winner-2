import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, CheckCircle2 } from "lucide-react";

const demoRequestSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().min(10, "Please tell us more about your needs (minimum 10 characters)"),
});

type DemoRequestFormData = z.infer<typeof demoRequestSchema>;

interface DemoRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoRequestModal({ open, onOpenChange }: DemoRequestModalProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<DemoRequestFormData>({
    resolver: zodResolver(demoRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: DemoRequestFormData) => {
      return await apiRequest("POST", "/api/leads/demo-request", data);
    },
    onSuccess: () => {
      setIsSuccess(true);
      form.reset();
      toast({
        title: "Demo Request Submitted!",
        description: "We'll contact you within 24 hours to schedule your personalized demo.",
      });
      setTimeout(() => {
        setIsSuccess(false);
        onOpenChange(false);
      }, 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again or contact us directly at sales@revwinner.com",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DemoRequestFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="modal-demo-request">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-fuchsia-600" />
            Request a Demo
          </DialogTitle>
          <DialogDescription>
            See Rev Winner in action! Fill out the form below and our team will reach out to schedule a personalized demo.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-12 text-center" data-testid="demo-success-message">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Thank You!</h3>
            <p className="text-muted-foreground">
              Your demo request has been received. We'll be in touch soon!
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Smith" 
                        {...field} 
                        data-testid="input-demo-name"
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
                    <FormLabel>Work Email *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="john@company.com" 
                        {...field} 
                        data-testid="input-demo-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Acme Corp" 
                        {...field} 
                        data-testid="input-demo-company"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+1 (555) 123-4567" 
                        {...field} 
                        data-testid="input-demo-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tell us about your needs *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What are you looking to improve in your sales process?"
                        className="min-h-[100px]"
                        {...field} 
                        data-testid="input-demo-message"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
                disabled={mutation.isPending}
                data-testid="button-submit-demo"
              >
                {mutation.isPending ? "Submitting..." : "Request Demo"}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
