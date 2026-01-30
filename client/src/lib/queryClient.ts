import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { clearSessionStorageArtifacts } from "@/lib/session";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    let errorData: any = null;
    
    try {
      const json = await res.json();
      errorData = json;
      // Extract just the message from the JSON response
      errorMessage = json.message || json.error || errorMessage;
    } catch (e) {
      // If response is not JSON, use the text
      try {
        const text = await res.text();
        errorMessage = text || errorMessage;
      } catch (textError) {
        // Use statusText as fallback
      }
    }
    
    // Create a more informative error object
    const error = new Error(`${res.status}: ${errorMessage}`);
    (error as any).status = res.status;
    (error as any).data = errorData;
    
    throw error;
  }
}

// Refresh access token using refresh token
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    return null;
  }

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      // Refresh token is invalid or expired - use pure helper (no circular dependency)
      clearSessionStorageArtifacts();
      return null;
    }

    const data = await res.json();
    const newAccessToken = data.accessToken;
    
    // Store new access token
    localStorage.setItem("accessToken", newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    // Token refresh failed - use pure helper (no circular dependency)
    clearSessionStorageArtifacts();
    return null;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { allowedStatusCodes?: number[] },
  retryCount: number = 0,
): Promise<Response> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Include access token from localStorage if available
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  
  // Include marketing token if available (for marketing-only users)
  const marketingToken = localStorage.getItem("marketingToken");
  if (marketingToken) {
    headers["x-marketing-token"] = marketingToken;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // If we get a 403 (token expired or session invalidated), try to refresh
  if (res.status === 403 && retryCount === 0) {
    // Check if response indicates session invalidation
    try {
      const errorData = await res.clone().json();
      if (errorData.sessionInvalidated) {
        // Session was invalidated (logged in on another device) - clear and redirect immediately
        clearSessionStorageArtifacts();
        window.location.href = "/login?reason=session_invalidated";
        throw new Error("Session invalidated. Please log in again.");
      }
    } catch (e) {
      // Not JSON or can't parse - continue with refresh attempt
    }
    
    const newAccessToken = await refreshAccessToken();
    
    if (newAccessToken) {
      // Retry the request with new token
      return apiRequest(method, url, data, options, retryCount + 1);
    } else {
      // Refresh failed - use pure helper and redirect (no circular dependency)
      clearSessionStorageArtifacts();
      window.location.href = "/login?reason=token_expired";
      throw new Error("Session expired. Please log in again.");
    }
  }

  // Skip throwing error if status code is in allowed list
  const allowedStatusCodes = options?.allowedStatusCodes || [];
  if (!allowedStatusCodes.includes(res.status)) {
    await throwIfResNotOk(res);
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }, retryCount: number = 0) => {
    const headers: Record<string, string> = {};
    
    // Include access token from localStorage if available
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    
    // Include marketing token if available (for marketing-only users)
    const marketingToken = localStorage.getItem("marketingToken");
    if (marketingToken) {
      headers["x-marketing-token"] = marketingToken;
    }
    
    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // If we get a 403 (token expired or session invalidated), try to refresh
    if (res.status === 403 && retryCount === 0) {
      // Check if response indicates session invalidation
      try {
        const errorData = await res.clone().json();
        if (errorData.sessionInvalidated) {
          // Session was invalidated (logged in on another device) - clear and redirect immediately
          clearSessionStorageArtifacts();
          window.location.href = "/login?reason=session_invalidated";
          throw new Error("Session invalidated. Please log in again.");
        }
      } catch (e) {
        // Not JSON or can't parse - continue with refresh attempt
      }
      
      const newAccessToken = await refreshAccessToken();
      
      if (newAccessToken) {
        // Retry the query with new token - re-fetch with new token in headers
        headers["Authorization"] = `Bearer ${newAccessToken}`;
        const retryRes = await fetch(queryKey.join("/") as string, {
          headers,
          credentials: "include",
        });
        
        // Check if retry also fails with session invalidation
        if (retryRes.status === 403) {
          try {
            const retryErrorData = await retryRes.clone().json();
            if (retryErrorData.sessionInvalidated) {
              clearSessionStorageArtifacts();
              window.location.href = "/login?reason=session_invalidated";
              throw new Error("Session invalidated. Please log in again.");
            }
          } catch (e) {
            // Continue with normal error handling
          }
        }
        
        await throwIfResNotOk(retryRes);
        return await retryRes.json();
      } else {
        // Refresh failed - use pure helper and redirect (no circular dependency)
        clearSessionStorageArtifacts();
        window.location.href = "/login?reason=token_expired";
        throw new Error("Session expired. Please log in again.");
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
