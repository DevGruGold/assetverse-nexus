// Unified Data Service - Single source of truth for all XMRT data
export interface MiningStats {
  hash: number;
  identifier: string;
  lastHash: number;
  totalHashes: number;
  validShares: number;
  invalidShares: number;
  amtDue: string;
  amtPaid: string;
  txnCount: number;
  isDemo?: boolean;
  isInactive?: boolean;
  demoNote?: string;
  poolContext?: {
    poolHashrate: number;
    connectedMiners: number;
    networkDifficulty: number;
    blockHeight: number;
  };
  workerContext: {
    canIdentifyWorker: boolean;
    detectedWorker: string | null;
    registrationRequired: boolean;
    clientIP: string;
  };
  historyData: {
    hasHistory: boolean;
    dataPoints?: number;
    averageHashrate?: number;
  };
  paymentsData: {
    hasPayments: boolean;
    recentPayments?: any[];
    totalPayments?: number;
  };
  lastUpdate: string;
  status: 'live' | 'demo' | 'inactive' | 'fallback';
  walletAddress?: string;
  error?: string;
}

export interface UserContext {
  ip: string;
  isFounder: boolean;
  timestamp: number;
}

class UnifiedDataService {
  private miningStatsCache: { data: MiningStats | null; timestamp: number } = { data: null, timestamp: 0 };
  private userContextCache: { data: UserContext | null; timestamp: number } = { data: null, timestamp: 0 };
  private readonly CACHE_DURATION = 30000; // 30 seconds

  // Get user context (IP and founder status)
  async getUserContext(): Promise<UserContext> {
    const now = Date.now();
    
    // Return cached data if fresh
    if (this.userContextCache.data && (now - this.userContextCache.timestamp) < this.CACHE_DURATION) {
      return this.userContextCache.data;
    }

    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      const ip = data.ip || 'Unknown';
      
      // Check founder status
      const founderIP = localStorage.getItem('founderIP');
      if (!founderIP) {
        localStorage.setItem('founderIP', ip);
      }
      
      const isFounder = founderIP === ip || localStorage.getItem('isProjectFounder') === 'true';
      
      const userContext: UserContext = {
        ip,
        isFounder,
        timestamp: now
      };

      // Cache the result
      this.userContextCache = { data: userContext, timestamp: now };
      return userContext;
      
    } catch (error) {
      console.error('Failed to fetch user context:', error);
      
      // Return fallback data
      const fallback: UserContext = {
        ip: 'Unknown',
        isFounder: localStorage.getItem('isProjectFounder') === 'true',
        timestamp: now
      };
      
      this.userContextCache = { data: fallback, timestamp: now };
      return fallback;
    }
  }

// Make getMiningStats an instance method instead of static
  async getMiningStats(): Promise<MiningStats | null> {
    const now = Date.now();
    
    // Return cached data if fresh
    if (this.miningStatsCache.data && (now - this.miningStatsCache.timestamp) < this.CACHE_DURATION) {
      return this.miningStatsCache.data;
    }

    try {
      console.log('📊 UnifiedData: Fetching mining statistics...');
      
      // Import supabase client dynamically to avoid circular dependencies
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('mining-proxy');
      
      if (error) {
        console.warn('⚠️ Mining API request failed:', error);
        return null; // No mock data - return null if real data unavailable
      }
      console.log('✅ UnifiedData: Mining stats retrieved');
      
      const miningStats: MiningStats = {
        hash: data.hash || 0,
        identifier: data.identifier || 'unknown',
        lastHash: data.lastHash || 0,
        totalHashes: data.totalHashes || 0,
        validShares: data.validShares || 0,
        invalidShares: data.invalidShares || 0,
        amtDue: data.amtDue || '0',
        amtPaid: data.amtPaid || '0',
        txnCount: data.txnCount || 0,
        isDemo: data.isDemo || false,
        isInactive: data.isInactive || false,
        demoNote: data.demoNote,
        poolContext: data.poolContext,
        workerContext: data.workerContext || {
          canIdentifyWorker: false,
          detectedWorker: null,
          registrationRequired: true,
          clientIP: 'unknown'
        },
        historyData: data.historyData || { hasHistory: false },
        paymentsData: data.paymentsData || { hasPayments: false },
        lastUpdate: data.lastUpdate || new Date().toISOString(),
        status: data.status || 'demo',
        walletAddress: data.walletAddress,
        error: data.error
      };

      // Cache the result
      this.miningStatsCache = { data: miningStats, timestamp: now };
      return miningStats;
      
    } catch (error) {
      console.error('❌ UnifiedData: Mining stats error:', error);
      return null; // No fallback mock data - return null on error
    }
  }

  // Format mining stats for display - updated for new interface
  formatMiningStats(stats: MiningStats | null): string {
    if (!stats) return 'Mining statistics are currently unavailable.';

    const formatHashrate = (hashrate: number): string => {
      if (hashrate >= 1000000) {
        return `${(hashrate / 1000000).toFixed(2)} MH/s`;
      } else if (hashrate >= 1000) {
        return `${(hashrate / 1000).toFixed(2)} KH/s`;
      }
      return `${hashrate.toFixed(2)} H/s`;
    };

    const formatXMR = (amount: string): string => {
      const num = parseFloat(amount);
      return (num / 1000000000000).toFixed(6); // Convert from atomic units
    };

    const isOnline = stats.lastHash ? ((Date.now() / 1000) - stats.lastHash) < 300 : false;
    const statusText = stats.status === 'demo' ? '🟡 Demo Data' : 
                      stats.status === 'inactive' ? '🟠 Inactive' :
                      isOnline ? '🟢 Mining (Online)' : '🔴 Idle (Offline)';

    return `📊 **Live Mining Statistics (SupportXMR Pool):**
• **Hash Rate**: ${formatHashrate(stats.hash)}
• **Status**: ${statusText}
• **Valid Shares**: ${stats.validShares.toLocaleString()}
• **Total Hashes**: ${stats.totalHashes.toLocaleString()}
• **Amount Due**: ${formatXMR(stats.amtDue)} XMR
• **Amount Paid**: ${formatXMR(stats.amtPaid)} XMR
• **Last Update**: ${new Date(stats.lastUpdate).toLocaleTimeString()}${stats.walletAddress ? `
• **Wallet**: ${stats.walletAddress}` : ''}`;
  }

  // Clear all caches
  clearCache(): void {
    this.miningStatsCache = { data: null, timestamp: 0 };
    this.userContextCache = { data: null, timestamp: 0 };
  }

  // Get cache status for debugging
  getCacheStatus() {
    const now = Date.now();
    return {
      miningStats: {
        cached: !!this.miningStatsCache.data,
        age: now - this.miningStatsCache.timestamp,
        fresh: (now - this.miningStatsCache.timestamp) < this.CACHE_DURATION
      },
      userContext: {
        cached: !!this.userContextCache.data,
        age: now - this.userContextCache.timestamp,
        fresh: (now - this.userContextCache.timestamp) < this.CACHE_DURATION
      }
    };
  }
}

// Export singleton instance
export const unifiedDataService = new UnifiedDataService();