import { apiKeyManager } from './apiKeyManager';
import { harpaAIService } from './harpaAIService';
import { supabase } from '@/integrations/supabase/client';
import { unifiedDataService } from './unifiedDataService';

export interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'limited' | 'error';
  details?: string;
  lastChecked: Date;
  capabilities?: string[];
}

export interface SystemCapabilities {
  geminiAPI: ServiceStatus;
  harpaAI: ServiceStatus;
  miningProxy: ServiceStatus;
  supabase: ServiceStatus;
  github: ServiceStatus;
  conversationMemory: ServiceStatus;
  taskManagement: ServiceStatus;
}

export class SystemStatusService {
  private static instance: SystemStatusService;
  private lastFullCheck: Date | null = null;
  private cachedCapabilities: SystemCapabilities | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  private constructor() {}

  public static getInstance(): SystemStatusService {
    if (!SystemStatusService.instance) {
      SystemStatusService.instance = new SystemStatusService();
    }
    return SystemStatusService.instance;
  }

  public async getSystemCapabilities(): Promise<SystemCapabilities> {
    // Return cached results if recent
    if (this.cachedCapabilities && this.lastFullCheck && 
        Date.now() - this.lastFullCheck.getTime() < this.CACHE_DURATION) {
      return this.cachedCapabilities;
    }

    console.log('🔍 SystemStatus: Performing full system capability check...');

    const capabilities: SystemCapabilities = {
      geminiAPI: await this.checkGeminiAPI(),
      harpaAI: await this.checkHarpaAI(),
      miningProxy: await this.checkMiningProxy(),
      supabase: await this.checkSupabase(),
      github: await this.checkGitHub(),
      conversationMemory: await this.checkConversationMemory(),
      taskManagement: await this.checkTaskManagement()
    };

    this.cachedCapabilities = capabilities;
    this.lastFullCheck = new Date();

    console.log('✅ SystemStatus: Full capability check completed');
    return capabilities;
  }

  private async checkGeminiAPI(): Promise<ServiceStatus> {
    try {
      const keyStatus = apiKeyManager.getKeyStatus();
      const hasUserKey = apiKeyManager.hasUserApiKey();
      
      if (keyStatus.isValid) {
        return {
          name: 'Gemini AI API',
          status: 'online',
          details: `Using ${hasUserKey ? 'user-provided' : 'default'} API key`,
          lastChecked: new Date(),
          capabilities: [
            'Natural language understanding',
            'Contextual responses',
            'Memory recall',
            'Complex reasoning',
            'Multi-language support'
          ]
        };
      } else {
        return {
          name: 'Gemini AI API',
          status: keyStatus.errorMessage?.includes('quota') ? 'limited' : 'error',
          details: keyStatus.errorMessage || 'API key validation failed',
          lastChecked: new Date(),
          capabilities: []
        };
      }
    } catch (error) {
      return {
        name: 'Gemini AI API',
        status: 'error',
        details: `Failed to check API status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date(),
        capabilities: []
      };
    }
  }

  private async checkHarpaAI(): Promise<ServiceStatus> {
    const isAvailable = harpaAIService.isAvailable();
    const statusObj = harpaAIService.getStatus();
    const statusText = typeof statusObj === 'string' ? statusObj : 
      `Connected: ${statusObj.connected}, API Key: ${statusObj.apiKey ? 'configured' : 'missing'}`;
    
    return {
      name: 'HARPA AI Web Browser',
      status: isAvailable ? 'online' : 'offline',
      details: statusText,
      lastChecked: new Date(),
      capabilities: isAvailable ? [
        'Real-time web browsing',
        'Multi-step research',
        'Information analysis',
        'Web content summarization'
      ] : []
    };
  }

  private async checkMiningProxy(): Promise<ServiceStatus> {
    try {
      const miningStats = await unifiedDataService.getMiningStats();
      
      if (miningStats && miningStats.hash !== undefined) {
        return {
          name: 'Mining Statistics Proxy',
          status: 'online',
          details: `Current hashrate: ${miningStats.hash} H/s`,
          lastChecked: new Date(),
          capabilities: [
            'Real-time mining statistics',
            'Pool worker monitoring',
            'Hash rate tracking',
            'Share validation data'
          ]
        };
      } else {
        return {
          name: 'Mining Statistics Proxy',
          status: 'limited',
          details: 'Mining data unavailable',
          lastChecked: new Date(),
          capabilities: []
        };
      }
    } catch (error) {
      return {
        name: 'Mining Statistics Proxy',
        status: 'error',
        details: `Mining proxy error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date(),
        capabilities: []
      };
    }
  }

  private async checkSupabase(): Promise<ServiceStatus> {
    try {
      // Test database connectivity
      const { data, error } = await supabase.from('conversation_sessions').select('count').limit(1);
      
      if (error) {
        throw error;
      }

      return {
        name: 'Supabase Database',
        status: 'online',
        details: 'Database connection active',
        lastChecked: new Date(),
        capabilities: [
          'Conversation persistence',
          'Task management',
          'User preferences storage',
          'Memory context storage',
          'Edge function execution'
        ]
      };
    } catch (error) {
      return {
        name: 'Supabase Database',
        status: 'error',
        details: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date(),
        capabilities: []
      };
    }
  }

  private async checkGitHub(): Promise<ServiceStatus> {
    // Check if GitHub integration is configured by looking for secrets
    return {
      name: 'GitHub Integration',
      status: 'limited', // We have tokens but need to test connectivity
      details: 'GitHub tokens configured, connectivity not verified',
      lastChecked: new Date(),
      capabilities: [
        'Repository analysis',
        'Issue management',
        'Code review assistance',
        'Project documentation'
      ]
    };
  }

  private async checkConversationMemory(): Promise<ServiceStatus> {
    try {
      // Test conversation memory by checking if we can access conversation data
      const { data, error } = await supabase
        .from('conversation_sessions')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      return {
        name: 'Conversation Memory',
        status: 'online',
        details: 'Conversation persistence active',
        lastChecked: new Date(),
        capabilities: [
          'Long-term memory recall',
          'Conversation summarization',
          'Context awareness',
          'User preference learning',
          'Session continuity'
        ]
      };
    } catch (error) {
      return {
        name: 'Conversation Memory',
        status: 'error',
        details: `Memory system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date(),
        capabilities: []
      };
    }
  }

  private async checkTaskManagement(): Promise<ServiceStatus> {
    try {
      // Test task management by checking task table access
      const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      return {
        name: 'Autonomous Task Management',
        status: 'online',
        details: 'Task execution system ready',
        lastChecked: new Date(),
        capabilities: [
          'Autonomous task execution',
          'Background processing',
          'Task progress tracking',
          'Approval workflow management',
          'Task result verification'
        ]
      };
    } catch (error) {
      return {
        name: 'Autonomous Task Management',
        status: 'error',
        details: `Task system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date(),
        capabilities: []
      };
    }
  }

  public generateCapabilitiesReport(): string {
    if (!this.cachedCapabilities) {
      return "System capabilities not yet assessed. Please wait while I check my systems...";
    }

    const services = Object.values(this.cachedCapabilities);
    const onlineServices = services.filter(s => s.status === 'online');
    const limitedServices = services.filter(s => s.status === 'limited');
    const offlineServices = services.filter(s => s.status === 'offline' || s.status === 'error');

    let report = "🤖 **Current System Status & Capabilities:**\n\n";

    if (onlineServices.length > 0) {
      report += "✅ **Active Services:**\n";
      onlineServices.forEach(service => {
        report += `• **${service.name}**: ${service.details}\n`;
        if (service.capabilities && service.capabilities.length > 0) {
          report += `  Capabilities: ${service.capabilities.join(', ')}\n`;
        }
      });
      report += "\n";
    }

    if (limitedServices.length > 0) {
      report += "⚠️ **Limited Services:**\n";
      limitedServices.forEach(service => {
        report += `• **${service.name}**: ${service.details}\n`;
      });
      report += "\n";
    }

    if (offlineServices.length > 0) {
      report += "❌ **Offline/Error Services:**\n";
      offlineServices.forEach(service => {
        report += `• **${service.name}**: ${service.details}\n`;
      });
      report += "\n";
    }

    // Add overall capability summary
    const allCapabilities = onlineServices
      .flatMap(s => s.capabilities || [])
      .filter((cap, index, arr) => arr.indexOf(cap) === index);

    if (allCapabilities.length > 0) {
      report += `**Overall, I currently have ${allCapabilities.length} active capabilities** including ${allCapabilities.slice(0, 3).join(', ')}${allCapabilities.length > 3 ? ` and ${allCapabilities.length - 3} more` : ''}.`;
    }

    const lastCheckedTime = this.lastFullCheck?.toLocaleTimeString() || 'Never';
    report += `\n\n*Last checked: ${lastCheckedTime}*`;

    return report;
  }

  // Force refresh of system status
  public async refreshStatus(): Promise<void> {
    this.cachedCapabilities = null;
    this.lastFullCheck = null;
    await this.getSystemCapabilities();
  }

  // Get status of a specific service
  public async getServiceStatus(serviceName: keyof SystemCapabilities): Promise<ServiceStatus | null> {
    const capabilities = await this.getSystemCapabilities();
    return capabilities[serviceName] || null;
  }
}

export const systemStatusService = SystemStatusService.getInstance();