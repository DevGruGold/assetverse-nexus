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
  Hash
} from 'lucide-react';
import { 
  getMinerSummary,
  fetchPoolStats,
  fetchNetworkStats,
  formatHashRate,
  formatNumber,
  piconeroToXMR
} from '@/utils/supportxmr';
import { Button } from '@/components/ui/button';

interface MiningData {
  hashRate: string;
  hashRateRaw: number;
  totalHashes: string;
  totalHashesRaw: number;
  validShares: string;
  validSharesRaw: number;
  amountDue: number;
  amountDueFormatted: string;
  amountPaid: number;
  workerCount: number;
  lastActivity: string;
  isActive: boolean;
}

interface PoolData {
  pool_statistics?: {
    hashRate: number;
    miners: number;
    totalHashes: number;
    totalPayments: number;
  };
  network?: {
    difficulty: number;
    height: number;
    reward: number;
  };
}

const LiveMiningStats: React.FC = () => {
  const [minerData, setMinerData] = useState<MiningData | null>(null);
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [networkData, setNetworkData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [miner, pool, network] = await Promise.all([
        getMinerSummary(),
        fetchPoolStats(),
        fetchNetworkStats()
      ]);

      setMinerData(miner);
      setPoolData(pool);
      setNetworkData(network);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching mining data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch mining data');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (hashrate: number) => {
    if (hashrate > 500) return 'bg-mining-active';
    if (hashrate > 100) return 'bg-mining-warning';
    if (hashrate > 0) return 'bg-mining-info';
    return 'bg-mining-error';
  };

  const getStatusText = (hashrate: number, isActive: boolean) => {
    if (!isActive) return 'Offline';
    if (hashrate > 500) return 'Excellent';
    if (hashrate > 100) return 'Good';
    if (hashrate > 0) return 'Low';
    return 'Inactive';
  };

  if (error) {
    return (
      <Card className="w-full max-w-6xl mx-auto border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Mining Data Unavailable
          </CardTitle>
          <CardDescription className="text-red-600">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={fetchData} 
            className="border-red-300 text-red-700 hover:bg-red-100"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-mining-active/10 to-mining-info/10 border-mining-active/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-mining-active/20 rounded-lg">
                <Activity className="h-6 w-6 text-mining-active" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-foreground">
                  Live Mining Statistics
                </CardTitle>
                <CardDescription className="text-sm">
                  Real-time data from SupportXMR Pool
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {minerData?.isActive && (
                <Badge variant="secondary" className="bg-mining-active/20 text-mining-active">
                  <div className="w-2 h-2 bg-mining-active rounded-full mr-2 animate-pulse"></div>
                  LIVE
                </Badge>
              )}
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
        </CardHeader>
      </Card>

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Hash Rate */}
        <Card className="bg-gradient-to-br from-card to-mining-active/5 border-mining-active/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-mining-active" />
                <CardTitle className="text-sm font-medium text-muted-foreground">Hash Rate</CardTitle>
              </div>
              <Badge 
                variant="secondary" 
                className={`text-xs ${getStatusColor(minerData?.hashRateRaw || 0)} text-white`}
              >
                {getStatusText(minerData?.hashRateRaw || 0, minerData?.isActive || false)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {minerData?.hashRate || '0 H/s'}
              </div>
              <div className="text-xs text-muted-foreground">
                Current mining speed
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valid Shares */}
        <Card className="bg-gradient-to-br from-card to-mining-info/5 border-mining-info/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-mining-info" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Valid Shares</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {minerData?.validShares || '0'}
              </div>
              <div className="text-xs text-muted-foreground">
                Total accepted shares
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Hashes */}
        <Card className="bg-gradient-to-br from-card to-mining-warning/5 border-mining-warning/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-mining-warning" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Hashes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {minerData?.totalHashes || '0'}
              </div>
              <div className="text-xs text-muted-foreground">
                Lifetime computation
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amount Due */}
        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Amount Due</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {minerData?.amountDueFormatted || '0.000000 XMR'}
              </div>
              <div className="text-xs text-muted-foreground">
                Pending payout
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card className="bg-gradient-to-r from-card to-secondary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Detailed Mining Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Miner Details */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Miner Status
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Workers Active</span>
                  <span className="font-medium">{minerData?.workerCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Activity</span>
                  <span className="font-medium text-xs">
                    {minerData?.lastActivity || 'Never'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge 
                    variant={minerData?.isActive ? "default" : "secondary"}
                    className={minerData?.isActive ? "bg-mining-active text-white" : ""}
                  >
                    {minerData?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Pool Information */}
            {poolData?.pool_statistics && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Pool Statistics
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pool Hashrate</span>
                    <span className="font-medium">
                      {formatHashRate(poolData.pool_statistics.hashRate || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Miners</span>
                    <span className="font-medium">
                      {formatNumber(poolData.pool_statistics.miners || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Payments</span>
                    <span className="font-medium">
                      {formatNumber(poolData.pool_statistics.totalPayments || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Network Information */}
            {networkData && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Network Stats
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Block Height</span>
                    <span className="font-medium">
                      {formatNumber(networkData.height || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Difficulty</span>
                    <span className="font-medium">
                      {formatNumber(networkData.difficulty || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Block Reward</span>
                    <span className="font-medium">
                      {piconeroToXMR(networkData.reward || 0).toFixed(4)} XMR
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Progress Indicators */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-mining-active" />
                <span className="text-sm font-medium">Mining Efficiency</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {minerData?.isActive ? 
                  `${Math.min(100, (minerData.hashRateRaw / 1000) * 100).toFixed(0)}%` : '0%'
                }
              </span>
            </div>
            <Progress 
              value={minerData?.isActive ? Math.min(100, (minerData.hashRateRaw / 1000) * 100) : 0} 
              className="h-2"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last updated: {lastUpdate?.toLocaleTimeString() || 'Never'}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              SupportXMR Pool
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveMiningStats;
