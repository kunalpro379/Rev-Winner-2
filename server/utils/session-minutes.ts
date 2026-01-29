import { db } from "../db";
import { sessionMinutesPurchases } from "../../shared/schema";
import { eq, and, gt, sql } from "drizzle-orm";

export interface MinutesBalance {
  hasAvailableMinutes: boolean;
  totalMinutesRemaining: number;
  purchases: Array<{
    id: string;
    minutesRemaining: number;
    expiryDate: Date;
  }>;
}

/**
 * Get user's current minutes balance
 */
export async function getUserMinutesBalance(userId: string): Promise<MinutesBalance> {
  // Get all active purchases that haven't expired and have remaining minutes
  const purchases = await db
    .select()
    .from(sessionMinutesPurchases)
    .where(
      and(
        eq(sessionMinutesPurchases.userId, userId),
        eq(sessionMinutesPurchases.status, "active"),
        gt(sessionMinutesPurchases.minutesRemaining, 0),
        gt(sessionMinutesPurchases.expiryDate, new Date())
      )
    )
    .orderBy(sessionMinutesPurchases.expiryDate); // Use oldest first

  const totalMinutesRemaining = purchases.reduce(
    (sum, p) => sum + p.minutesRemaining,
    0
  );

  return {
    hasAvailableMinutes: totalMinutesRemaining > 0,
    totalMinutesRemaining,
    purchases: purchases.map(p => ({
      id: p.id,
      minutesRemaining: p.minutesRemaining,
      expiryDate: p.expiryDate,
    })),
  };
}

/**
 * Deduct minutes from user's balance (uses oldest purchase first)
 */
export async function deductMinutes(userId: string, minutesToDeduct: number): Promise<boolean> {
  if (minutesToDeduct <= 0) return true;

  const balance = await getUserMinutesBalance(userId);
  
  if (!balance.hasAvailableMinutes || balance.totalMinutesRemaining < minutesToDeduct) {
    return false; // Not enough minutes
  }

  let remainingToDeduct = minutesToDeduct;

  // Deduct from oldest purchases first (FIFO)
  for (const purchase of balance.purchases) {
    if (remainingToDeduct <= 0) break;

    const fullPurchase = await db
      .select()
      .from(sessionMinutesPurchases)
      .where(eq(sessionMinutesPurchases.id, purchase.id))
      .limit(1);

    if (fullPurchase.length === 0) continue;

    const currentPurchase = fullPurchase[0];
    const deductAmount = Math.min(remainingToDeduct, currentPurchase.minutesRemaining);
    const newMinutesRemaining = currentPurchase.minutesRemaining - deductAmount;
    const newMinutesUsed = currentPurchase.minutesUsed + deductAmount;

    // Update purchase
    await db
      .update(sessionMinutesPurchases)
      .set({
        minutesUsed: newMinutesUsed,
        minutesRemaining: newMinutesRemaining,
        status: newMinutesRemaining === 0 ? "exhausted" : "active",
      })
      .where(eq(sessionMinutesPurchases.id, purchase.id));

    remainingToDeduct -= deductAmount;
  }

  return true;
}

/**
 * Mark expired purchases as expired
 */
export async function markExpiredPurchases(userId: string): Promise<void> {
  await db
    .update(sessionMinutesPurchases)
    .set({ status: "expired" })
    .where(
      and(
        eq(sessionMinutesPurchases.userId, userId),
        eq(sessionMinutesPurchases.status, "active"),
        sql`${sessionMinutesPurchases.expiryDate} < NOW()`
      )
    );
}
