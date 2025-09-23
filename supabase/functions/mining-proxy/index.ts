import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Demo data for when real mining data is unavailable
const getDemoMiningData = () => {
  const now = Math.floor(Date.now() / 1000);
  const baseHashrate = 2500 + Math.random() * 1500; // 2.5-4 KH/s

  return {
    hash: Math.floor(baseHashrate),
    identifier: "demo",
    lastHash: now - Math.floor(Math.random() * 60), // Within last minute
    totalHashes: Math.floor(Math.random() * 1000000) + 500000,
    validShares: Math.floor(Math.random() * 1000) + 100,
    invalidShares: Math.floor(Math.random() * 10),
    amtDue: (Math.random() * 0.01).toFixed(6),
    amtPaid: (Math.random() * 0.1).toFixed(6),
    txnCount: Math.floor(Math.random() * 20) + 5,
    isDemo: true,
    demoNote: "Demo data - Connect your miner to see live stats"
  };
};

// Get pool stats for context
const getPoolStats = async () => {
  try {
    const response = await fetch('https://www.supportxmr.com/api/pool/stats', {
      headers: { 'User-Agent': 'XMRT-DAO/1.0' },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        poolHashrate: data.pool_statistics?.hashRate || 0,
        connectedMiners: data.pool_statistics?.miners || 0,
        networkDifficulty: data.network?.difficulty || 0,
        blockHeight: data.network?.height || 0,
      };
    }
  } catch (error) {
    console.log('Pool stats unavailable:', error);
  }
  return null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get configuration from environment variables
    const minerAddress = Deno.env.get('MINER_WALLET_ADDRESS') || '46UxNFuGM2E3UwmZWWJicaRPoRwqwW4byQkaTHkX8yPcVihp91qAVtSFipWUGJJUyTXgzDQtNLf2bsp2DX2qCCgC5mg';
    const poolApiBase = Deno.env.get('POOL_API_URL') || 'https://www.supportxmr.com/api';
    
    // Validate wallet address format (basic Monero address validation)
    if (!minerAddress || minerAddress.length < 90 || !minerAddress.startsWith('4')) {
      console.log('Invalid miner address format:', minerAddress);
      return new Response(JSON.stringify({
        ...getDemoMiningData(),
        error: 'Invalid wallet address configuration',
        status: 'error'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const apiUrl = `${poolApiBase}/miner/${minerAddress}/stats`;
    const historyUrl = `${poolApiBase}/miner/${minerAddress}/chart/hashrate`;
    const paymentsUrl = `${poolApiBase}/miner/${minerAddress}/payments`;
    const workersUrl = `${poolApiBase}/miner/${minerAddress}/stats/allWorkers`;

    console.log('Fetching mining stats from:', apiUrl);

    // Try to get real miner data
    let minerData = null;
    let historyData = null;
    let paymentsData = null;
    let useDemo = false;

    try {
      // Fetch main stats
      const [statsResponse, historyResponse, paymentsResponse] = await Promise.allSettled([
        fetch(apiUrl, {
          headers: {
            'User-Agent': 'XMRT-DAO/1.0',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        }),
        fetch(historyUrl, {
          headers: {
            'User-Agent': 'XMRT-DAO/1.0',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        }),
        fetch(paymentsUrl, {
          headers: {
            'User-Agent': 'XMRT-DAO/1.0',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        })
      ]);

      // Process main stats
      if (statsResponse.status === 'fulfilled' && statsResponse.value.ok) {
        const data = await statsResponse.value.json();
        
        // Check if we got meaningful data (not all zeros)
        const hasActivity = data.hash > 0 || data.totalHashes > 0 || data.validShares > 0;
        
        if (hasActivity) {
          minerData = data;
          console.log('Real mining data retrieved successfully');
        } else {
          console.log('Miner appears inactive - checking if wallet exists');
          // If stats are zero, still use the data but mark as inactive
          minerData = data;
          minerData.isInactive = true;
        }
      } else {
        console.log('Mining API error:', statsResponse.status === 'fulfilled' ? statsResponse.value.status : 'Request failed');
        useDemo = true;
      }

      // Process history data
      if (historyResponse.status === 'fulfilled' && historyResponse.value.ok) {
        historyData = await historyResponse.value.json();
        console.log('History data retrieved successfully');
      } else {
        console.log('History API unavailable');
      }

      // Process payments data
      if (paymentsResponse.status === 'fulfilled' && paymentsResponse.value.ok) {
        paymentsData = await paymentsResponse.value.json();
        console.log('Payments data retrieved successfully');
      } else {
        console.log('Payments API unavailable');
      }

    } catch (error) {
      console.log('Mining API failed:', error);
      useDemo = true;
    }

    // Use demo data if real data unavailable or inactive
    if (useDemo || !minerData) {
      minerData = getDemoMiningData();
    }

    // Get pool stats for additional context
    const poolStats = await getPoolStats();

    // Get client IP for worker detection
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    req.headers.get('x-real-ip') || 
                    req.headers.get('cf-connecting-ip') ||
                    'unknown';

    // Worker context handling
    let workerContext = {
      canIdentifyWorker: false,
      detectedWorker: null,
      registrationRequired: true,
      clientIP
    };

    // Enhanced response with pool context and additional data
    const responseData = {
      ...minerData,
      poolContext: poolStats,
      workerContext,
      historyData: historyData ? {
        hasHistory: true,
        dataPoints: historyData.length || 0,
        averageHashrate: historyData?.reduce?.((acc, point) => acc + (point[1] || 0), 0) / (historyData?.length || 1) || 0
      } : { hasHistory: false },
      paymentsData: paymentsData ? {
        hasPayments: true,
        recentPayments: paymentsData.slice?.(0, 5) || [],
        totalPayments: paymentsData.length || 0
      } : { hasPayments: false },
      lastUpdate: new Date().toISOString(),
      status: useDemo ? 'demo' : (minerData?.isInactive ? 'inactive' : 'live'),
      walletAddress: minerAddress.substring(0, 8) + '...' + minerAddress.slice(-8) // Show partial address for verification
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Proxy error:', error);

    // Return demo data even on complete failure
    const fallbackData = {
      ...getDemoMiningData(),
      error: 'Service temporarily unavailable',
      status: 'fallback'
    };

    return new Response(JSON.stringify(fallbackData), {
      status: 200, // Return 200 with demo data rather than error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});