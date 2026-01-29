/**
 * Currency Utilities
 * 
 * Simple currency handling - all payments in USD only.
 * No currency conversion applied.
 */

/**
 * Convert amount to smallest currency unit (cents)
 * @param amount Amount in USD
 * @returns Amount in cents
 */
export function toSmallestUnit(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert from smallest currency unit to base currency
 * @param amount Amount in cents
 * @returns Amount in USD
 */
export function fromSmallestUnit(amount: number): number {
  return amount / 100;
}

/**
 * Format currency for display
 * @param amount Amount to format
 * @param currency Currency code (USD only)
 * @returns Formatted string with currency symbol
 */
export function formatCurrency(amount: number, currency: 'USD' = 'USD'): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Prepare payment amount (USD only)
 * @param usdAmount Amount in USD
 * @returns Object with USD amount in cents
 */
export function preparePaymentAmount(usdAmount: number) {
  const amountInCents = toSmallestUnit(usdAmount);
  
  return {
    amount: amountInCents,
    currency: 'USD',
    displayAmount: usdAmount,
    displayCurrency: 'USD',
  };
}