import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  WifiOff,
  DollarSign,
  Timer
} from 'lucide-react';

// Mining statistics interfaces
interface SupportXMRMinerStats {
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

interface MiningStats {
  hashrate: number;
  totalHashes: number;
  validShares: number;
  invalidShares: number;
  xmrtEarned: number;
  xmrtPaid: number;
  uptime: string;
  status: 'connected' | 'disconnected' | 'loading';
  lastUpdate: Date;
}

const LiveMiningStats: React.FC = () => {
  // Hard-coded wallet address as requested
  const WALLET_ADDRESS = "46UxNFuGM2E3UwmZWWJicaRPoRwqwW4byQkaTHkX8yPcVihp91qAVtSFipWUGJJUyTXgzSqxzDQtNLf2bsp2DX2qCCgC5mg";

  const [miningStats, setMiningStats] = useState<MiningStats>({
    hashrate: 0,
    totalHashes: 0,
    validShares: 0,
    invalidShares: 0,
    xmrtEarned: 0,
    xmrtPaid: 0,
    uptime: "0h 0m",
    status: 'loading',
    lastUpdate: new Date()
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real mining data using AllOrigins CORS proxy (proven working)
  const fetchMiningData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use AllOrigins proxy - this is the working method from our testing
      const supportxmrUrl = `https://supportxmr.com/api/miner/${WALLET_ADDRESS}/stats`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(supportxmrUrl)}`;

      console.log('Fetching mining data from:', supportxmrUrl);
      console.log('Using proxy:', proxyUrl);

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const proxyData = await response.json();

      // AllOrigins returns the API response in the 'contents' field
      if (!proxyData.contents) {
        throw new Error('Invalid proxy response structure');
      }

      const apiData: SupportXMRMinerStats = JSON.parse(proxyData.contents);

      console.log('Received mining data:', apiData);

      // Update stats with real data
      setMiningStats({
        hashrate: apiData.hash || 0,
        totalHashes: apiData.totalHashes || 0,
        validShares: apiData.validShares || 0,
        invalidShares: apiData.invalidShares || 0,
        xmrtEarned: (apiData.amtDue || 0) / 1000000000000, // Convert from atomic units
        xmrtPaid: (apiData.amtPaid || 0) / 1000000000000, // Convert from atomic units
        uptime: calculateUptime(apiData.lastHash || Date.now()),
        status: (apiData.hash || 0) > 0 ? 'connected' : 'disconnected',
        lastUpdate: new Date()
      });

      setIsLoading(false);

    } catch (err) {
      console.error('Error fetching mining data:', err);
      setError(`Failed to fetch mining data: ${err.message}`);
      setIsLoading(false);
      setMiningStats(prev => ({
        ...prev,
        status: 'disconnected'
      }));
    }
  };

  // Calculate uptime from last hash timestamp
  const calculateUptime = (lastHashTime: number): string => {
    const now = Date.now();
    const uptimeMs = now - lastHashTime;
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Format hashrate with appropriate units
  const formatHashrate = (hashrate: number): string => {
    if (hashrate === 0) return "0 H/s";
    if (hashrate < 1000) return `${hashrate} H/s`;
    if (hashrate < 1000000) return `${(hashrate / 1000).toFixed(1)} KH/s`;
    return `${(hashrate / 1000000).toFixed(1)} MH/s`;
  };

  // Format XMR amounts
  const formatXMR = (amount: number): string => {
    return amount.toFixed(6);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchMiningData();
    const interval = setInterval(fetchMiningData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get status color
  const getStatusColor = () => {
    switch (miningStats.status) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (miningStats.status) {
      case 'connected': return <Wifi className="h-4 w-4" />;
      case 'disconnected': return <WifiOff className="h-4 w-4" />;
      default: return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4">
      {/* Header - Using white text as requested, removing purple/blue styling */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Live Mining Statistics
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Real-time performance from SupportXMR pool
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={`${getStatusColor()} border-current`}
          >
            {getStatusIcon()}
            <span className="ml-1 capitalize">{miningStats.status}</span>
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMiningData}
            disabled={isLoading}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-900/20 border-red-500/50">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Current Hashrate */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Zap className="mr-2 h-4 w-4" />
              Current Hashrate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                formatHashrate(miningStats.hashrate)
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Live performance</p>
          </CardContent>
        </Card>

        {/* XMR Earned */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Coins className="mr-2 h-4 w-4" />
              XMR Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                `${formatXMR(miningStats.xmrtEarned)} XMR`
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Amount due</p>
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
                miningStats.validShares.toLocaleString()
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Accepted work</p>
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
                miningStats.totalHashes.toLocaleString()
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Lifetime work</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Card */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Server className="mr-2 h-5 w-5" />
            Mining Details
          </CardTitle>
          <CardDescription className="text-gray-400">
            Comprehensive mining performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* XMR Paid */}
            <div className="space-y-2">
              <div className="flex items-center text-gray-400">
                <DollarSign className="h-4 w-4 mr-2" />
                <span className="text-sm">XMR Paid</span>
              </div>
              <div className="text-lg font-semibold text-white">
                {formatXMR(miningStats.xmrtPaid)} XMR
              </div>
            </div>

            {/* Invalid Shares */}
            <div className="space-y-2">
              <div className="flex items-center text-gray-400">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="text-sm">Invalid Shares</span>
              </div>
              <div className="text-lg font-semibold text-white">
                {miningStats.invalidShares.toLocaleString()}
              </div>
            </div>

            {/* Last Update */}
            <div className="space-y-2">
              <div className="flex items-center text-gray-400">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm">Last Update</span>
              </div>
              <div className="text-lg font-semibold text-white">
                {miningStats.lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Wallet Address */}
          <div className="space-y-2">
            <div className="flex items-center text-gray-400">
              <Wallet className="h-4 w-4 mr-2" />
              <span className="text-sm">Mining Address</span>
            </div>
            <div className="text-sm font-mono text-white bg-gray-800 p-2 rounded border">
              {WALLET_ADDRESS}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveMiningStats;