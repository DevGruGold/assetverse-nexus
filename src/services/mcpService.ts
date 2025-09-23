interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (params: any) => Promise<any>;
}

interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
  toolUsed: string;
  timestamp: string;
}

class MCPService {
  private tools: Map<string, MCPTool> = new Map();
  private executionHistory: Array<{
    tool: string;
    params: any;
    result: any;
    timestamp: string;
  }> = [];

  constructor() {
    this.initializeDefaultTools();
  }

  private initializeDefaultTools(): void {
    // Mining data tool
    this.registerTool({
      name: 'get_mining_data',
      description: 'Fetch real-time mining statistics from SupportXMR',
      parameters: {
        includeHistory: { type: 'boolean', default: false }
      },
      handler: async (params) => {
        const { supportXMRService } = await import('../utils/supportxmr');
        return await supportXMRService.getMiningStats();
      }
    });

    // GitHub repository tool
    this.registerTool({
      name: 'github_repository_info',
      description: 'Get information about the GitHub repository',
      parameters: {
        includeCommits: { type: 'boolean', default: true },
        includeIssues: { type: 'boolean', default: true }
      },
      handler: async (params) => {
        const { githubService } = await import('./githubService');
        const repoInfo = await githubService.getRepositoryInfo();

        const result: any = { repository: repoInfo };

        if (params.includeCommits) {
          result.recentCommits = await githubService.getRecentCommits(5);
        }

        if (params.includeIssues) {
          result.openIssues = await githubService.getIssues('open');
        }

        return result;
      }
    });

    // System health check tool
    this.registerTool({
      name: 'system_health_check',
      description: 'Perform comprehensive health check of XMRT DAO systems',
      parameters: {
        deep: { type: 'boolean', default: false }
      },
      handler: async (params) => {
        const results = {
          mining: { status: 'unknown', details: null },
          github: { status: 'unknown', details: null },
          timestamp: new Date().toISOString()
        };

        try {
          // Check mining system
          const { supportXMRService } = await import('../utils/supportxmr');
          const miningData = await supportXMRService.getMiningStats();
          results.mining = {
            status: miningData.hashrate > 0 ? 'healthy' : 'warning',
            details: {
              hashrate: miningData.hashrate,
              lastUpdate: miningData.lastShare
            }
          };
        } catch (error) {
          results.mining = {
            status: 'critical',
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          };
        }

        try {
          // Check GitHub system
          const { githubService } = await import('./githubService');
          const healthCheck = await githubService.performHealthCheck();
          results.github = {
            status: healthCheck.status,
            details: healthCheck
          };
        } catch (error) {
          results.github = {
            status: 'critical',
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          };
        }

        return results;
      }
    });

    // Autonomous decision tool
    this.registerTool({
      name: 'autonomous_decision',
      description: 'Make autonomous decisions based on current system state',
      parameters: {
        context: { type: 'string', required: true },
        actionType: { type: 'string', enum: ['mining', 'governance', 'maintenance'] }
      },
      handler: async (params) => {
        const decision = await this.makeAutonomousDecision(params.context, params.actionType);
        return decision;
      }
    });

    // Real-time monitoring tool
    this.registerTool({
      name: 'start_monitoring',
      description: 'Start real-time monitoring of specified systems',
      parameters: {
        systems: { type: 'array', items: { type: 'string' } },
        interval: { type: 'number', default: 30000 }
      },
      handler: async (params) => {
        return this.startMonitoring(params.systems, params.interval);
      }
    });
  }

  registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
  }

  async executeTool(toolName: string, parameters: any = {}): Promise<MCPResponse> {
    const timestamp = new Date().toISOString();

    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${toolName}' not found`,
        toolUsed: toolName,
        timestamp
      };
    }

    try {
      // Validate parameters
      const validatedParams = this.validateParameters(tool.parameters, parameters);

      // Execute tool
      const result = await tool.handler(validatedParams);

      // Log execution
      this.executionHistory.push({
        tool: toolName,
        params: validatedParams,
        result,
        timestamp
      });

      return {
        success: true,
        data: result,
        toolUsed: toolName,
        timestamp
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        error: errorMessage,
        toolUsed: toolName,
        timestamp
      };
    }
  }

  getAvailableTools(): Array<{ name: string; description: string; parameters: any }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }

  getExecutionHistory(limit: number = 10): Array<any> {
    return this.executionHistory.slice(-limit);
  }

  private validateParameters(schema: Record<string, any>, params: any): any {
    const validated: any = {};

    for (const [key, config] of Object.entries(schema)) {
      if (config.required && !(key in params)) {
        throw new Error(`Required parameter '${key}' is missing`);
      }

      if (key in params) {
        validated[key] = params[key];
      } else if ('default' in config) {
        validated[key] = config.default;
      }
    }

    return validated;
  }

  private async makeAutonomousDecision(context: string, actionType: string): Promise<any> {
    // Simplified autonomous decision-making logic
    const decisions = {
      mining: {
        low_hashrate: 'Investigate mining hardware performance',
        no_shares: 'Check mining pool connection',
        high_invalid_shares: 'Optimize mining configuration'
      },
      governance: {
        high_issues: 'Schedule community discussion for issue triage',
        no_activity: 'Propose new development initiatives',
        security_alert: 'Initiate security review protocol'
      },
      maintenance: {
        outdated_dependencies: 'Schedule dependency updates',
        performance_degradation: 'Initiate performance optimization',
        storage_full: 'Archive old data and clean up storage'
      }
    };

    // Analyze context and make decision
    const contextLower = context.toLowerCase();
    const actionDecisions = decisions[actionType as keyof typeof decisions] || {};

    for (const [condition, action] of Object.entries(actionDecisions)) {
      if (contextLower.includes(condition.replace('_', ' '))) {
        return {
          decision: action,
          confidence: 0.8,
          reasoning: `Context '${context}' matches condition '${condition}'`,
          actionType,
          timestamp: new Date().toISOString()
        };
      }
    }

    return {
      decision: 'Monitor and assess situation',
      confidence: 0.5,
      reasoning: 'No specific pattern matched, defaulting to monitoring',
      actionType,
      timestamp: new Date().toISOString()
    };
  }

  private async startMonitoring(systems: string[], interval: number): Promise<any> {
    // This would typically start background monitoring
    // For now, return configuration
    return {
      monitoring: true,
      systems,
      interval,
      startTime: new Date().toISOString(),
      message: `Started monitoring ${systems.join(', ')} every ${interval/1000} seconds`
    };
  }

  // Method for Eliza to check if autonomous mode is enabled
  isAutonomousModeEnabled(): boolean {
    return this.tools.has('autonomous_decision');
  }

  // Get tool suggestions based on context
  suggestTools(context: string): string[] {
    const suggestions: string[] = [];

    if (context.toLowerCase().includes('mining')) {
      suggestions.push('get_mining_data', 'system_health_check');
    }

    if (context.toLowerCase().includes('github') || context.toLowerCase().includes('repository')) {
      suggestions.push('github_repository_info');
    }

    if (context.toLowerCase().includes('health') || context.toLowerCase().includes('status')) {
      suggestions.push('system_health_check');
    }

    if (context.toLowerCase().includes('autonomous') || context.toLowerCase().includes('decision')) {
      suggestions.push('autonomous_decision');
    }

    return suggestions;
  }
}

export const mcpService = new MCPService();
