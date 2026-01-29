/**
 * Geolocation Service
 * 
 * Provides reliable IP geolocation with multiple fallback services,
 * caching, and retry logic
 */

interface GeoLocation {
  country: string;
  state: string;
  city: string;
  success: boolean;
}

class GeolocationService {
  private cache: Map<string, { data: GeoLocation; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly TIMEOUT = 5000; // 5 seconds

  /**
   * Check if IP is private/localhost
   */
  private isPrivateIp(ip: string): boolean {
    if (!ip) return true;
    
    // Localhost
    if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
      return true;
    }
    
    // Private IPv4 ranges
    const ipv4Patterns = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./, // Link-local
    ];
    
    if (ipv4Patterns.some(pattern => pattern.test(ip))) {
      return true;
    }
    
    // Private IPv6 ranges
    if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) {
      return true;
    }
    
    return false;
  }

  /**
   * Get location from cache if available and not expired
   */
  private getFromCache(ip: string): GeoLocation | null {
    const cached = this.cache.get(ip);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_TTL) {
      this.cache.delete(ip);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Save location to cache
   */
  private saveToCache(ip: string, data: GeoLocation): void {
    this.cache.set(ip, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Fetch from ipapi.co (Primary service)
   */
  private async fetchFromIpApiCo(ip: string): Promise<GeoLocation | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);
      
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Rev-Winner-Analytics/1.0',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`[GeoLocation] ipapi.co returned ${response.status} for ${ip}`);
        return null;
      }
      
      const data = await response.json();
      
      // Check for error response
      if (data.error || !data.country_name) {
        console.log(`[GeoLocation] ipapi.co error for ${ip}:`, data.reason || 'No country data');
        return null;
      }
      
      return {
        country: data.country_name || 'Unknown',
        state: data.region || data.region_code || 'Unknown',
        city: data.city || 'Unknown',
        success: true,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`[GeoLocation] ipapi.co timeout for ${ip}`);
      } else {
        console.log(`[GeoLocation] ipapi.co error for ${ip}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Fetch from ip-api.com (Fallback 1)
   */
  private async fetchFromIpApi(ip: string): Promise<GeoLocation | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);
      
      const response = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Rev-Winner-Analytics/1.0',
          },
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`[GeoLocation] ip-api.com returned ${response.status} for ${ip}`);
        return null;
      }
      
      const data = await response.json();
      
      if (data.status !== 'success') {
        console.log(`[GeoLocation] ip-api.com error for ${ip}:`, data.message);
        return null;
      }
      
      return {
        country: data.country || 'Unknown',
        state: data.regionName || 'Unknown',
        city: data.city || 'Unknown',
        success: true,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`[GeoLocation] ip-api.com timeout for ${ip}`);
      } else {
        console.log(`[GeoLocation] ip-api.com error for ${ip}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Fetch from ipinfo.io (Fallback 2)
   */
  private async fetchFromIpInfo(ip: string): Promise<GeoLocation | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);
      
      const response = await fetch(`https://ipinfo.io/${ip}/json`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Rev-Winner-Analytics/1.0',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`[GeoLocation] ipinfo.io returned ${response.status} for ${ip}`);
        return null;
      }
      
      const data = await response.json();
      
      if (!data.country) {
        console.log(`[GeoLocation] ipinfo.io no country data for ${ip}`);
        return null;
      }
      
      // ipinfo.io returns country code, not full name
      // We'll use it as-is for now
      const regionParts = (data.region || '').split(',');
      
      return {
        country: data.country || 'Unknown',
        state: regionParts[0] || data.region || 'Unknown',
        city: data.city || 'Unknown',
        success: true,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`[GeoLocation] ipinfo.io timeout for ${ip}`);
      } else {
        console.log(`[GeoLocation] ipinfo.io error for ${ip}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Get geolocation for an IP address
   * Uses cache and multiple fallback services
   */
  async getLocation(ip: string): Promise<GeoLocation> {
    // Handle private/localhost IPs
    if (this.isPrivateIp(ip)) {
      return {
        country: 'Local',
        state: 'Development',
        city: 'Localhost',
        success: true,
      };
    }

    // Check cache first
    const cached = this.getFromCache(ip);
    if (cached) {
      console.log(`[GeoLocation] Cache hit for ${ip}`);
      return cached;
    }

    console.log(`[GeoLocation] Looking up ${ip}...`);

    // Try primary service
    let result = await this.fetchFromIpApiCo(ip);
    if (result) {
      console.log(`[GeoLocation] ✅ ipapi.co success for ${ip}: ${result.city}, ${result.state}, ${result.country}`);
      this.saveToCache(ip, result);
      return result;
    }

    // Try fallback 1
    result = await this.fetchFromIpApi(ip);
    if (result) {
      console.log(`[GeoLocation] ✅ ip-api.com success for ${ip}: ${result.city}, ${result.state}, ${result.country}`);
      this.saveToCache(ip, result);
      return result;
    }

    // Try fallback 2
    result = await this.fetchFromIpInfo(ip);
    if (result) {
      console.log(`[GeoLocation] ✅ ipinfo.io success for ${ip}: ${result.city}, ${result.state}, ${result.country}`);
      this.saveToCache(ip, result);
      return result;
    }

    // All services failed
    console.log(`[GeoLocation] ❌ All services failed for ${ip}`);
    const unknownResult = {
      country: 'Unknown',
      state: 'Unknown',
      city: 'Unknown',
      success: false,
    };
    
    // Cache failed lookups for a shorter time (1 hour) to retry later
    this.cache.set(ip, {
      data: unknownResult,
      timestamp: Date.now() - (this.CACHE_TTL - 60 * 60 * 1000), // Expire in 1 hour
    });
    
    return unknownResult;
  }

  /**
   * Batch lookup multiple IPs
   */
  async batchLookup(ips: string[]): Promise<Map<string, GeoLocation>> {
    const results = new Map<string, GeoLocation>();
    
    // Process in batches of 5 to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < ips.length; i += batchSize) {
      const batch = ips.slice(i, i + batchSize);
      const promises = batch.map(ip => this.getLocation(ip));
      const batchResults = await Promise.all(promises);
      
      batch.forEach((ip, index) => {
        results.set(ip, batchResults[index]);
      });
      
      // Wait 1 second between batches to respect rate limits
      if (i + batchSize < ips.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[GeoLocation] Cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; entries: Array<{ ip: string; age: number }> } {
    const entries = Array.from(this.cache.entries()).map(([ip, data]) => ({
      ip,
      age: Date.now() - data.timestamp,
    }));
    
    return {
      size: this.cache.size,
      entries,
    };
  }
}

export const geolocationService = new GeolocationService();
