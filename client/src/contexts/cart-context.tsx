import { createContext, useContext, useCallback, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  userId: string;
  packageSku: string;
  packageName: string;
  addonType: string;
  basePrice: string;
  quantity: number;
  metadata: any;
  purchaseMode: 'user' | 'team';
  teamManagerName: string | null;
  teamManagerEmail: string | null;
  promoCodeId: string | null;
  promoCodeCode: string | null;
  appliedDiscountAmount: string | null;
  addedAt: string;
}

interface TeamManagerInfo {
  name: string;
  email: string;
  companyName?: string;
}

interface CartSummary {
  items: CartItem[];
  subtotal: number;
  gstAmount: number;
  discount: number;
  total: number;
  itemCount: number;
  currency: string;
}

interface AddToCartOptions {
  packageSku: string;
  quantity: number;
  purchaseMode?: 'user' | 'team';
  teamManager?: TeamManagerInfo;
}

interface CartContextValue {
  cart: CartSummary | undefined;
  isLoading: boolean;
  addToCart: (packageSku: string, quantity: number, purchaseMode?: 'user' | 'team', teamManager?: TeamManagerInfo) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyPromoCode: (itemId: string, promoCode: string) => Promise<void>;
  removePromoCode: (itemId: string) => Promise<void>;
  refetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const { data: cart, isLoading, refetch } = useQuery<CartSummary>({
    queryKey: ['/api/cart'],
    retry: false,
  });

  const addMutation = useMutation({
    mutationFn: async (options: AddToCartOptions) => {
      return await apiRequest('POST', '/api/cart/add', {
        packageSku: options.packageSku,
        quantity: options.quantity,
        purchaseMode: options.purchaseMode || 'user',
        teamManagerName: options.teamManager?.name,
        teamManagerEmail: options.teamManager?.email,
        companyName: options.teamManager?.companyName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add item",
        description: error.message || "Could not add item to cart",
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest('DELETE', `/api/cart/remove/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove item",
        description: error.message || "Could not remove item from cart",
        variant: "destructive",
      });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/cart/clear');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to clear cart",
        description: error.message || "Could not clear cart",
        variant: "destructive",
      });
    },
  });

  const applyPromoCodeMutation = useMutation({
    mutationFn: async ({ itemId, promoCode }: { itemId: string; promoCode: string }) => {
      return await apiRequest('POST', `/api/cart/items/${itemId}/promo`, { promoCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Promo code applied",
        description: "Discount has been applied to this item",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to apply promo code",
        description: error.message || "Invalid promo code",
        variant: "destructive",
      });
    },
  });

  const removePromoCodeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest('DELETE', `/api/cart/items/${itemId}/promo`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Promo code removed",
        description: "Discount has been removed from this item",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove promo code",
        description: error.message || "Could not remove promo code",
        variant: "destructive",
      });
    },
  });

  const addToCart = useCallback(async (packageSku: string, quantity: number = 1, purchaseMode?: 'user' | 'team', teamManager?: TeamManagerInfo) => {
    await addMutation.mutateAsync({ packageSku, quantity, purchaseMode, teamManager });
  }, [addMutation]);

  const removeFromCart = useCallback(async (itemId: string) => {
    await removeMutation.mutateAsync(itemId);
  }, [removeMutation]);

  const clearCart = useCallback(async () => {
    await clearMutation.mutateAsync();
  }, [clearMutation]);

  const applyPromoCode = useCallback(async (itemId: string, promoCode: string) => {
    await applyPromoCodeMutation.mutateAsync({ itemId, promoCode });
  }, [applyPromoCodeMutation]);

  const removePromoCode = useCallback(async (itemId: string) => {
    await removePromoCodeMutation.mutateAsync(itemId);
  }, [removePromoCodeMutation]);

  const refetchCart = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const value: CartContextValue = {
    cart,
    isLoading,
    addToCart,
    removeFromCart,
    applyPromoCode,
    removePromoCode,
    clearCart,
    refetchCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
