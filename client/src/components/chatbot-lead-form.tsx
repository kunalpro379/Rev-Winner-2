import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const leadFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  companyName: z.string().optional(),
  jobTitle: z.string().optional(),
});

export type ChatbotLead = z.infer<typeof leadFormSchema>;

interface ChatbotLeadFormProps {
  onSubmit: (leadData: ChatbotLead) => void;
  isLoading?: boolean;
}

export function ChatbotLeadForm({ onSubmit, isLoading = false }: ChatbotLeadFormProps) {
  const [formData, setFormData] = useState<ChatbotLead>({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
    jobTitle: "",
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof ChatbotLead, string>>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    try {
      leadFormSchema.parse(formData);
      setErrors({});
      onSubmit(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof ChatbotLead, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof ChatbotLead] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const handleChange = (field: keyof ChatbotLead, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-slate-900 dark:to-purple-950/30 rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2">
          👋 Welcome! Let's get to know you
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Before we start chatting, please share a few details so we can help you better.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <Label htmlFor="fullName" className="text-sm font-medium">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            placeholder="John Doe"
            className={errors.fullName ? "border-red-500" : ""}
            disabled={isLoading}
            data-testid="input-lead-fullname"
          />
          {errors.fullName && (
            <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-sm font-medium">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="john@company.com"
            className={errors.email ? "border-red-500" : ""}
            disabled={isLoading}
            data-testid="input-lead-email"
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+1 234 567 8900"
            className={errors.phone ? "border-red-500" : ""}
            disabled={isLoading}
            data-testid="input-lead-phone"
          />
          {errors.phone && (
            <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Company Name (Optional) */}
        <div>
          <Label htmlFor="companyName" className="text-sm font-medium">
            Company Name <span className="text-slate-400">(Optional)</span>
          </Label>
          <Input
            id="companyName"
            type="text"
            value={formData.companyName}
            onChange={(e) => handleChange("companyName", e.target.value)}
            placeholder="Acme Corp"
            disabled={isLoading}
            data-testid="input-lead-company"
          />
        </div>

        {/* Job Title (Optional) */}
        <div>
          <Label htmlFor="jobTitle" className="text-sm font-medium">
            Job Title <span className="text-slate-400">(Optional)</span>
          </Label>
          <Input
            id="jobTitle"
            type="text"
            value={formData.jobTitle}
            onChange={(e) => handleChange("jobTitle", e.target.value)}
            placeholder="Sales Manager"
            disabled={isLoading}
            data-testid="input-lead-jobtitle"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
          disabled={isLoading}
          data-testid="button-submit-lead-form"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting chat...
            </>
          ) : (
            "Start Chatting"
          )}
        </Button>
      </form>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
        By continuing, you agree to receive product updates and support emails.
      </p>
    </div>
  );
}
