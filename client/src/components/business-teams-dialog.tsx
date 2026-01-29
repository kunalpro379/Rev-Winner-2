import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";

const businessTeamsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid business email"),
  phone: z.string().min(10, "Please enter a valid phone number").optional().or(z.literal("")),
  totalSeats: z.coerce.number().min(5, "Minimum 5 seats for business teams"),
  estimatedTimeline: z.string().min(1, "Please select a timeline"),
  message: z.string().optional(),
});

type BusinessTeamsFormData = z.infer<typeof businessTeamsSchema>;

interface BusinessTeamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BusinessTeamsDialog({ open, onOpenChange }: BusinessTeamsDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BusinessTeamsFormData>({
    resolver: zodResolver(businessTeamsSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      totalSeats: 5,
      estimatedTimeline: "",
      message: "",
    },
  });

  async function onSubmit(data: BusinessTeamsFormData) {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/leads/business-teams", data);

      toast({
        title: "Request Submitted Successfully!",
        description: "Our sales team will contact you within 24 hours to discuss your custom pricing.",
      });

      form.reset();
      onOpenChange(false);
      
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" data-testid="dialog-business-teams">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
            Contact Sales - Business Teams
          </DialogTitle>
          <DialogDescription>
            Fill out the form below and our sales team will reach out to you with a custom quote tailored to your team's needs.
          </DialogDescription>
        </DialogHeader>

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
                      data-testid="input-business-name"
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
                  <FormLabel>Business Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@company.com"
                      {...field}
                      data-testid="input-business-email"
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
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      {...field}
                      data-testid="input-business-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalSeats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Number of Seats *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      placeholder="e.g., 10"
                      {...field}
                      data-testid="input-business-seats"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedTimeline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Timeline to Buy *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-business-timeline">
                        <SelectValue placeholder="Select a timeline" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Immediate (within 1 week)">Immediate (within 1 week)</SelectItem>
                      <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                      <SelectItem value="2-4 weeks">2-4 weeks</SelectItem>
                      <SelectItem value="1-2 months">1-2 months</SelectItem>
                      <SelectItem value="3+ months">3+ months</SelectItem>
                      <SelectItem value="Just researching">Just researching</SelectItem>
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
                  <FormLabel>Additional Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any specific requirements or questions..."
                      className="resize-none"
                      rows={4}
                      {...field}
                      data-testid="textarea-business-message"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                data-testid="button-submit-business"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
