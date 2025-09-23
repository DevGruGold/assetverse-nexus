// SupportXMR Pool API Integration
// Provides real-time mining statistics and wallet data

const SUPPORTXMR_BASE_URL = 'https://supportxmr.com/api';
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const WALLET_ADDRESS = '46UxNFuGM2E3UwmZWWJicaRPoRwqwW4byQkaTHkX8yPcVihp91qAVtSFipWUGJJUyTXgzSqxzDQtNLf2bsp2DX2qCCgC5mg';

export interface MinerStats {
  hashrate: number;
  hashrate24h: number;
  lastShare: number;
  balance: number;
  paid: number;
  workers: WorkerData[];
}

export interface WorkerData {
  name: string;
  hashrate: number;
  lastShare: number;
  score: number;
}

export interface PoolStats {
  pool_hashrate: number;
  pool_hashrate_24h: number;
  network_hashrate: number;
  network_difficulty: number;
  network_height: number;
  last_block_found: number;
  total_blocks_found: number;
  connected_miners: number;
  total_paid: number;
  payment_threshold: number;
  pool_fee: number;
}

export interface PaymentData {
  time: number;
  hash: string;
  amount: number;
  fee: number;
  mixin: number;
  payees: number;
}

// Enhanced API client with retry logic and error handling
class SupportXMRClient {
  private baseUrl: string;
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor(useProxy = false) {
    this.baseUrl = useProxy ? CORS_PROXY + SUPPORTXMR_BASE_URL : SUPPORTXMR_BASE_URL;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          // Add timeout
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error as Error;
        console.warn(`API request attempt ${attempt} failed:`, error);

        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw lastError || new Error('All API requests failed');
  }

  // Get miner statistics for specific wallet
  async getMinerStats(walletAddress: string = WALLET_ADDRESS): Promise<MinerStats> {
    try {
      const data = await this.makeRequest(`/miner/${walletAddress}/stats`);
      return {
        hashrate: data.hash || 0,
        hashrate24h: data.hash24h || 0,
        lastShare: data.lastShare || 0,
        balance: data.balance || 0,
        paid: data.paid || 0,
        workers: data.workers || []
      };
    } catch (error) {
      console.error('Failed to fetch miner stats:', error);
      return {
        hashrate: 0,
        hashrate24h: 0,
        lastShare: 0,
        balance: 0,
        paid: 0,
        workers: []
      };
    }
  }

  // Get pool statistics
  async getPoolStats(): Promise<PoolStats> {
    try {
      const data = await this.makeRequest('/pool/stats');
      return {
        pool_hashrate: data.pool_statistics?.hashRate || 0,
        pool_hashrate_24h: data.pool_statistics?.hashRate24h || 0,
        network_hashrate: data.network?.difficulty || 0,
        network_difficulty: data.network?.difficulty || 0,
        network_height: data.network?.height || 0,
        last_block_found: data.pool_statistics?.lastBlockFound || 0,
        total_blocks_found: data.pool_statistics?.totalBlocksFound || 0,
        connected_miners: data.pool_statistics?.miners || 0,
        total_paid: data.pool_statistics?.totalPaid || 0,
        payment_threshold: data.config?.minPaymentThreshold || 0,
        pool_fee: data.config?.fee || 0
      };
    } catch (error) {
      console.error('Failed to fetch pool stats:', error);
      return {
        pool_hashrate: 0,
        pool_hashrate_24h: 0,
        network_hashrate: 0,
        network_difficulty: 0,
        network_height: 0,
        last_block_found: 0,
        total_blocks_found: 0,
        connected_miners: 0,
        total_paid: 0,
        payment_threshold: 0,
        pool_fee: 0
      };
    }
  }

  // Get payment history
  async getPayments(walletAddress: string = WALLET_ADDRESS, limit: number = 10): Promise<PaymentData[]> {
    try {
      const data = await this.makeRequest(`/miner/${walletAddress}/payments?limit=${limit}`);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      return [];
    }
  }

  // Get network statistics
  async getNetworkStats(): Promise<any> {
    try {
      const data = await this.makeRequest('/network/stats');
      return data;
    } catch (error) {
      console.error('Failed to fetch network stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const supportXMRClient = new SupportXMRClient();

// Utility functions for formatting
export const formatHashrate = (hashrate: number): string => {
  if (hashrate >= 1000000000000) {
    return `${(hashrate / 1000000000000).toFixed(2)} TH/s`;
  } else if (hashrate >= 1000000000) {
    return `${(hashrate / 1000000000).toFixed(2)} GH/s`;
  } else if (hashrate >= 1000000) {
    return `${(hashrate / 1000000).toFixed(2)} MH/s`;
  } else if (hashrate >= 1000) {
    return `${(hashrate / 1000).toFixed(2)} KH/s`;
  }
  return `${hashrate.toFixed(2)} H/s`;
};

export const formatXMR = (atomic: number): string => {
  return (atomic / 1000000000000).toFixed(6);
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

// Hook for React components to use SupportXMR data
export const useSupportXMRData = () => {
  const [minerStats, setMinerStats] = useState<MinerStats | null>(null);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [miner, pool] = await Promise.all([
        supportXMRClient.getMinerStats(),
        supportXMRClient.getPoolStats()
      ]);

      setMinerStats(miner);
      setPoolStats(pool);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    minerStats,
    poolStats,
    isLoading,
    error,
    refetch: fetchData
  };
};
