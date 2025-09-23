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
  RefreshCw
} from 'lucide-react';
import { 
  supportXMRClient, 
  formatHashrate, 
  formatXMR, 
  formatTime,
  MinerStats,
  PoolStats 
} from '@/lib/supportxmr';
import { Button } from '@/components/ui/button';

const LiveMiningStats: React.FC = () => {
  const [minerStats, setMinerStats] = useState<MinerStats | null>(null);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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
      setLastUpdate(new Date());
    } catch (err) {
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
    if (hashrate > 1000) return 'bg-green-500';
    if (hashrate > 100) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = (hashrate: number) => {
    if (hashrate > 1000) return 'Excellent';
    if (hashrate > 100) return 'Good';
    if (hashrate > 0) return 'Low';
    return 'Offline';
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
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-mining-active/10 to-mining-info/10 border-mining-active/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Activity className="h-6 w-6 text-mining-active animate-pulse" />
                Live Mining Statistics
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Real-time data from SupportXMR Pool • pool.supportxmr.com:3333
              </CardDescription>
            </div>
            <div className="text-right">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchData} 
                disabled={isLoading}
                className="h-8 px-3"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Updating...' : 'Refresh'}
              </Button>
              {lastUpdate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Personal Mining Stats */}
        <Card className="border-mining-info/30 bg-mining-info/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-mining-info">
              <Zap className="h-4 w-4" />
              Your Hashrate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {minerStats ? formatHashrate(minerStats.hashrate) : isLoading ? '...' : '0 H/s'}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(minerStats?.hashrate || 0)} animate-pulse`} />
                <span className="text-sm text-muted-foreground">
                  {getStatusText(minerStats?.hashrate || 0)}
                </span>
              </div>
              {minerStats?.hashrate24h && (
                <div className="text-xs text-muted-foreground">
                  24h avg: {formatHashrate(minerStats.hashrate24h)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Workers */}
        <Card className="border-mining-warning/30 bg-mining-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-mining-warning">
              <Users className="h-4 w-4" />
              Active Workers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {minerStats ? minerStats.workers.length : isLoading ? '...' : '0'}
              </div>
              <div className="text-sm text-muted-foreground">
                {poolStats ? `${poolStats.connected_miners.toLocaleString()} pool miners` : ''}
              </div>
              {minerStats?.workers.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Last share: {minerStats.lastShare ? formatTime(minerStats.lastShare) : 'Never'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Balance Due */}
        <Card className="border-mining-success/30 bg-mining-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-mining-success">
              <Wallet className="h-4 w-4" />
              Balance Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {minerStats ? formatXMR(minerStats.balance) : isLoading ? '...' : '0.000000'} XMR
              </div>
              <div className="text-sm text-muted-foreground">
                ${((parseFloat(formatXMR(minerStats?.balance || 0)) * 150).toFixed(2))} USD
              </div>
              <div className="text-xs text-muted-foreground">
                Total paid: {minerStats ? formatXMR(minerStats.paid) : '0.000000'} XMR
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pool Hashrate */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <Server className="h-4 w-4" />
              Pool Power
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {poolStats ? formatHashrate(poolStats.pool_hashrate) : isLoading ? '...' : '0 H/s'}
              </div>
              <div className="text-sm text-muted-foreground">
                Fee: {poolStats ? poolStats.pool_fee : '0'}%
              </div>
              <div className="text-xs text-muted-foreground">
                Last block: {poolStats?.last_block_found ? formatTime(poolStats.last_block_found) : 'Never'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Network Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-mining-info" />
              Network Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {poolStats && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Network Hashrate</span>
                  <span className="font-medium">{formatHashrate(poolStats.network_hashrate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Difficulty</span>
                  <span className="font-medium">{poolStats.network_difficulty.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Block Height</span>
                  <span className="font-medium">{poolStats.network_height.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Blocks Found</span>
                  <span className="font-medium">{poolStats.total_blocks_found.toLocaleString()}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Worker Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-mining-active" />
              Worker Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {minerStats?.workers && minerStats.workers.length > 0 ? (
              <div className="space-y-3">
                {minerStats.workers.map((worker, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{worker.name || `Worker ${index + 1}`}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatHashrate(worker.hashrate)}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>Score: {worker.score}</div>
                      {worker.lastShare && (
                        <div>Last share: {formatTime(worker.lastShare)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active workers detected</p>
                <p className="text-xs mt-1">Start mining to see worker statistics</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pool Performance Bar */}
      {poolStats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-mining-success" />
              Pool Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-mining-success">99.8%</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-mining-info">&lt;1ms</div>
                <div className="text-xs text-muted-foreground">Latency</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-mining-warning">
                  {formatXMR(poolStats.total_paid)} XMR
                </div>
                <div className="text-xs text-muted-foreground">Total Paid</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {formatXMR(poolStats.payment_threshold)} XMR
                </div>
                <div className="text-xs text-muted-foreground">Min Payout</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveMiningStats;
