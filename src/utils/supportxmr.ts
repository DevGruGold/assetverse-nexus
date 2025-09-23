export interface MiningStats {
  hash: number;
  identifier: string;
  lastHash: number;
  totalHashes: number;
  validShares: number;
  invalidShares: number;
  amtDue: number;
  amtPaid: number;
  txnCount: number;
}

export interface PoolStats {
  pool_statistics: {
    hashRate: number;
    miners: number;
  };
  network: {
    difficulty: number;
    height: number;
  };
}

// CORS proxy URLs for accessing SupportXMR API
export const CORS_PROXIES = [
  "https://api.allorigins.win/get?url=",
  "https://api.codetabs.com/v1/proxy?quest=",
];

export const WALLET_ADDRESS = "46UxNFuGM2E3UwmZWWJicaRPoRwqwW4byQkaTHkX8yPcVihp91qAVtSFipWUGJJUyTXgzDQtNLf2bsp2DX2qCCgC5mg";

/**
 * Fetch data from SupportXMR API using CORS proxy fallbacks
 */
export const fetchWithProxy = async (url: string, proxyIndex: number = 0): Promise<any> => {
  if (proxyIndex >= CORS_PROXIES.length) {
    throw new Error('All CORS proxies failed');
  }

  const proxy = CORS_PROXIES[proxyIndex];
  const proxyUrl = `${proxy}${encodeURIComponent(url)}`;

  try {
    console.log(`Fetching with proxy ${proxyIndex + 1}:`, proxy.split('/')[2]);

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Handle AllOrigins response format
    if (proxy.includes('allorigins') && result.contents) {
      return JSON.parse(result.contents);
    }

    return result;

  } catch (error) {
    console.warn(`Proxy ${proxyIndex + 1} failed:`, error);

    // Try next proxy
    if (proxyIndex < CORS_PROXIES.length - 1) {
      return await fetchWithProxy(url, proxyIndex + 1);
    }

    throw error;
  }
};

/**
 * Get mining statistics for the configured wallet
 */
export const getMiningStats = async (): Promise<MiningStats> => {
  const url = `https://www.supportxmr.com/api/miner/${WALLET_ADDRESS}/stats`;
  return await fetchWithProxy(url);
};

/**
 * Get SupportXMR pool statistics
 */
export const getPoolStats = async (): Promise<PoolStats> => {
  const url = "https://www.supportxmr.com/api/pool/stats";
  return await fetchWithProxy(url);
};

/**
 * Format hash rate to human readable string
 */
export const formatHashRate = (hashRate: number): string => {
  if (hashRate >= 1e9) return `${(hashRate / 1e9).toFixed(2)} GH/s`;
  if (hashRate >= 1e6) return `${(hashRate / 1e6).toFixed(2)} MH/s`;
  if (hashRate >= 1e3) return `${(hashRate / 1e3).toFixed(2)} KH/s`;
  return `${hashRate.toFixed(0)} H/s`;
};

/**
 * Format XMR amount to 6 decimal places
 */
export const formatXMR = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(6);
};

/**
 * Format timestamp to "time ago" string
 */
export const formatTimeAgo = (timestamp: number): string => {
  if (timestamp === 0) return 'Never';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};
