// Rev Winner Pricing Configuration - Crush Q4 Quota Edition
// All prices in USD

export interface PricingPackage {
  sku: string;
  name: string;
  price: number;
  currency: string;
  billingType: 'one_time' | 'monthly' | '6_months' | '12_months' | '36_months';
  totalUnits?: number;
  validityDays?: number;
  description: string;
  features?: string[];
  isBestValue?: boolean;
}

// Platform Access Subscriptions - The ONLY packages available
export const PLATFORM_ACCESS_PACKAGES: Record<string, PricingPackage> = {
  'RW-PA-M2M': {
    sku: 'RW-PA-M2M',
    name: 'Month-to-Month',
    price: 40,
    currency: 'USD',
    billingType: 'monthly',
    validityDays: 30,
    description: 'Monthly platform access subscription',
    features: [
      '30 days access',
      'All AI features included',
      'Priority support'
    ],
  },
  'RW-PA-6M': {
    sku: 'RW-PA-6M',
    name: '6 Months Plan',
    price: 200,
    currency: 'USD',
    billingType: '6_months',
    validityDays: 180,
    description: '6 months platform access subscription',
    features: [
      '180 days access',
      'All AI features included',
      'Priority support'
    ],
  },
  'RW-PA-12M': {
    sku: 'RW-PA-12M',
    name: '12 Months Plan',
    price: 399,
    currency: 'USD',
    billingType: '12_months',
    validityDays: 365,
    description: '12 months platform access subscription',
    features: [
      '365 days access',
      'All AI features included',
      'Priority support'
    ],
  },
  'RW-PA-36M': {
    sku: 'RW-PA-36M',
    name: '36 Months Plan',
    price: 499,
    currency: 'USD',
    billingType: '36_months',
    validityDays: 1095,
    description: '36 months platform access subscription',
    features: [
      '1095 days access',
      'All AI features included',
      'Priority support'
    ],
    isBestValue: true,
  },
};

// Helper function to get package by SKU (sync version for platform access only)
export function getPackageBySku(sku: string): PricingPackage | undefined {
  return PLATFORM_ACCESS_PACKAGES[sku];
}

// Helper function to get package by SKU (async version supporting add-ons)
export async function getPackageOrAddonBySku(sku: string): Promise<PricingPackage | undefined> {
  const platformPackage = PLATFORM_ACCESS_PACKAGES[sku];
  if (platformPackage) return platformPackage;
  
  const { billingStorage } = await import('../storage-billing');
  
  // Check if SKU is a subscription plan ID
  const subscriptionPlans = await billingStorage.getPublishedSubscriptionPlans();
  const subscriptionPlan = subscriptionPlans.find(plan => plan.id === sku);
  
  if (subscriptionPlan) {
    const billingIntervalMap: Record<string, PricingPackage['billingType']> = {
      '1-month': 'monthly',
      '6-months': '6_months',
      '1-year': '12_months',
      '3-years': '36_months',
    };
    
    const validityDaysMap: Record<string, number> = {
      '1-month': 30,
      '6-months': 180,
      '1-year': 365,
      '3-years': 1095,
    };
    
    const features = Array.isArray(subscriptionPlan.features) 
      ? subscriptionPlan.features 
      : [];
    
    return {
      sku: subscriptionPlan.id,
      name: subscriptionPlan.name,
      price: parseFloat(subscriptionPlan.price),
      currency: subscriptionPlan.currency,
      billingType: billingIntervalMap[subscriptionPlan.billingInterval] || 'monthly',
      validityDays: validityDaysMap[subscriptionPlan.billingInterval] || 30,
      description: (subscriptionPlan as any).description || subscriptionPlan.name,
      features,
    };
  }
  
  // Check if SKU is an add-on (exact id or tiered id like "addonId-500" for session minutes)
  const addons = await billingStorage.getPublishedAddons();
  let addon = addons.find(a => a.id === sku);
  let tierMinutes: number | undefined;
  if (!addon && sku.includes('-')) {
    const lastHyphen = sku.lastIndexOf('-');
    const suffix = sku.slice(lastHyphen + 1);
    const parsed = parseInt(suffix, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed < 100000) {
      const baseId = sku.slice(0, lastHyphen);
      addon = addons.find(a => a.id === baseId);
      tierMinutes = parsed;
    }
  }

  if (addon) {
    const metadata = (addon.metadata as { minutes?: number }) || {};
    const features = Array.isArray(addon.features) ? addon.features : [];
    const isSessionMinutes = addon.type === 'usage_bundle' || addon.slug === 'session-minutes';
    const validityDays = addon.billingInterval === 'monthly'
      ? 30
      : (isSessionMinutes ? 30 : undefined);

    // totalUnits: tiered id (e.g. uuid-500) -> use 500; else metadata.minutes; else first pricingTiers tier
    let totalUnits: number | undefined = tierMinutes ?? metadata.minutes;
    if (totalUnits == null && addon.pricingTiers && Array.isArray(addon.pricingTiers)) {
      const tiers = addon.pricingTiers as Array<{ minutes?: number }>;
      if (tierMinutes != null) {
        const tier = tiers.find((t: any) => t.minutes === tierMinutes);
        totalUnits = tier?.minutes;
      }
      if (totalUnits == null && tiers.length > 0) totalUnits = (tiers[0] as any).minutes;
    }

    const flatPrice = addon.flatPrice;
    let price = parseFloat(flatPrice || '0');
    if (price === 0 && addon.pricingTiers && Array.isArray(addon.pricingTiers) && tierMinutes != null) {
      const tier = (addon.pricingTiers as Array<{ minutes: number; price: string }>).find(t => t.minutes === tierMinutes);
      if (tier) price = parseFloat(tier.price);
    }

    return {
      sku: addon.id,
      name: tierMinutes != null ? `${addon.displayName} - ${tierMinutes} minutes` : addon.displayName,
      price,
      currency: addon.currency,
      billingType: addon.billingInterval === 'monthly' ? 'monthly' : 'one_time',
      totalUnits: totalUnits ?? undefined,
      validityDays,
      description: (addon as any).description || addon.displayName,
      features,
    };
  }

  return undefined;
}

// Helper function to determine addon type from SKU (async for add-ons)
export async function getAddonTypeFromSku(sku: string): Promise<'platform_access' | 'usage_bundle' | 'service' | null> {
  if (sku.startsWith('RW-PA-')) return 'platform_access';
  
  const { billingStorage } = await import('../storage-billing');
  
  // Check if SKU is a subscription plan ID
  const subscriptionPlans = await billingStorage.getPublishedSubscriptionPlans();
  const isPlatformSubscription = subscriptionPlans.some(plan => plan.id === sku);
  if (isPlatformSubscription) return 'platform_access';
  
  // Check if SKU is an add-on (exact id or tiered id like "addonId-500")
  const addons = await billingStorage.getPublishedAddons();
  let addon = addons.find(a => a.id === sku);
  if (!addon && sku.includes('-')) {
    const lastHyphen = sku.lastIndexOf('-');
    const suffix = sku.slice(lastHyphen + 1);
    if (!isNaN(parseInt(suffix, 10)) && parseInt(suffix, 10) > 0) {
      addon = addons.find(a => a.id === sku.slice(0, lastHyphen));
    }
  }
  if (addon) {
    return addon.type as 'usage_bundle' | 'service';
  }
  return null;
}

// Calculate end date based on validity days
export function calculateEndDate(startDate: Date, validityDays: number): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + validityDays);
  return endDate;
}

// Get all available packages
export function getAllPackages(): PricingPackage[] {
  return Object.values(PLATFORM_ACCESS_PACKAGES);
}
