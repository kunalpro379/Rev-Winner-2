import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { HamburgerNav } from "@/components/hamburger-nav";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/cart-context";
import { 
  ShoppingCart, 
  Trash2, 
  ArrowRight,
  Package,
  DollarSign,
  Receipt,
  Loader2,
  ShoppingBag,
  Tag,
  X,
  Check
} from "lucide-react";

export default function Cart() {
  const [location, setLocation] = useLocation();
  const { cart, isLoading, removeFromCart, clearCart, applyPromoCode, removePromoCode } = useCart();
  const [promoCodeInputs, setPromoCodeInputs] = useState<Record<string, string>>({});

  // Check if user is authenticated
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Redirect to login if not authenticated (but wait for auth check to complete)
  if (!authLoading && !authData) {
    setLocation('/login?redirect=/cart');
    return null;
  }

  const handleRemoveItem = async (itemId: string) => {
    await removeFromCart(itemId);
  };

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your entire cart?')) {
      await clearCart();
    }
  };

  const handleCheckout = () => {
    setLocation('/checkout');
  };

  const handleApplyPromoCode = async (itemId: string) => {
    const promoCode = promoCodeInputs[itemId]?.trim();
    if (!promoCode) {
      return;
    }
    await applyPromoCode(itemId, promoCode);
    setPromoCodeInputs(prev => ({ ...prev, [itemId]: '' }));
  };

  const handleRemovePromoCode = async (itemId: string) => {
    await removePromoCode(itemId);
  };

  const updatePromoCodeInput = (itemId: string, value: string) => {
    setPromoCodeInputs(prev => ({ ...prev, [itemId]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950">
        <HamburgerNav currentPath={location} />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      </div>
    );
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-purple-700 to-blue-900 dark:from-fuchsia-900 dark:via-purple-900 dark:to-slate-950">
      <HamburgerNav currentPath={location} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10" />
            Your Shopping Cart
          </h1>
          <p className="text-base sm:text-lg text-purple-100">
            Review your items before checkout
          </p>
        </div>

        {isEmpty ? (
          /* Empty Cart State */
          <Card className="max-w-2xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur border-2 border-purple-300 dark:border-purple-700">
            <CardHeader>
              <div className="flex flex-col items-center py-8">
                <ShoppingBag className="h-24 w-24 text-purple-300 dark:text-purple-600 mb-4" />
                <CardTitle className="text-2xl text-center">Your cart is empty</CardTitle>
                <CardDescription className="text-center mt-2">
                  Browse our packages and add items to get started
                </CardDescription>
              </div>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                onClick={() => setLocation('/packages')}
                data-testid="button-browse-packages"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Browse Packages
              </Button>
            </CardFooter>
          </Card>
        ) : (
          /* Cart with Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                  Cart Items ({cart.itemCount})
                </h2>
                {cart.itemCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearCart}
                    className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950 text-sm"
                    data-testid="button-clear-cart"
                  >
                    <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Clear Cart
                  </Button>
                )}
              </div>

              {cart.items.map((item) => (
                <Card
                  key={item.id}
                  className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-2 border-purple-300 dark:border-purple-700"
                  data-testid={`cart-item-${item.id}`}
                >
                  <CardHeader className="p-4 sm:p-6 pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg mb-1 truncate">{item.packageName}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          SKU: {item.packageSku}
                        </CardDescription>
                        <Badge className="mt-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100 text-xs">
                          {item.addonType.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 flex-shrink-0"
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Quantity: <span className="font-semibold text-foreground">{item.quantity}</span>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Unit Price: <span className="font-semibold text-foreground">${item.basePrice}</span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">
                          ${(parseFloat(item.basePrice) * item.quantity).toFixed(2)}
                        </div>
                        {item.appliedDiscountAmount && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            -${parseFloat(item.appliedDiscountAmount).toFixed(2)} discount
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          + GST
                        </div>
                      </div>
                    </div>

                    {/* Promo Code Section */}
                    <div className="border-t pt-3">
                      {item.promoCodeCode ? (
                        <div className="flex items-center justify-between bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <div>
                              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                {item.promoCodeCode} applied
                              </span>
                              <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                                (${parseFloat(item.appliedDiscountAmount || '0').toFixed(2)} off)
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePromoCode(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            data-testid={`button-remove-promo-${item.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Tag className="h-4 w-4 text-purple-600 flex-shrink-0 mt-1 sm:mt-0" />
                          <Input
                            placeholder="Enter promo code"
                            value={promoCodeInputs[item.id] || ''}
                            onChange={(e) => updatePromoCodeInput(item.id, e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleApplyPromoCode(item.id);
                              }
                            }}
                            className="flex-1 text-sm"
                            data-testid={`input-promo-${item.id}`}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleApplyPromoCode(item.id)}
                            disabled={!promoCodeInputs[item.id]?.trim()}
                            className="bg-purple-600 hover:bg-purple-700 text-sm flex-shrink-0"
                            data-testid={`button-apply-promo-${item.id}`}
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-2 border-purple-400 dark:border-purple-500 lg:sticky lg:top-24">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                    <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  {/* Subtotal - Show original and discounted */}
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="text-muted-foreground">Subtotal</span>
                    <div className="flex flex-col items-end gap-1">
                      {cart?.discount && parseFloat(cart.discount.toString()) > 0 ? (
                        <>
                          <span className="text-sm line-through text-muted-foreground">
                            ${(cart?.subtotal ?? 0).toFixed(2)}
                          </span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            ${((cart?.subtotal ?? 0) - parseFloat(cart.discount.toString())).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold">${(cart?.subtotal ?? 0).toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  {/* Show total discount if any */}
                  {cart?.discount && parseFloat(cart.discount.toString()) > 0 && (
                    <div className="flex items-center justify-between text-sm bg-green-50 dark:bg-green-950 p-2 rounded">
                      <span className="text-green-700 dark:text-green-300 font-medium">Total Savings</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        -${parseFloat(cart.discount.toString()).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <Separator />

                  {/* GST (18%) */}
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                      <span className="text-muted-foreground">GST (18%)</span>
                    </div>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      ${(cart?.gstAmount ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="flex items-center justify-between text-base sm:text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-xl sm:text-2xl text-purple-600 dark:text-purple-400">
                      ${(cart?.total ?? 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Item Count Summary */}
                  <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3 mt-3 sm:mt-4">
                    <div className="text-xs sm:text-sm text-center">
                      <span className="font-semibold">{cart?.itemCount ?? 0}</span> {(cart?.itemCount ?? 0) === 1 ? 'item' : 'items'} in cart
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 p-4 sm:p-6">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-sm sm:text-base"
                    onClick={handleCheckout}
                    data-testid="button-proceed-checkout"
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-sm sm:text-base"
                    onClick={() => setLocation('/packages')}
                    data-testid="button-continue-shopping"
                  >
                    Continue Shopping
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
