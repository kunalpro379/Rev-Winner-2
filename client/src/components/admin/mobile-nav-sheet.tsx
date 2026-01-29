import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface NavItem {
  value: string;
  label: string;
  icon: ReactNode;
  testId: string;
}

interface MobileNavSheetProps {
  items: NavItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
  title?: string;
}

export function MobileNavSheet({ items, activeTab, onTabChange, title = "Navigation" }: MobileNavSheetProps) {
  const [open, setOpen] = useState(false);

  const handleTabChange = (value: string) => {
    onTabChange(value);
    setOpen(false);
  };

  const activeItem = items.find(item => item.value === activeTab);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-purple-500/30 hover:border-purple-500/50"
          data-testid="button-open-menu"
        >
          <Menu className="h-4 w-4" />
          <span className="max-w-[200px] truncate">{activeItem?.label || "Menu"}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] bg-gradient-to-b from-background to-purple-950/20">
        <SheetHeader className="border-b border-purple-500/20 pb-4 mb-4">
          <SheetTitle className="text-left bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {title}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1">
          {items.map((item) => (
            <Button
              key={item.value}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-11 px-3",
                activeTab === item.value
                  ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border border-purple-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-purple-600/10"
              )}
              onClick={() => handleTabChange(item.value)}
              data-testid={`nav-${item.testId}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
