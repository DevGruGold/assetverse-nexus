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

  // Use the Supabase proxy endpoint
  const SUPABASE_URL = "https://vawouugtzwmejxqkeqqj.supabase.co";
  const API_ENDPOINT = `${SUPABASE_URL}/functions/v1/mining-proxy`;

    const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching mining data from Supabase proxy...');

      const response = await fetch(API_ENDPOINT, {
        method: 'GET',
        headers: {
          'apikey': 'sb_publishable_yIaroctFhoYStx0f9XajBg_zhpuVulw',
          'Authorization': `Bearer sb_publishable_yIaroctFhoYStx0f9XajBg_zhpuVulw`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Mining data received:', result);

      setData(result);
      setLastUpdate(new Date());

    } catch (err) {
      console.error('Error fetching mining data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch mining data');
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

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatXMR = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${num.toFixed(6)} XMR`;
  };

  const getStatusColor = (isActive: boolean, isDemo: boolean = false): string => {
    if (isDemo) return "bg-blue-500";
    return isActive ? "bg-green-500" : "bg-red-500";
  };

  const getStatusText = (isActive: boolean, isDemo: boolean = false): string => {
    if (isDemo) return "Demo Mode";
    return isActive ? "Active" : "Inactive";
  };

  const isActive = data?.minerStats ? 
    (Date.now() / 1000) - data.minerStats.lastHash < 300 : // Active if hash within 5 minutes
    false;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Live Mining Statistics
            </CardTitle>
            <CardDescription>Loading real-time data from SupportXMR Pool...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Connection Error
            </CardTitle>
            <CardDescription>Unable to fetch mining statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={fetchData} 
              className="mt-4"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const minerStats = data?.minerStats;
  const poolStats = data?.poolStats;

  return (
    <div className="space-y-6">
      {/* Header with status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Mining Statistics
              </CardTitle>
              <CardDescription>Real-time data from SupportXMR Pool</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Badge 
                className={`${getStatusColor(isActive, minerStats?.isDemo)} text-white`}
              >
                {getStatusText(isActive, minerStats?.isDemo)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        {minerStats?.isDemo && (
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {minerStats.demoNote}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Main mining stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-blue-500" />
              <p className="text-sm font-medium text-muted-foreground">Hash Rate</p>
            </div>
            <p className="text-2xl font-bold">
              {minerStats ? formatHashRate(minerStats.hash) : '0 H/s'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Current mining speed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <p className="text-sm font-medium text-muted-foreground">Valid Shares</p>
            </div>
            <p className="text-2xl font-bold">
              {minerStats ? formatNumber(minerStats.validShares) : '0'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total accepted shares</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <p className="text-sm font-medium text-muted-foreground">Total Hashes</p>
            </div>
            <p className="text-2xl font-bold">
              {minerStats ? formatNumber(minerStats.totalHashes) : '0'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Lifetime computation</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-purple-500" />
              <p className="text-sm font-medium text-muted-foreground">Amount Due</p>
            </div>
            <p className="text-2xl font-bold">
              {minerStats ? formatXMR(minerStats.amtDue) : '0.000000 XMR'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Pending payout</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed mining information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Detailed Mining Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground">Miner Status</h4>

              <div className="flex justify-between items-center">
                <span className="text-sm">Workers Active</span>
                <Badge variant="outline">
                  {isActive ? '1' : '0'}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Last Activity</span>
                <span className="text-sm text-muted-foreground">
                  {minerStats?.lastHash ? 
                    new Date(minerStats.lastHash * 1000).toLocaleString() : 
                    'Never'
                  }
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Status</span>
                <Badge 
                  variant={isActive ? "default" : "secondary"}
                  className={isActive ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  {getStatusText(isActive, minerStats?.isDemo)}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground">Mining Efficiency</h4>

              {minerStats && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Hash Rate Performance</span>
                      <span>{minerStats.hash > 0 ? '100%' : '0%'}</span>
                    </div>
                    <Progress value={minerStats.hash > 0 ? 100 : 0} className="h-2" />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Last updated: {lastUpdate?.toLocaleTimeString() || 'Never'}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pool Statistics */}
      {poolStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              SupportXMR Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Pool Hashrate</p>
                <p className="text-lg font-semibold">
                  {formatHashRate(poolStats.poolHashrate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connected Miners</p>
                <p className="text-lg font-semibold">
                  {formatNumber(poolStats.connectedMiners)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Network Difficulty</p>
                <p className="text-lg font-semibold">
                  {formatNumber(poolStats.networkDifficulty)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Block Height</p>
                <p className="text-lg font-semibold">
                  {formatNumber(poolStats.blockHeight)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveMiningStats;