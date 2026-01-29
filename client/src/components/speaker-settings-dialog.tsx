import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Check } from "lucide-react";

interface SpeakerSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  speakers: string[];
  onUpdateSpeaker: (index: number, label: string) => void;
}

const PRESET_ROLES = [
  "Client",
  "AE",
  "Solution Architect",
  "SE",
  "Sales Engineer",
  "Account Manager",
  "Technical Lead",
  "Customer",
  "Prospect",
  "Decision Maker",
];

export function SpeakerSettingsDialog({ open, onOpenChange, speakers, onUpdateSpeaker }: SpeakerSettingsDialogProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempLabel, setTempLabel] = useState("");

  // Reset editing state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEditingIndex(null);
      setTempLabel("");
    }
    onOpenChange(newOpen);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setTempLabel(speakers[index]);
  };

  const handleSaveLabel = () => {
    if (editingIndex !== null && tempLabel.trim()) {
      onUpdateSpeaker(editingIndex, tempLabel.trim());
      setEditingIndex(null);
      setTempLabel("");
    }
  };

  const handlePresetClick = (preset: string) => {
    if (editingIndex !== null) {
      setTempLabel(preset);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveLabel();
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
      setTempLabel("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="speaker-settings-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Customize Speaker Labels
          </DialogTitle>
          <DialogDescription>
            Rename speakers to match their roles in the conversation. Click on a speaker to edit their label.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {speakers.map((speaker, index) => (
            <div key={index} className="space-y-2">
              <Label className="text-sm font-medium">Speaker {index + 1}</Label>
              {editingIndex === index ? (
                <div className="space-y-3">
                  <Input
                    value={tempLabel}
                    onChange={(e) => setTempLabel(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter custom label..."
                    autoFocus
                    className="font-medium"
                    data-testid={`input-speaker-${index}`}
                  />
                  <div className="flex flex-wrap gap-2">
                    <p className="text-xs text-muted-foreground w-full mb-1">Quick presets:</p>
                    {PRESET_ROLES.map((preset) => (
                      <Badge
                        key={preset}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handlePresetClick(preset)}
                        data-testid={`preset-${preset.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {preset}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveLabel}
                      disabled={!tempLabel.trim()}
                      data-testid={`save-speaker-${index}`}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingIndex(null);
                        setTempLabel("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start font-medium h-auto py-3"
                  onClick={() => handleStartEdit(index)}
                  data-testid={`edit-speaker-${index}`}
                >
                  <User className="h-4 w-4 mr-2 text-primary" />
                  {speaker}
                </Button>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={() => handleOpenChange(false)} data-testid="close-speaker-settings">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
