import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Briefcase, Save, Edit2, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DomainExpertise {
  id: string;
  name: string;
  description: string | null;
}

interface DomainExpertiseSelectorProps {
  value: string;
  onChange: (domain: string, domainId?: string) => void;
}

export const UNIVERSAL_RV_MODE = "Universal RV";

export function isUniversalRVMode(domain: string): boolean {
  return domain === UNIVERSAL_RV_MODE;
}

export function DomainExpertiseSelector({ value, onChange }: DomainExpertiseSelectorProps) {
  const [isEditing, setIsEditing] = useState(!value);
  const [inputValue, setInputValue] = useState(value);
  const [useCustomDomain, setUseCustomDomain] = useState(false);
  const { toast } = useToast();
  
  // Fetch user's domain expertise profiles
  const { data: domains } = useQuery<DomainExpertise[]>({
    queryKey: ['/api/domain-expertise'],
    retry: false, // Don't retry if 403 (no subscription)
  });

  const handleSave = () => {
    if (!inputValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product or company name",
        variant: "destructive"
      });
      return;
    }

    const trimmedValue = inputValue.trim();
    onChange(trimmedValue, undefined);
    setIsEditing(false);
    setUseCustomDomain(false);
    
    // Special toast for Universal RV mode activation
    if (isUniversalRVMode(trimmedValue)) {
      toast({
        title: "Universal RV Mode Activated",
        description: "Unrestricted topic support enabled. Dynamic domain awareness is active.",
      });
    } else {
      toast({
        title: "Domain Expertise Updated",
        description: `Assistant is now configured for ${trimmedValue}`,
      });
    }
  };

  const handleEdit = () => {
    // Reset to empty input when editing (don't copy Universal RV as it's a special mode)
    setInputValue(isUniversalRVMode(value) ? '' : value);
    setIsEditing(true);
    setUseCustomDomain(false); // Reset custom domain toggle
  };
  
  const handleSelectDomain = (domainId: string) => {
    const selectedDomain = domains?.find(d => d.id === domainId);
    if (selectedDomain) {
      onChange(selectedDomain.name, selectedDomain.id);
      setIsEditing(false);
      toast({
        title: "Domain Selected",
        description: `Using ${selectedDomain.name} with uploaded training materials`,
      });
    }
  };
  
  // Auto-select first domain if available and no value set
  // CRITICAL: Don't override Universal RV mode or when user is editing
  useEffect(() => {
    // Skip auto-select if:
    // 1. A value is already set (including Universal RV)
    // 2. User is in editing mode
    // 3. User has selected custom domain option
    // 4. No trained domains available
    if (value || !domains || domains.length === 0 || useCustomDomain || isEditing) {
      return;
    }
    onChange(domains[0].name, domains[0].id);
  }, [domains, value, useCustomDomain, isEditing]);
  
  // Track if current mode is Universal RV for UI display
  const isCurrentUniversal = isUniversalRVMode(value);

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent overflow-hidden mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Domain Expertise {domains && domains.length > 0 && "(Select from trained domains or enter custom)"}
            </label>
            {isEditing ? (
              <div className="space-y-3">
                {/* Show domain selector if domains exist and user has Train Me subscription */}
                {domains && domains.length > 0 && !useCustomDomain && (
                  <div className="flex items-center gap-2">
                    <Select onValueChange={handleSelectDomain}>
                      <SelectTrigger className="h-9 bg-background border-primary/30 focus:border-primary rounded-lg" data-testid="select-domain-expertise">
                        <SelectValue placeholder="Select from your trained domains..." />
                      </SelectTrigger>
                      <SelectContent>
                        {domains.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id} data-testid={`option-domain-${domain.id}`}>
                            {domain.name} {domain.description && `- ${domain.description}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => setUseCustomDomain(true)}
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 rounded-lg whitespace-nowrap"
                      data-testid="button-use-custom-domain"
                    >
                      Custom
                    </Button>
                  </div>
                )}
                
                {/* Show custom input */}
                {(useCustomDomain || !domains || domains.length === 0) && (
                  <div className="flex items-center gap-2">
                    <Input
                      data-testid="input-domain-expertise"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="e.g., ServiceNow, Salesforce, HubSpot, Azure..."
                      className="h-9 bg-background border-primary/30 focus:border-primary rounded-lg"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSave();
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      data-testid="button-save-domain"
                      onClick={handleSave}
                      size="sm"
                      className="h-9 px-4 bg-primary hover:bg-primary/90 rounded-lg"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      Save
                    </Button>
                    {domains && domains.length > 0 && (
                      <Button
                        onClick={() => setUseCustomDomain(false)}
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 rounded-lg"
                        data-testid="button-back-to-select"
                      >
                        Back
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isUniversalRVMode(value) ? (
                    <>
                      <Globe className="h-4 w-4 text-violet-500" />
                      <span className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent" data-testid="text-domain-expertise">
                        {value}
                      </span>
                      <span className="px-2 py-0.5 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-600 dark:text-violet-400 text-xs font-medium rounded-full">
                        Universal Mode
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-foreground" data-testid="text-domain-expertise">
                        {value}
                      </span>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        Active
                      </span>
                    </>
                  )}
                </div>
                <Button
                  data-testid="button-edit-domain"
                  onClick={handleEdit}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 hover:bg-primary/10 rounded-lg"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
