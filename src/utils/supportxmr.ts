interface SupportXMRConfig {
  baseUrl: string;
  address: string;
  refreshInterval: number;
}

interface SupportXMRResponse {
  hashrate?: number;
  amtDue?: number;
  amtPaid?: number;
  validShares?: number;
  invalidShares?: number;
  totalHashes?: number;
  lastShare?: number;
  address?: string;
  error?: string;
}

interface MiningStatistics {
  hashrate: number;
  amtDue: number;
  amtPaid: number;
  validShares: number;
  invalidShares: number;
  totalHashes: number;
  lastShare: number | null;
  address: string;
  lastUpdate: Date;
  efficiency: number;
  status: 'active' | 'inactive' | 'error';
}

class SupportXMRService {
  private config: SupportXMRConfig;
  private cache: MiningStatistics | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor() {
    this.config = {
      baseUrl: 'https://supportxmr.com/api',
      address: '46UxNFuGM2E3UwmZWWJicaRPoRwqwW4byQkaTHkX8yPcVihp91qAVtSFipWUGJJUyTXgzSqxzDQtNLf2bsp2DX2qCCgC5mg',
      refreshInterval: 30000
    };
  }

  async getMiningStats(): Promise<MiningStatistics> {
    const now = Date.now();

    // Return cached data if still fresh
    if (this.cache && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      const response = await this.fetchFromSupportXMR();

      if (response.error) {
        throw new Error(response.error);
      }

      const stats: MiningStatistics = {
        hashrate: response.hashrate || 0,
        amtDue: response.amtDue || 0,
        amtPaid: response.amtPaid || 0,
        validShares: response.validShares || 0,
        invalidShares: response.invalidShares || 0,
        totalHashes: response.totalHashes || 0,
        lastShare: response.lastShare || null,
        address: response.address || this.config.address,
        lastUpdate: new Date(),
        efficiency: this.calculateEfficiency(response.validShares || 0, response.invalidShares || 0),
        status: this.determineStatus(response)
      };

      this.cache = stats;
      this.lastFetch = now;

      return stats;

    } catch (error) {
      console.error('Error fetching mining stats:', error);

      // Return error state if no cache available
      if (!this.cache) {
        return {
          hashrate: 0,
          amtDue: 0,
          amtPaid: 0,
          validShares: 0,
          invalidShares: 0,
          totalHashes: 0,
          lastShare: null,
          address: this.config.address,
          lastUpdate: new Date(),
          efficiency: 0,
          status: 'error'
        };
      }

      // Return stale cache with error status
      return {
        ...this.cache,
        status: 'error',
        lastUpdate: new Date()
      };
    }
  }

  private async fetchFromSupportXMR(): Promise<SupportXMRResponse> {
    const url = `${this.config.baseUrl}/miner_stats?address=${this.config.address}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'XMRT-DAO/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response structure
      if (typeof data !== 'object') {
        throw new Error('Invalid response format from SupportXMR API');
      }

      return data as SupportXMRResponse;

    } catch (error) {
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: 'Unknown error occurred while fetching mining data' };
    }
  }

  private calculateEfficiency(validShares: number, invalidShares: number): number {
    const totalShares = validShares + invalidShares;
    if (totalShares === 0) return 0;
    return Math.round((validShares / totalShares) * 10000) / 100; // Return percentage with 2 decimals
  }

  private determineStatus(response: SupportXMRResponse): 'active' | 'inactive' | 'error' {
    if (response.error) return 'error';

    const now = Date.now() / 1000; // Convert to seconds
    const lastShare = response.lastShare || 0;
    const timeSinceLastShare = now - lastShare;

    // Consider active if last share was within 10 minutes
    if (timeSinceLastShare < 600) return 'active';

    // Consider inactive if hashrate is 0 or no recent shares
    if ((response.hashrate || 0) === 0 || timeSinceLastShare > 1800) return 'inactive';

    return 'active';
  }

  // Get formatted mining summary for display
  getFormattedSummary(stats: MiningStatistics): string {
    const hashrateFormatted = this.formatHashrate(stats.hashrate);
    const lastShareFormatted = this.formatLastShare(stats.lastShare);
    const efficiencyFormatted = `${stats.efficiency}%`;

    return `Mining Status: ${stats.status.toUpperCase()}\n` +
           `Hashrate: ${hashrateFormatted}\n` +
           `XMR Due: ${stats.amtDue.toFixed(6)} XMR\n` +
           `Valid Shares: ${stats.validShares.toLocaleString()}\n` +
           `Efficiency: ${efficiencyFormatted}\n` +
           `Last Share: ${lastShareFormatted}`;
  }

  private formatHashrate(hashrate: number): string {
    if (hashrate >= 1000000) {
      return `${(hashrate / 1000000).toFixed(2)} MH/s`;
    } else if (hashrate >= 1000) {
      return `${(hashrate / 1000).toFixed(2)} KH/s`;
    } else {
      return `${hashrate} H/s`;
    }
  }

  private formatLastShare(lastShare: number | null): string {
    if (!lastShare) return 'Never';

    const now = Date.now() / 1000;
    const diff = now - lastShare;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  }

  // Real-time monitoring methods
  async startRealTimeMonitoring(callback: (stats: MiningStatistics) => void): Promise<void> {
    // Clear any existing interval
    this.stopRealTimeMonitoring();

    // Set up polling interval
    const intervalId = setInterval(async () => {
      try {
        const stats = await this.getMiningStats();
        callback(stats);
      } catch (error) {
        console.error('Error in real-time monitoring:', error);
      }
    }, this.config.refreshInterval);

    // Store interval ID for cleanup
    (this as any).monitoringInterval = intervalId;
  }

  stopRealTimeMonitoring(): void {
    if ((this as any).monitoringInterval) {
      clearInterval((this as any).monitoringInterval);
      delete (this as any).monitoringInterval;
    }
  }

  // Configuration methods
  setAddress(address: string): void {
    this.config.address = address;
    this.clearCache(); // Clear cache when address changes
  }

  setRefreshInterval(interval: number): void {
    this.config.refreshInterval = Math.max(interval, 5000); // Minimum 5 seconds
  }

  private clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }

  // Health check method
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    details: any;
  }> {
    try {
      const stats = await this.getMiningStats();

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      const issues: string[] = [];

      if (stats.status === 'error') {
        status = 'critical';
        issues.push('Cannot connect to SupportXMR API');
      } else if (stats.status === 'inactive') {
        status = 'warning';
        issues.push('Mining appears to be inactive');
      }

      if (stats.efficiency < 95 && stats.validShares > 100) {
        status = status === 'critical' ? 'critical' : 'warning';
        issues.push(`Low mining efficiency: ${stats.efficiency}%`);
      }

      return {
        status,
        details: {
          stats,
          issues,
          lastCheck: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        status: 'critical',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          lastCheck: new Date().toISOString()
        }
      };
    }
  }

  // Get cached stats without making API call
  getCachedStats(): MiningStatistics | null {
    return this.cache;
  }

  // Check if cache is fresh
  isCacheFresh(): boolean {
    return this.cache !== null && (Date.now() - this.lastFetch) < this.CACHE_DURATION;
  }
}

export const supportXMRService = new SupportXMRService();
