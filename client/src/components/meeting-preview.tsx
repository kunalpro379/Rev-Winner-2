import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Move, Maximize2, Minimize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

type PreviewSize = "small" | "medium" | "large" | "fullscreen";

interface MeetingPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MeetingPreview({ isOpen, onClose }: MeetingPreviewProps) {
  const [step, setStep] = useState<"permission" | "preview">("permission");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [previewSize, setPreviewSize] = useState<PreviewSize>("medium");
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const sizeConfigs = {
    small: { width: 320, height: 180 },
    medium: { width: 480, height: 270 },
    large: { width: 640, height: 360 },
    fullscreen: { width: window.innerWidth - 40, height: window.innerHeight - 180 },
  };

  const handleRequestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser" as DisplayCaptureSurfaceType,
        },
        audio: false,
      });

      setMediaStream(stream);
      setStep("preview");

      // Handle stream ended event (user stopped sharing)
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        handleClosePreview();
      });

      toast({
        title: "Meeting Preview Active",
        description: "Your meeting is now visible in the floating preview window.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error capturing display:", error);
      toast({
        title: "Capture Failed",
        description: "Unable to capture the meeting. Please make sure you selected the correct tab or window.",
        variant: "destructive",
      });
    }
  };

  const handleClosePreview = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setStep("permission");
    setPreviewSize("medium");
    setPosition({ x: 100, y: 100 });
    onClose();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging from the header area
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('video')) {
      return; // Don't drag when clicking buttons or video
    }
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && previewRef.current) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Get current window dimensions
        const windowHeight = previewRef.current.offsetHeight;
        const windowWidth = previewRef.current.offsetWidth;
        
        // Clamp position to keep window fully on-screen
        const maxX = window.innerWidth - windowWidth;
        const maxY = window.innerHeight - windowHeight;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Reset position when switching to fullscreen and ensure it's on-screen
  useEffect(() => {
    if (previewSize === "fullscreen") {
      setPosition({ x: 20, y: 20 });
    } else if (previewRef.current) {
      // When changing sizes, ensure the window stays on-screen
      const windowHeight = previewRef.current.offsetHeight;
      const windowWidth = previewRef.current.offsetWidth;
      const maxX = window.innerWidth - windowWidth;
      const maxY = window.innerHeight - windowHeight;
      
      setPosition(prev => ({
        x: Math.max(0, Math.min(prev.x, maxX)),
        y: Math.max(0, Math.min(prev.y, maxY)),
      }));
    }
  }, [previewSize]);

  // Cleanup on unmount or when stream changes
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  const currentSize = sizeConfigs[previewSize];
  const controlsHeight = 90; // Height for header + controls

  return (
    <>
      {/* Permission Request Modal */}
      <Dialog open={isOpen && step === "permission"} onOpenChange={(open) => !open && onClose()}>
        <DialogContent data-testid="dialog-permission">
          <DialogHeader>
            <DialogTitle>Preview Your Meeting</DialogTitle>
            <DialogDescription>
              Select the tab or window where your meeting is running
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Important:</strong> This creates a view-only preview. To control your meeting (mute, camera, end call),
                you must use the original meeting tab. The preview is for monitoring your meeting while using Rev Winner.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              When the browser dialog opens, select the tab or window with your active meeting
              (Google Meet, Microsoft Teams, Zoom, Webex, or any other meeting platform).
            </p>
            <div className="flex gap-2">
              <Button onClick={handleRequestPermission} className="flex-1" data-testid="button-grant-permission">
                Preview My Meeting
              </Button>
              <Button variant="outline" onClick={onClose} data-testid="button-cancel-permission">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Preview Window */}
      {step === "preview" && mediaStream && (
        <div
          ref={previewRef}
          className="fixed z-[9999] shadow-2xl rounded-lg overflow-hidden border-2 border-primary bg-background flex flex-col"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${currentSize.width}px`,
            height: `${currentSize.height + controlsHeight}px`,
            pointerEvents: 'auto',
          }}
          data-testid="preview-window"
        >
          {/* Header with drag handle and close button */}
          <div 
            className="bg-primary text-primary-foreground px-3 py-2 flex items-center justify-between cursor-move select-none flex-shrink-0"
            onMouseDown={handleMouseDown}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <div className="flex items-center gap-2 pointer-events-none">
              <Move className="w-4 h-4" />
              <span className="text-sm font-medium">Meeting Preview (View Only)</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-primary-foreground/20 pointer-events-auto"
              onClick={handleClosePreview}
              data-testid="button-close-preview"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Video Preview */}
          <div 
            className="relative bg-black flex-1 overflow-hidden"
            style={{ height: currentSize.height }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
              data-testid="video-preview"
            />
            <div className="absolute bottom-2 left-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              ℹ️ Switch to your meeting tab to use controls (mute, camera, end call)
            </div>
          </div>

          {/* Control Panel - Resize Controls */}
          <div className="bg-background p-2 border-t border-border flex-shrink-0">
            <div className="flex gap-1 justify-center mb-1">
              {(["small", "medium", "large", "fullscreen"] as PreviewSize[]).map((size) => (
                <Button
                  key={size}
                  variant={previewSize === size ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewSize(size)}
                  className="flex-1 text-xs h-8"
                  data-testid={`button-size-${size}`}
                >
                  {size === "fullscreen" ? (
                    <Maximize2 className="w-3 h-3 mr-1" />
                  ) : size === "small" ? (
                    <Minimize2 className="w-3 h-3 mr-1" />
                  ) : null}
                  {size.charAt(0).toUpperCase() + size.slice(1, size === "fullscreen" ? 4 : undefined)}
                </Button>
              ))}
            </div>
            <p className="text-[10px] text-center text-muted-foreground">
              Resize preview window
            </p>
          </div>
        </div>
      )}
    </>
  );
}
