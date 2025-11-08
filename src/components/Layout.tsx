import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LogOut, User, LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
interface LayoutProps {
  children: React.ReactNode;
}
export function Layout({
  children
}: LayoutProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  const checkAdminStatus = async (userId: string) => {
    const {
      data
    } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").single();
    setIsAdmin(!!data);
  };
  const handleLogout = async () => {
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to logout");
    } else {
      toast.success("Logged out successfully");
      navigate("/");
    }
  };
  return <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
              <ShieldCheck className="h-6 w-6" />
              <span className="hidden sm:inline">HalalChecker</span>
            </Link>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/about">
                <Button variant="ghost" size="sm">About</Button>
              </Link>
              
              {user ? <>
                  {isAdmin && <Link to="/admin">
                      <Button variant="outline" size="sm">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Admin</span>
                      </Button>
                    </Link>}
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </> : <>
                  <Link to="/login">
                    <Button variant="outline" size="sm">Login</Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </>}
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} HalalCheck. For informational purposes only. Not a substitute for official halal certification.</p>
        </div>
      </footer>
    </div>;
}