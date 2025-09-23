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
  Loader2
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
  isDemo?: boolean;
  demoNote?: string;
  error?: string;
  status?: string;
}

interface PoolData {
  poolHashrate: number;
  connectedMiners: number;
  networkDifficulty: number;
  blockHeight: number;
}

interface ApiResponse {
  minerStats: MiningData;
  poolStats: PoolData | null;
  timestamp: number;
}

const LiveMiningStats: React.FC = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentProxy, setCurrentProxy] = useState<string>("");

  // Wallet address for mining stats
  const WALLET_ADDRESS = "46UxNFuGM2E3UwmZWWJicaRPoRwqwW4byQkaTHkX8yPcVihp91qAVtSFipWUGJJUyTXgzDQtNLf2bsp2DX2qCCgC5mg";

  // CORS proxies with fallbacks
  const CORS_PROXIES = [
    "https://api.allorigins.win/get?url=",
    "https://api.codetabs.com/v1/proxy?quest=",
  ];

  const SUPPORTXMR_API = `https://www.supportxmr.com/api/miner/${WALLET_ADDRESS}/stats`;
  const POOL_STATS_API = "https://www.supportxmr.com/api/pool/stats";

  const fetchWithProxy = async (url: string, proxyIndex: number = 0): Promise<any> => {
    if (proxyIndex >= CORS_PROXIES.length) {
      throw new Error('All CORS proxies failed');
    }

    const proxy = CORS_PROXIES[proxyIndex];
    const proxyUrl = `${proxy}${encodeURIComponent(url)}`;

    try {
      console.log(`Attempting to fetch with proxy ${proxyIndex + 1}:`, proxy);
      setCurrentProxy(proxy.split('/')[2]); // Extract domain name

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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching mining data from SupportXMR API...');

      // Fetch miner stats
      const minerStats = await fetchWithProxy(SUPPORTXMR_API);
      console.log('Mining stats received:', minerStats);

      // Fetch pool stats (optional, may fail)
      let poolStats = null;
      try {
        poolStats = await fetchWithProxy(POOL_STATS_API);
        if (poolStats?.pool_statistics) {
          poolStats = {
            poolHashrate: poolStats.pool_statistics.hashRate || 0,
            connectedMiners: poolStats.pool_statistics.miners || 0,
            networkDifficulty: poolStats.network?.difficulty || 0,
            blockHeight: poolStats.network?.height || 0,
          };
        }
      } catch (poolError) {
        console.warn('Pool stats unavailable:', poolError);
      }

      // Check if we got real mining data or if wallet has no activity
      const isActive = minerStats.hash > 0 || minerStats.totalHashes > 0;

      if (!isActive) {
        // Show demo data when wallet is inactive
        const demoData: MiningData = {
          hash: 2500 + Math.random() * 1500,
          identifier: "demo",
          lastHash: Date.now() - Math.floor(Math.random() * 60000),
          totalHashes: Math.floor(Math.random() * 1000000) + 500000,
          validShares: Math.floor(Math.random() * 1000) + 100,
          invalidShares: Math.floor(Math.random() * 10),
          amtDue: (Math.random() * 0.01).toFixed(6),
          amtPaid: (Math.random() * 0.1).toFixed(6),
          txnCount: Math.floor(Math.random() * 20) + 5,
          isDemo: true,
          demoNote: "Demo data - Start mining to see live statistics"
        };

        setData({
          minerStats: demoData,
          poolStats,
          timestamp: Date.now()
        });
      } else {
        setData({
          minerStats: minerStats,
          poolStats,
          timestamp: Date.now()
        });
      }

      setLastUpdate(new Date());

    } catch (err) {
      console.error('Error fetching mining data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch mining data');

      // Fallback to demo data on error
      const fallbackData: MiningData = {
        hash: 0,
        identifier: "offline",
        lastHash: 0,
        totalHashes: 0,
        validShares: 0,
        amtDue: "0.000000",
        amtPaid: "0.000000",
        txnCount: 0,
        error: "Connection failed - showing offline state",
        status: "offline"
      };

      setData({
        minerStats: fallbackData,
        poolStats: null,
        timestamp: Date.now()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Utility functions
  const formatHashRate = (hashRate: number): string => {
    if (hashRate >= 1e9) return `${(hashRate / 1e9).toFixed(2)} GH/s`;
    if (hashRate >= 1e6) return `${(hashRate / 1e6).toFixed(2)} MH/s`;
    if (hashRate >= 1e3) return `${(hashRate / 1e3).toFixed(2)} KH/s`;
    return `${hashRate.toFixed(0)} H/s`;
  };

  const formatXMR = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(6);
  };

  const formatTimeAgo = (timestamp: number): string => {
    if (timestamp === 0) return 'Never';
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getStatusColor = (minerData: MiningData): string => {
    if (minerData.isDemo) return 'bg-blue-500';
    if (minerData.error || minerData.status === 'offline') return 'bg-red-500';
    if (minerData.hash > 0) return 'bg-green-500';
    return 'bg-yellow-500';
  };

  const getStatusText = (minerData: MiningData): string => {
    if (minerData.isDemo) return 'Demo Mode';
    if (minerData.error || minerData.status === 'offline') return 'Offline';
    if (minerData.hash > 0) return 'Active';
    return 'Inactive';
  };

  if (isLoading && !data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Mining Statistics...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const minerData = data?.minerStats;
  const poolData = data?.poolStats;

  return (
    <div className="space-y-6">
      {/* Status and Connection Info */}
      {currentProxy && (
        <div className="text-xs text-gray-500 text-center">
          Connected via: {currentProxy}
        </div>
      )}

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error} - Showing fallback data
          </AlertDescription>
        </Alert>
      )}

      {minerData?.isDemo && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            {minerData.demoNote}
          </AlertDescription>
        </Alert>
      )}

      {/* Live Mining Statistics Card */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Live Mining Statistics
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(minerData || {})} text-white`}>
                {getStatusText(minerData || {})}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchData}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <CardDescription>
            Real-time data from SupportXMR Pool
            {lastUpdate && (
              <span className="block text-xs text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mining Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Hash Rate</span>
              </div>
              <div className="text-2xl font-bold">
                {minerData ? formatHashRate(minerData.hash) : 'Offline'}
              </div>
              <div className="text-xs text-gray-500">Current mining speed</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Valid Shares</span>
              </div>
              <div className="text-2xl font-bold">
                {minerData?.validShares?.toLocaleString() || '0'}
              </div>
              <div className="text-xs text-gray-500">Total accepted shares</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Total Hashes</span>
              </div>
              <div className="text-2xl font-bold">
                {minerData?.totalHashes?.toLocaleString() || '0'}
              </div>
              <div className="text-xs text-gray-500">Lifetime computation</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Amount Due</span>
              </div>
              <div className="text-2xl font-bold">
                {formatXMR(minerData?.amtDue || '0.000000')} XMR
              </div>
              <div className="text-xs text-gray-500">Pending payout</div>
            </div>
          </div>

          <Separator />

          {/* Detailed Mining Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Detailed Mining Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Miner Status */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Miner Status</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Workers Active</span>
                    <span className="font-medium">{minerData?.hash > 0 ? '1' : '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Activity</span>
                    <span className="font-medium">
                      {minerData?.lastHash ? formatTimeAgo(minerData.lastHash) : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge variant="outline" className={`${getStatusColor(minerData || {})} text-white border-0`}>
                      {getStatusText(minerData || {})}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Mining Efficiency */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Mining Efficiency</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Efficiency</span>
                      <span className="font-medium">
                        {minerData?.hash > 0 ? '95%' : '0%'}
                      </span>
                    </div>
                    <Progress 
                      value={minerData?.hash > 0 ? 95 : 0} 
                      className="h-2"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Invalid Shares</span>
                    <span className="font-medium">{minerData?.invalidShares || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Payments</span>
                    <span className="font-medium">{minerData?.txnCount || '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pool Statistics */}
          {poolData && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-gray-700 mb-3">SupportXMR Pool</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Pool Hashrate</span>
                    <div className="font-medium">{formatHashRate(poolData.poolHashrate)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Connected Miners</span>
                    <div className="font-medium">{poolData.connectedMiners?.toLocaleString() || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Network Difficulty</span>
                    <div className="font-medium">{poolData.networkDifficulty?.toLocaleString() || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Block Height</span>
                    <div className="font-medium">{poolData.blockHeight?.toLocaleString() || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveMiningStats;
