// SupportXMR Pool API Integration
// Official API endpoints based on nodejs-pool implementation

export interface MinerStats {
  hash: number;
  identifier: string;
  lastHash: number;
  totalHashes: number;
  validShares: number;
  invalidShares: number;
  expiry: number;
  amtPaid: number;
  amtDue: number;
  txnCount: number;
}

export interface PoolStats {
  pool_statistics: {
    hashRate: number;
    miners: number;
    totalHashes: number;
    totalPayments: number;
    networkSols: number;
    poolSols: number;
    lastBlockFoundTime: number;
    lastBlockFound: number;
  };
  network: {
    difficulty: number;
    height: number;
    timestamp: number;
    reward: number;
    hash: string;
  };
}

export interface WorkerStats {
  [key: string]: {
    lts: number;
    identifer: string;
    hash: number;
    totalHash: number;
  };
}

const BASE_URL = 'https://supportxmr.com/api';
const WALLET_ADDRESS = '46UxNFuGM2E3UwmZWWJicaRPoRwqwW4byQkaTHkX8yPcVihp91qAVtSFipWUGJJUyTXgzSqxzDQtNLf2bsp2DX2qCCgC5mg';

// Utility function to format numbers
export const formatNumber = (num: number): string => {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toLocaleString();
};

// Convert piconeros to XMR
export const piconeroToXMR = (piconeros: number): number => {
  return piconeros / 1e12;
};

// Format hash rate with appropriate units
export const formatHashRate = (hashRate: number): string => {
  if (hashRate >= 1e9) {
    return (hashRate / 1e9).toFixed(2) + ' GH/s';
  }
  if (hashRate >= 1e6) {
    return (hashRate / 1e6).toFixed(2) + ' MH/s';
  }
  if (hashRate >= 1e3) {
    return (hashRate / 1e3).toFixed(2) + ' KH/s';
  }
  return hashRate.toFixed(0) + ' H/s';
};

// Fetch miner statistics for specific wallet
export const fetchMinerStats = async (walletAddress: string = WALLET_ADDRESS): Promise<MinerStats> => {
  try {
    const response = await fetch(`${BASE_URL}/miner/${walletAddress}/stats`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching miner stats:', error);
    // Return fallback data with zeros
    return {
      hash: 0,
      identifier: 'global',
      lastHash: 0,
      totalHashes: 0,
      validShares: 0,
      invalidShares: 0,
      expiry: 0,
      amtPaid: 0,
      amtDue: 0,
      txnCount: 0,
    };
  }
};

// Fetch all workers for a miner
export const fetchMinerWorkers = async (walletAddress: string = WALLET_ADDRESS): Promise<WorkerStats> => {
  try {
    const response = await fetch(`${BASE_URL}/miner/${walletAddress}/stats/allWorkers`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching worker stats:', error);
    return {};
  }
};

// Fetch pool statistics
export const fetchPoolStats = async (): Promise<PoolStats | null> => {
  try {
    const response = await fetch(`${BASE_URL}/pool/stats`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching pool stats:', error);
    return null;
  }
};

// Fetch network statistics
export const fetchNetworkStats = async () => {
  try {
    const response = await fetch(`${BASE_URL}/network/stats`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching network stats:', error);
    return null;
  }
};

// Fetch miner payments history
export const fetchMinerPayments = async (walletAddress: string = WALLET_ADDRESS) => {
  try {
    const response = await fetch(`${BASE_URL}/miner/${walletAddress}/payments`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching miner payments:', error);
    return [];
  }
};

// Get formatted mining summary
export const getMinerSummary = async (walletAddress: string = WALLET_ADDRESS) => {
  try {
    const stats = await fetchMinerStats(walletAddress);
    const workers = await fetchMinerWorkers(walletAddress);

    return {
      hashRate: formatHashRate(stats.hash),
      hashRateRaw: stats.hash,
      totalHashes: formatNumber(stats.totalHashes),
      totalHashesRaw: stats.totalHashes,
      validShares: formatNumber(stats.validShares),
      validSharesRaw: stats.validShares,
      amountDue: piconeroToXMR(stats.amtDue),
      amountDueFormatted: piconeroToXMR(stats.amtDue).toFixed(6) + ' XMR',
      amountPaid: piconeroToXMR(stats.amtPaid),
      workerCount: Object.keys(workers).length,
      lastActivity: new Date(stats.lastHash * 1000).toLocaleString(),
      isActive: Date.now() - (stats.lastHash * 1000) < 300000, // Active if last hash within 5 minutes
    };
  } catch (error) {
    console.error('Error getting miner summary:', error);
    return {
      hashRate: '0 H/s',
      hashRateRaw: 0,
      totalHashes: '0',
      totalHashesRaw: 0,
      validShares: '0',
      validSharesRaw: 0,
      amountDue: 0,
      amountDueFormatted: '0.000000 XMR',
      amountPaid: 0,
      workerCount: 0,
      lastActivity: 'Never',
      isActive: false,
    };
  }
};

export default {
  fetchMinerStats,
  fetchMinerWorkers,
  fetchPoolStats,
  fetchNetworkStats,
  fetchMinerPayments,
  getMinerSummary,
  formatNumber,
  formatHashRate,
  piconeroToXMR,
};
