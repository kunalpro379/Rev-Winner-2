/**
 * Real-time Currency Conversion Service
 * 
 * Uses free APIs to get real-time exchange rates
 * Supports caching to avoid hitting rate limits
 */

interface ExchangeRateResponse {
  rates: Record<string, number>;
  base: string;
  date: string;
}

interface CurrencyConversion {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  timestamp: Date;
}

class CurrencyConverter {
  private cache = new Map<string, { rate: number; timestamp: Date }>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  /**
   * Get real-time exchange rate from USD to target currency
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached rate if still valid
    if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_DURATION) {
      console.log(`[CurrencyConverter] Using cached rate: 1 ${fromCurrency} = ${cached.rate} ${toCurrency}`);
      return cached.rate;
    }

    try {
      // Try multiple free APIs in order of preference
      const rate = await this.fetchExchangeRate(fromCurrency, toCurrency);
      
      // Cache the rate
      this.cache.set(cacheKey, { rate, timestamp: new Date() });
      
      console.log(`[CurrencyConverter] Fetched fresh rate: 1 ${fromCurrency} = ${rate} ${toCurrency}`);
      return rate;
    } catch (error) {
      console.error(`[CurrencyConverter] Failed to fetch exchange rate:`, error);
      
      // Fallback to cached rate even if expired
      if (cached) {
        console.warn(`[CurrencyConverter] Using expired cached rate as fallback`);
        return cached.rate;
      }
      
      // All APIs failed and no cached rate available
      throw new Error(`Unable to get exchange rate for ${fromCurrency} to ${toCurrency}. All currency APIs are unavailable.`);
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<CurrencyConversion> {
    const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = Math.round(amount * exchangeRate * 100) / 100; // Round to 2 decimal places
    
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount,
      convertedCurrency: toCurrency,
      exchangeRate,
      timestamp: new Date()
    };
  }

  /**
   * Fetch exchange rate from external APIs
   */
  private async fetchExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // Try ExchangeRate-API (free, no API key required)
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      if (response.ok) {
        const data: ExchangeRateResponse = await response.json();
        if (data.rates[toCurrency]) {
          return data.rates[toCurrency];
        }
      }
    } catch (error) {
      console.warn(`[CurrencyConverter] ExchangeRate-API failed:`, error);
    }

    // Try Fixer.io (backup - requires API key but has free tier)
    if (process.env.FIXER_API_KEY) {
      try {
        const response = await fetch(
          `https://api.fixer.io/latest?access_key=${process.env.FIXER_API_KEY}&base=${fromCurrency}&symbols=${toCurrency}`
        );
        if (response.ok) {
          const data: ExchangeRateResponse = await response.json();
          if (data.rates[toCurrency]) {
            return data.rates[toCurrency];
          }
        }
      } catch (error) {
        console.warn(`[CurrencyConverter] Fixer.io failed:`, error);
      }
    }

    // Try CurrencyAPI (backup)
    try {
      const response = await fetch(`https://api.currencyapi.com/v3/latest?apikey=free&base_currency=${fromCurrency}&currencies=${toCurrency}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data[toCurrency] && data.data[toCurrency].value) {
          return data.data[toCurrency].value;
        }
      }
    } catch (error) {
      console.warn(`[CurrencyConverter] CurrencyAPI failed:`, error);
    }

    throw new Error(`Failed to fetch exchange rate from ${fromCurrency} to ${toCurrency}`);
  }



  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    console.log(`[CurrencyConverter] Cache cleared`);
  }
}

// Export singleton instance
export const currencyConverter = new CurrencyConverter();

// Export types
export type { CurrencyConversion };