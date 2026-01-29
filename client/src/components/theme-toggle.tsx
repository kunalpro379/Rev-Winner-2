import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full w-10 h-10 hover:bg-muted transition-all"
      data-testid="button-theme-toggle"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-400 hover:text-yellow-300 transition-colors" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 hover:text-slate-900 transition-colors" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
