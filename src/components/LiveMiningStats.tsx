import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  Zap, 
  Users, 
  Coins, 
  TrendingUp, 
  Clock, 
  Shield, 
  Server,
  Wallet,
  RefreshCw,
  Hash,
  AlertTriangle,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MiningData {
  hash: number;
  identifier: string;
  lastHash: number;
  totalHashes: number;
  validShares: number;
  invalidShares?: number;
  amtDue: string | number;
  amtPaid: string | number;
  txnCount?: number;
  status?: string;
}

interface PoolData {
  poolHashrate: number;
  connectedMiners: number;
  networkDifficulty: number;
  blockHeight: number;
}

interface ApiResponse {
  minerStats: MiningData | null;
  poolStats: PoolData | null;
  timestamp: number;
  error?: string;
}

const LiveMiningStats: React.FC = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentProxy, setCurrentProxy] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  // XMRT DAO Wallet address - this is the real wallet
  const WALLET_ADDRESS = "46UxNFuGM2E3UwmZWWJicaRPoRwqwW4byQkaTHkX8yPcVihp91qAVtSFipWUGJJUyTXgzDQtNLf2bsp2DX2qCCgC5mg";

  // Multiple CORS proxies for redundancy
  const CORS_PROXIES = [
    "https://api.allorigins.win/get?url=",
    "https://api.codetabs.com/v1/proxy?quest=",
    "https://corsproxy.io/?",
  ];

  // SupportXMR API endpoints
  const MINING_STATS_API = `https://www.supportxmr.com/api/miner/${WALLET_ADDRESS}/stats`;
  const POOL_STATS_API = "https://www.supportxmr.com/api/pool/stats";

  /**
   * Fetch data with CORS proxy fallbacks
   */
  const fetchWithProxy = async (url: string, proxyIndex: number = 0): Promise<any> => {
    if (proxyIndex >= CORS_PROXIES.length) {
      throw new Error('All CORS proxies failed');
    }

    const proxy = CORS_PROXIES[proxyIndex];
    const proxyUrl = `${proxy}${encodeURIComponent(url)}`;

    setCurrentProxy(proxy.split('/')[2].split('.')[0]); // Extract proxy name

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

      // Handle other proxy formats
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
   * Fetch live mining statistics
   */
  const fetchMiningData = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching live mining data for wallet:', WALLET_ADDRESS);

      // Fetch mining stats and pool stats in parallel
      const [minerStats, poolStats] = await Promise.allSettled([
        fetchWithProxy(MINING_STATS_API),
        fetchWithProxy(POOL_STATS_API)
      ]);

      const response: ApiResponse = {
        minerStats: null,
        poolStats: null,
        timestamp: Date.now()
      };

      // Process miner stats
      if (minerStats.status === 'fulfilled') {
        response.minerStats = minerStats.value;
        console.log('Successfully fetched miner stats:', minerStats.value);
      } else {
        console.warn('Failed to fetch miner stats:', minerStats.reason);
      }

      // Process pool stats
      if (poolStats.status === 'fulfilled') {
        const poolData = poolStats.value;
        response.poolStats = {
          poolHashrate: poolData.pool_statistics?.hashRate || 0,
          connectedMiners: poolData.pool_statistics?.miners || 0,
          networkDifficulty: poolData.network?.difficulty || 0,
          blockHeight: poolData.network?.height || 0
        };
        console.log('Successfully fetched pool stats:', response.poolStats);
      } else {
        console.warn('Failed to fetch pool stats:', poolStats.reason);
      }

      // If both requests failed, show error
      if (minerStats.status === 'rejected' && poolStats.status === 'rejected') {
        throw new Error('Unable to connect to SupportXMR API. Please check your connection and try again.');
      }

      setData(response);
      setLastUpdate(new Date());
      setRetryCount(0);
      setIsOnline(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Failed to fetch mining data:', errorMessage);
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Auto-refresh data every 30 seconds
   */
  useEffect(() => {
    fetchMiningData();

    const interval = setInterval(() => {
      fetchMiningData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  /**
   * Get status badge color based on mining activity
   */
  const getStatusColor = (minerData: MiningData | null): string => {
    if (!minerData) return 'bg-gray-500';
    if (minerData.hash > 0) return 'bg-green-500';
    return 'bg-red-500';
  };

  /**
   * Get status text
   */
  const getStatusText = (minerData: MiningData | null): string => {
    if (!minerData) return 'Connecting...';
    if (minerData.hash > 0) return 'Live Mining';
    return 'Inactive';
  };

  /**
   * Format hash rate to human readable format
   */
  const formatHashRate = (hashRate: number): string => {
    if (hashRate >= 1e9) return `${(hashRate / 1e9).toFixed(2)} GH/s`;
    if (hashRate >= 1e6) return `${(hashRate / 1e6).toFixed(2)} MH/s`;
    if (hashRate >= 1e3) return `${(hashRate / 1e3).toFixed(2)} KH/s`;
    return `${hashRate.toFixed(0)} H/s`;
  };

  /**
   * Format XMR amount
   */
  const formatXMR = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '0.000000' : num.toFixed(6);
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const minerData = data?.minerStats;
  const poolData = data?.poolStats;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Live Mining Statistics</h2>
          <p className="text-gray-400 text-sm">Real-time data from SupportXMR Pool</p>
        </div>

        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <Badge 
            className={`${getStatusColor(minerData)} text-white font-medium`}
          >
            {getStatusText(minerData)}
          </Badge>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-500 bg-red-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-white">
            <div className="flex items-center justify-between">
              <div>
                <strong>Connection Error:</strong> {error}
                {retryCount > 0 && (
                  <span className="block text-sm mt-1 text-gray-300">
                    Retry attempt #{retryCount} • Using proxy: {currentProxy}
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchMiningData}
                disabled={isLoading}
                className="ml-4"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hash Rate */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Zap className="mr-2 h-4 w-4" />
              Hash Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                formatHashRate(minerData?.hash || 0)
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Current mining speed</p>
          </CardContent>
        </Card>

        {/* Valid Shares */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Valid Shares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                (minerData?.validShares || 0).toLocaleString()
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total accepted shares</p>
          </CardContent>
        </Card>

        {/* Total Hashes */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Hash className="mr-2 h-4 w-4" />
              Total Hashes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                (minerData?.totalHashes || 0).toLocaleString()
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Lifetime computation</p>
          </CardContent>
        </Card>

        {/* Amount Due */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Coins className="mr-2 h-4 w-4" />
              Amount Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                `${formatXMR(minerData?.amtDue || 0)} XMR`
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pending payout</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center">
              <Server className="mr-2 h-5 w-5" />
              Detailed Mining Information
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchMiningData}
              disabled={isLoading}
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Refresh
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Miner Status */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              Miner Status
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Workers Active</p>
                <p className="text-lg font-medium text-white">
                  {minerData?.hash > 0 ? "1" : "0"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Last Activity</p>
                <p className="text-lg font-medium text-white">
                  {minerData?.lastHash ? formatTimeAgo(minerData.lastHash * 1000) : "Never"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-lg font-medium text-white">
                  {getStatusText(minerData)}
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Mining Efficiency */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Mining Efficiency
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Share Acceptance Rate</span>
                <span className="text-white">
                  {minerData ? 
                    (((minerData.validShares || 0) / Math.max((minerData.validShares || 0) + (minerData.invalidShares || 0), 1)) * 100).toFixed(1) : 
                    "0"
                  }%
                </span>
              </div>
              <Progress 
                value={minerData ? 
                  ((minerData.validShares || 0) / Math.max((minerData.validShares || 0) + (minerData.invalidShares || 0), 1)) * 100 : 
                  0
                } 
                className="h-2" 
              />
            </div>
          </div>

          {/* Last Update */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Last updated: {lastUpdate?.toLocaleTimeString() || "Never"}
            </div>
            <div className="flex items-center">
              <Wallet className="mr-2 h-4 w-4" />
              XMRT DAO Wallet
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pool Statistics */}
      {poolData && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="mr-2 h-5 w-5" />
              SupportXMR Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{formatHashRate(poolData.poolHashrate)}</p>
                <p className="text-xs text-gray-500">Pool Hashrate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{poolData.connectedMiners.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Connected Miners</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{poolData.networkDifficulty.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Network Difficulty</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{poolData.blockHeight.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Block Height</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveMiningStats;
