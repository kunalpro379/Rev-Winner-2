import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Check, X } from "lucide-react";

interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function NewSessionDialog({ open, onOpenChange, onConfirm }: NewSessionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md" data-testid="dialog-new-session">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <AlertDialogTitle className="text-xl">Start New Session?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-4">
            <p className="text-sm text-muted-foreground">
              This will reset your current call session and prepare for a new conversation.
            </p>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  Will be cleared:
                </h4>
                <ul className="text-xs space-y-1 text-muted-foreground ml-6">
                  <li>• Live transcript and conversation history</li>
                  <li>• Conversation analysis and Q&A messages</li>
                  <li>• Real-time sales tips (Shift Gears)</li>
                  <li>• Meeting minutes</li>
                  <li>• Generated sales materials (Present to Win)</li>
                  <li>• Session timer</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Will be preserved:
                </h4>
                <ul className="text-xs space-y-1 text-muted-foreground ml-6">
                  <li>• Your domain expertise selection</li>
                  <li>• AI engine settings and preferences</li>
                  <li>• Learned conversation style and patterns</li>
                  <li>• Account and subscription status</li>
                </ul>
              </div>
            </div>
            
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
              Note: This action cannot be undone. Make sure you've exported any important data.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-new-session">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            data-testid="button-confirm-new-session"
          >
            Start New Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
