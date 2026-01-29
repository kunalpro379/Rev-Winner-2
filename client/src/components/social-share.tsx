import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Linkedin, Link2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  url?: string;
  title?: string;
  description?: string;
  className?: string;
}

export function SocialShare({ 
  url = window.location.href, 
  title = "Rev Winner - AI Sales Assistant",
  description = "Turn every sales call into a closed deal with Rev Winner",
  className = ""
}: SocialShareProps) {
  const { toast } = useToast();

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    const width = 600;
    const height = 400;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    if (platform === 'email') {
      window.location.href = shareLinks[platform];
    } else {
      window.open(
        shareLinks[platform],
        '_blank',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied!",
        description: "The URL has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to Copy",
        description: "Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">Share:</span>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleShare('facebook')}
        className="h-9 w-9"
        data-testid="button-share-facebook"
        title="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => handleShare('twitter')}
        className="h-9 w-9"
        data-testid="button-share-twitter"
        title="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => handleShare('linkedin')}
        className="h-9 w-9"
        data-testid="button-share-linkedin"
        title="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => handleShare('email')}
        className="h-9 w-9"
        data-testid="button-share-email"
        title="Share via Email"
      >
        <Mail className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={copyToClipboard}
        className="h-9 w-9"
        data-testid="button-copy-link"
        title="Copy Link"
      >
        <Link2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
