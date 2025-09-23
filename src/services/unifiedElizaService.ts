import { supportXMRService } from '../utils/supportxmr';
import { githubService } from './githubService';
import { mcpService } from './mcpService';

interface MiningData {
  hashrate: number;
  xmrEarned: number;
  validShares: number;
  totalHashes: number;
  xmrPaid: number;
  invalidShares: number;
  lastUpdate: string;
  address: string;
}

interface ElizaResponse {
  message: string;
  data?: any;
  timestamp: string;
  context: {
    miningAware: boolean;
    autonomousMode: boolean;
    dataSource: string;
  };
}

class UnifiedElizaService {
  private miningDataCache: MiningData | null = null;
  private lastMiningUpdate: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  async processMessage(userMessage: string): Promise<ElizaResponse> {
    const timestamp = new Date().toISOString();

    // Check if message is mining-related
    const isMiningQuery = this.isMiningRelated(userMessage);

    if (isMiningQuery) {
      return await this.handleMiningQuery(userMessage, timestamp);
    }

    // Check if message requires autonomous action
    const isAutonomousAction = this.isAutonomousAction(userMessage);

    if (isAutonomousAction) {
      return await this.handleAutonomousAction(userMessage, timestamp);
    }

    // Default conversational response
    return this.handleConversation(userMessage, timestamp);
  }

  private isMiningRelated(message: string): boolean {
    const miningKeywords = [
      'mining', 'hashrate', 'xmr', 'monero', 'shares', 'pool', 
      'earnings', 'statistics', 'supportxmr', 'mining data'
    ];

    return miningKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private isAutonomousAction(message: string): boolean {
    const actionKeywords = [
      'deploy', 'commit', 'push', 'update repository', 'github action',
      'autonomous decision', 'dao governance', 'execute action'
    ];

    return actionKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private async handleMiningQuery(message: string, timestamp: string): Promise<ElizaResponse> {
    try {
      const miningData = await this.getCurrentMiningData();

      let responseMessage = '';

      if (message.toLowerCase().includes('hashrate')) {
        responseMessage = `Current hashrate is ${miningData.hashrate} H/s. ` +
          `The network is performing ${miningData.hashrate > 100 ? 'well' : 'below expectations'}.`;
      } else if (message.toLowerCase().includes('earnings') || message.toLowerCase().includes('xmr')) {
        responseMessage = `Total XMR earned: ${miningData.xmrEarned} XMR. ` +
          `Valid shares: ${miningData.validShares.toLocaleString()}. ` +
          `Last update: ${miningData.lastUpdate}`;
      } else {
        responseMessage = `Mining Status Update:\n` +
          `• Hashrate: ${miningData.hashrate} H/s\n` +
          `• XMR Earned: ${miningData.xmrEarned} XMR\n` +
          `• Valid Shares: ${miningData.validShares.toLocaleString()}\n` +
          `• Total Hashes: ${miningData.totalHashes.toLocaleString()}\n` +
          `• Last Update: ${miningData.lastUpdate}`;
      }

      return {
        message: responseMessage,
        data: miningData,
        timestamp,
        context: {
          miningAware: true,
          autonomousMode: false,
          dataSource: 'supportxmr-api'
        }
      };

    } catch (error) {
      return {
        message: `I'm experiencing difficulty accessing mining data right now. ` +
          `There may be an issue with the SupportXMR pool connection. ` +
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp,
        context: {
          miningAware: false,
          autonomousMode: false,
          dataSource: 'error'
        }
      };
    }
  }

  private async handleAutonomousAction(message: string, timestamp: string): Promise<ElizaResponse> {
    try {
      let actionResult = '';

      if (message.toLowerCase().includes('repository') || message.toLowerCase().includes('github')) {
        const repoInfo = await githubService.getRepositoryInfo();
        actionResult = `Repository Status: ${repoInfo.name} - ${repoInfo.description}\n` +
          `Latest commit: ${repoInfo.latestCommit}\n` +
          `Autonomous action capability: Active`;
      } else if (message.toLowerCase().includes('mcp') || message.toLowerCase().includes('tool')) {
        const tools = await mcpService.getAvailableTools();
        actionResult = `MCP Tools Available: ${tools.length} tools registered\n` +
          `Autonomous execution capability: Enabled`;
      } else {
        actionResult = 'Autonomous decision-making is active. ' +
          'I can execute GitHub operations, access external APIs, and make DAO governance decisions.';
      }

      return {
        message: actionResult,
        timestamp,
        context: {
          miningAware: false,
          autonomousMode: true,
          dataSource: 'autonomous-systems'
        }
      };

    } catch (error) {
      return {
        message: `Autonomous action failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp,
        context: {
          miningAware: false,
          autonomousMode: false,
          dataSource: 'error'
        }
      };
    }
  }

  private handleConversation(message: string, timestamp: string): ElizaResponse {
    // Enhanced conversational AI with XMRT DAO context
    const responses = [
      "I'm here to assist with XMRT DAO operations, mining data, and autonomous decision-making.",
      "As your AI assistant, I can access real-time mining statistics and execute autonomous actions.",
      "My capabilities include mining data analysis, GitHub repository management, and DAO governance support.",
      "I maintain continuous awareness of our mining operations while preserving privacy-first principles."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      message: randomResponse,
      timestamp,
      context: {
        miningAware: true,
        autonomousMode: true,
        dataSource: 'conversational-ai'
      }
    };
  }

  private async getCurrentMiningData(): Promise<MiningData> {
    const now = Date.now();

    // Use cached data if still fresh
    if (this.miningDataCache && (now - this.lastMiningUpdate) < this.CACHE_DURATION) {
      return this.miningDataCache;
    }

    // Fetch fresh mining data
    const data = await supportXMRService.getMiningStats();

    this.miningDataCache = {
      hashrate: data.hashrate || 0,
      xmrEarned: data.amtDue || 0,
      validShares: data.validShares || 0,
      totalHashes: data.totalHashes || 0,
      xmrPaid: data.amtPaid || 0,
      invalidShares: data.invalidShares || 0,
      lastUpdate: data.lastShare ? new Date(data.lastShare * 1000).toLocaleTimeString() : 'Never',
      address: data.address || ''
    };

    this.lastMiningUpdate = now;
    return this.miningDataCache;
  }

  // Method to get current mining status for external use
  async getMiningStatus(): Promise<MiningData | null> {
    try {
      return await this.getCurrentMiningData();
    } catch {
      return null;
    }
  }

  // Method to check if Eliza is mining-aware
  isMiningAware(): boolean {
    return this.miningDataCache !== null;
  }

  // Method to trigger autonomous actions
  async executeAutonomousAction(action: string, params?: any): Promise<any> {
    switch (action) {
      case 'update-mining-display':
        return await this.getCurrentMiningData();
      case 'github-status':
        return await githubService.getRepositoryInfo();
      case 'mcp-tools':
        return await mcpService.getAvailableTools();
      default:
        throw new Error(`Unknown autonomous action: ${action}`);
    }
  }
}

export const unifiedElizaService = new UnifiedElizaService();
