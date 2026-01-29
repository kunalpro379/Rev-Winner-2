import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { clearAllSessionData } from "@/lib/session";

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  organization?: string;
}

interface AdminAuthResult {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  user: UserData | null;
}

interface AuthMeResponse {
  user: UserData;
  subscription: any;
}

export function useAdminAuth(): AdminAuthResult {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [authState, setAuthState] = useState<AdminAuthResult>({
    isAuthenticated: false,
    isAdmin: false,
    isLoading: true,
    user: null,
  });

  // Verify user with backend - API returns { user: {...}, subscription: {...} }
  const { data: authData, isLoading, error } = useQuery<AuthMeResponse>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  useEffect(() => {
    console.log("useAdminAuth - auth check:", { isLoading, hasError: !!error, hasAuthData: !!authData, authData });
    
    if (isLoading) {
      console.log("useAdminAuth - still loading...");
      setAuthState({
        isAuthenticated: false,
        isAdmin: false,
        isLoading: true,
        user: null,
      });
      return;
    }

    // Handle error (not authenticated)
    if (error || !authData || !authData.user) {
      console.error("useAdminAuth - auth failed:", { error, authData });
      // Clear ALL session data (use shared helper)
      clearAllSessionData({ clearCache: () => queryClient.clear() });
      
      setAuthState({
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
        user: null,
      });
      
      toast({
        title: "Authentication Required",
        description: "Please log in to access the admin portal.",
        variant: "destructive",
      });
      
      console.log("useAdminAuth - redirecting to /admin/login (no auth)");
      setLocation("/admin/login");
      return;
    }

    const userData = authData.user;

    // Check if user is admin or super_admin
    const isAdminOrSuperAdmin = userData.role === 'admin' || userData.role === 'super_admin';
    if (!isAdminOrSuperAdmin) {
      console.error("useAdminAuth - not admin/super_admin:", userData.role);
      toast({
        title: "Access Denied",
        description: "Admin credentials required to access this page.",
        variant: "destructive",
      });
      
      setAuthState({
        isAuthenticated: true,
        isAdmin: false,
        isLoading: false,
        user: userData,
      });
      
      console.log("useAdminAuth - redirecting to /admin/login (not admin)");
      setLocation("/admin/login");
      return;
    }

    console.log("useAdminAuth - SUCCESS! User is admin/super_admin:", userData.role);
    // User is authenticated and is admin or super_admin
    setAuthState({
      isAuthenticated: true,
      isAdmin: true,
      isLoading: false,
      user: userData,
    });
  }, [authData, isLoading, error, setLocation, toast]);

  return authState;
}
