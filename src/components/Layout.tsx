import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
interface LayoutProps {
  children: React.ReactNode;
}
export function Layout({
  children
}: LayoutProps) {
  return <div className="min-h-screen flex flex-col bg-background">
      <header role="banner" className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav role="navigation" aria-label="Main navigation" className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary" aria-label="HalalChecker Home">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              <span className="hidden sm:inline">HalalChecker</span>
            </Link>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/about">
                <Button variant="ghost" size="sm">About</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main role="main" className="flex-1">
        {children}
      </main>

      <footer role="contentinfo" className="border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} HalalChecker. For informational purposes only. Not a substitute for official halal certification.</p>
        </div>
      </footer>
    </div>;
}