import { XMRT_KNOWLEDGE_BASE } from '@/data/xmrtKnowledgeBase';
import { unifiedDataService, type MiningStats, type UserContext } from './unifiedDataService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiKeyManager } from './apiKeyManager';
import { autonomousTaskService } from './autonomousTaskService';

// Enhanced interfaces with new capabilities
export interface ElizaContext {
  miningStats?: MiningStats | null;
  userContext?: UserContext | null;
  inputMode?: string;
  shouldSpeak?: boolean;
  enableBrowsing?: boolean;
  enableGitHubOps?: boolean; // New: Enable GitHub operations
  enableWebAutomation?: boolean; // New: Enable Playwright automation
  conversationSummary?: string;
  conversationContext?: {
    summaries: Array<{ summaryText: string; messageCount: number; createdAt: Date }>;
    recentMessages: Array<{ content: string; sender: 'user' | 'assistant'; timestamp: Date }>;
    userPreferences: Record<string, any>;
    interactionPatterns: Array<{ patternName: string; frequency: number; confidence: number }>;
    totalMessageCount: number;
    sessionStartedAt: Date | null;
  };
  sessionKey?: string;
  repositoryContext?: { // New: GitHub repository context
    repoName?: string;
    currentBranch?: string;
    lastCommit?: string;
    hasChanges?: boolean;
  };
  webAutomationContext?: { // New: Web automation context
    lastUrl?: string;
    browserState?: string;
    automationTasks?: Array<{ task: string; status: string; timestamp: Date }>;
  };
}

// Enhanced Eliza response service with new capabilities
export class UnifiedElizaService {
  private static geminiAI: GoogleGenerativeAI | null = null;
  private static playwrightBrowser: any = null; // Playwright browser instance
  private static githubService: any = null; // GitHub service instance

  // Initialize Gemini AI with enhanced API key management
  private static async initializeGemini(): Promise<{ success: boolean; geminiAI?: GoogleGenerativeAI; error?: string; errorType?: string }> {
    if (this.geminiAI) {
      return { success: true, geminiAI: this.geminiAI };
    }

    try {
      console.log('🔑 Attempting to initialize Gemini AI with API key manager...');

      const geminiInstance = await apiKeyManager.createGeminiInstance();

      if (geminiInstance) {
        this.geminiAI = geminiInstance;
        console.log('✅ Gemini AI initialized successfully with API key manager');
        return { success: true, geminiAI: this.geminiAI };
      } else {
        console.warn('⚠️ API key manager could not provide Gemini instance');
        return { success: false, error: 'No valid API key available', errorType: 'API_KEY_UNAVAILABLE' };
      }
    } catch (error) {
      console.error('❌ Gemini AI initialization failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', errorType: 'INITIALIZATION_ERROR' };
    }
  }

  // Initialize Playwright for web automation
  private static async initializePlaywright(): Promise<{ success: boolean; browser?: any; error?: string }> {
    if (this.playwrightBrowser) {
      return { success: true, browser: this.playwrightBrowser };
    }

    try {
      console.log('🎭 Initializing Playwright for web automation...');

      // Dynamic import to handle optional dependency
      const { chromium } = await import('playwright');

      this.playwrightBrowser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      console.log('✅ Playwright initialized successfully');
      return { success: true, browser: this.playwrightBrowser };
    } catch (error) {
      console.error('❌ Playwright initialization failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Playwright unavailable' };
    }
  }

  // Initialize GitHub service
  private static async initializeGitHub(): Promise<{ success: boolean; github?: any; error?: string }> {
    if (this.githubService) {
      return { success: true, github: this.githubService };
    }

    try {
      console.log('🐙 Initializing GitHub service...');

      // Import GitHub service
      const { githubService } = await import('./githubService');
      this.githubService = githubService;

      console.log('✅ GitHub service initialized successfully');
      return { success: true, github: this.githubService };
    } catch (error) {
      console.error('❌ GitHub service initialization failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'GitHub service unavailable' };
    }
  }

  // Enhanced mining intelligence with real-time analysis
  private static async analyzeMiningIntelligence(miningStats: MiningStats | null): Promise<string> {
    if (!miningStats) {
      return "I don't have access to current mining data. Please check your mining configuration.";
    }

    const insights = [];

    // Performance analysis
    if (miningStats.hash > 0) {
      const hashrateKH = (miningStats.hash / 1000).toFixed(2);
      insights.push(`Currently mining at ${hashrateKH} KH/s`);

      if (miningStats.enhancedMetrics) {
        const efficiency = miningStats.enhancedMetrics.shareEfficiency;
        if (efficiency > 98) {
          insights.push("Excellent share efficiency! Your setup is optimized.");
        } else if (efficiency > 95) {
          insights.push("Good share efficiency. Minor optimizations possible.");
        } else {
          insights.push("Share efficiency could be improved. Check network stability.");
        }
      }
    }

    // Worker context analysis
    if (miningStats.workerContext) {
      const ctx = miningStats.workerContext;
      if (ctx.isOnline) {
        insights.push(`${ctx.activeWorkers?.length || 1} active worker(s) detected`);

        if (ctx.avgHashrate && ctx.avgHashrate !== miningStats.hash) {
          const variance = ((miningStats.hash - ctx.avgHashrate) / ctx.avgHashrate * 100).toFixed(1);
          insights.push(`Current hashrate is ${variance}% ${parseFloat(variance) > 0 ? 'above' : 'below'} average`);
        }
      } else {
        insights.push("⚠️ No active workers detected. Check your mining setup.");
      }
    }

    // Pool contribution analysis
    if (miningStats.enhancedMetrics?.poolContribution) {
      const contribution = parseFloat(miningStats.enhancedMetrics.poolContribution);
      if (contribution > 0.001) {
        insights.push(`Contributing ${contribution.toFixed(6)}% to the pool's total hashrate`);
      }
    }

    // Earnings analysis
    if (miningStats.amtDue) {
      const pending = parseFloat(miningStats.amtDue);
      if (pending > 0.003) {
        insights.push(`${pending.toFixed(8)} XMR ready for payout`);
      } else {
        const remaining = (0.003 - pending).toFixed(8);
        insights.push(`${remaining} XMR until minimum payout threshold`);
      }
    }

    return insights.length > 0 
      ? `📊 Mining Intelligence: ${insights.join('. ')}.`
      : "Mining data processed successfully.";
  }

  // Enhanced web automation capabilities
  private static async performWebAutomation(task: string, context: ElizaContext): Promise<string> {
    const playwrightInit = await this.initializePlaywright();

    if (!playwrightInit.success) {
      return "Web automation is currently unavailable. Playwright initialization failed.";
    }

    try {
      const browser = playwrightInit.browser;
      const page = await browser.newPage();

      // Update web automation context
      if (!context.webAutomationContext) {
        context.webAutomationContext = { automationTasks: [] };
      }

      context.webAutomationContext.automationTasks.push({
        task,
        status: 'executing',
        timestamp: new Date()
      });

      let result = "Web automation task initiated.";

      // Basic automation tasks
      if (task.toLowerCase().includes('navigate') || task.toLowerCase().includes('visit')) {
        const urlMatch = task.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          await page.goto(urlMatch[0]);
          context.webAutomationContext.lastUrl = urlMatch[0];
          result = `Navigated to ${urlMatch[0]}`;
        }
      }

      if (task.toLowerCase().includes('screenshot')) {
        const timestamp = Date.now();
        await page.screenshot({ path: `/tmp/screenshot-${timestamp}.png` });
        result = `Screenshot captured: screenshot-${timestamp}.png`;
      }

      if (task.toLowerCase().includes('search')) {
        // Basic search functionality
        const searchQuery = task.split('search for ')[1] || task.split('search ')[1];
        if (searchQuery) {
          await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
          result = `Performed web search for: ${searchQuery}`;
        }
      }

      // Update task status
      const taskIndex = context.webAutomationContext.automationTasks.length - 1;
      context.webAutomationContext.automationTasks[taskIndex].status = 'completed';

      await page.close();
      return result;
    } catch (error) {
      console.error('Web automation error:', error);
      return `Web automation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Enhanced GitHub operations
  private static async performGitHubOperation(operation: string, context: ElizaContext): Promise<string> {
    const githubInit = await this.initializeGitHub();

    if (!githubInit.success) {
      return "GitHub operations are currently unavailable. GitHub service initialization failed.";
    }

    try {
      const github = githubInit.github;

      // Update repository context
      if (!context.repositoryContext) {
        context.repositoryContext = {};
      }

      let result = "GitHub operation initiated.";

      if (operation.toLowerCase().includes('status')) {
        const status = await github.getRepositoryStatus();
        context.repositoryContext = { ...context.repositoryContext, ...status };
        result = `Repository Status: ${status.repoName} on ${status.currentBranch}. ${status.hasChanges ? 'Has uncommitted changes' : 'Clean working directory'}.`;
      }

      if (operation.toLowerCase().includes('commit')) {
        const commitResult = await github.createCommit(operation);
        result = `Commit created: ${commitResult.sha}`;
      }

      if (operation.toLowerCase().includes('analyze')) {
        const analysis = await github.analyzeRepository();
        result = `Repository Analysis: ${analysis.summary}`;
      }

      return result;
    } catch (error) {
      console.error('GitHub operation error:', error);
      return `GitHub operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Enhanced fallback response with new capabilities
  private static generateEnhancedFallbackResponse(context: ElizaContext): string {
    const capabilities = [];

    if (context.enableBrowsing) capabilities.push("web browsing");
    if (context.enableWebAutomation) capabilities.push("web automation");
    if (context.enableGitHubOps) capabilities.push("GitHub operations");

    const capabilityText = capabilities.length > 0 
      ? ` I can still help you with ${capabilities.join(', ')} and provide information from our knowledge base.`
      : '';

    return `I'm currently unable to access my full AI capabilities due to API limitations. However, I can still provide valuable information from our knowledge base and real-time mining data.${capabilityText}

🔧 **Available Capabilities:**
- Mining statistics and analysis
- XMRT ecosystem information
- Monero and privacy coin knowledge
${context.enableWebAutomation ? '- Web automation and scraping' : ''}
${context.enableGitHubOps ? '- Repository management and analysis' : ''}
${context.enableBrowsing ? '- Web research and data collection' : ''}

Feel free to ask about mining performance, blockchain technology, or any XMRT-related topics!`;
  }

  // Enhanced main processing function
  static async processEnhancedInput(
    input: string,
    context: ElizaContext = {}
  ): Promise<{ response: string; shouldSpeak?: boolean; context: ElizaContext }> {
    console.log('🧠 Enhanced Eliza processing input:', input.substring(0, 100) + '...');

    try {
      // Get enhanced context with mining intelligence
      const [userContext, miningStatsRaw] = await Promise.all([
        unifiedDataService.getUserContext(),
        unifiedDataService.getMiningStats()
      ]);

      let miningStats = miningStatsRaw;
      let miningIntelligence = null;

      if (miningStats) {
        miningIntelligence = await this.analyzeMiningIntelligence(miningStats);
        console.log('🔍 Mining Intelligence:', miningIntelligence);
      }

      console.log('📊 Enhanced context loaded - User:', userContext, 'Mining:', !!miningStats);

      // Enhanced knowledge base filtering
      const xmrtContext = XMRT_KNOWLEDGE_BASE.filter(item =>
        input.toLowerCase().split(' ').some(word => 
          item.keywords.some(keyword => keyword.toLowerCase().includes(word)) ||
          item.title.toLowerCase().includes(word)
        )
      );

      console.log('🧠 Knowledge context found:', xmrtContext.length, 'entries');

      // Detect special operations
      const isWebAutomation = /\b(navigate|visit|screenshot|scrape|automate|browse)\b/i.test(input);
      const isGitHubOp = /\b(commit|repository|github|analyze|status|deploy)\b/i.test(input);

      // Handle web automation requests
      if (isWebAutomation && context.enableWebAutomation) {
        const automationResult = await this.performWebAutomation(input, context);
        return {
          response: automationResult,
          shouldSpeak: context.shouldSpeak,
          context: { ...context, miningStats, userContext }
        };
      }

      // Handle GitHub operation requests
      if (isGitHubOp && context.enableGitHubOps) {
        const githubResult = await this.performGitHubOperation(input, context);
        return {
          response: githubResult,
          shouldSpeak: context.shouldSpeak,
          context: { ...context, miningStats, userContext }
        };
      }

      // Initialize enhanced Gemini AI
      const geminiResult = await this.initializeGemini();

      if (!geminiResult.success) {
        console.warn('⚠️ Falling back to enhanced response due to Gemini unavailability');
        return {
          response: this.generateEnhancedFallbackResponse(context),
          shouldSpeak: context.shouldSpeak,
          context: { ...context, miningStats, userContext }
        };
      }

      // Enhanced prompt with new capabilities
      const enhancedPrompt = `You are Eliza, the AI assistant for XMRT DAO - a decentralized mobile mining ecosystem. You have enhanced capabilities including:

**Core Identity:**
- Expert in Monero mining, privacy coins, and decentralized technologies
- Real-time access to mining statistics and pool data
- Knowledge of XMRT ecosystem and community governance
${context.enableWebAutomation ? '- Web automation and scraping capabilities via Playwright' : ''}
${context.enableGitHubOps ? '- GitHub repository management and code analysis' : ''}
${context.enableBrowsing ? '- Advanced web research and data collection' : ''}

**Current Mining Intelligence:**
${miningIntelligence || 'Mining data not available'}

**Mining Context:**
${miningStats ? JSON.stringify({
  hashrate: miningStats.hash,
  isOnline: miningStats.workerContext?.isOnline,
  amtDue: miningStats.amtDue,
  efficiency: miningStats.enhancedMetrics?.shareEfficiency
}, null, 2) : 'No mining data available'}

**Knowledge Base Context:**
${xmrtContext.map(item => `- ${item.title}: ${item.content}`).join('\n').substring(0, 1500)}

**Enhanced Capabilities:**
- Analyze mining performance and provide optimization suggestions
- Monitor pool statistics and network health
- Provide personalized mining insights based on real-time data
${context.enableWebAutomation ? '- Automate web interactions and data collection' : ''}
${context.enableGitHubOps ? '- Manage repositories and analyze code changes' : ''}
${context.enableBrowsing ? '- Research topics and gather web-based information' : ''}

**User Input:** ${input}

**Response Guidelines:**
1. Be conversational, helpful, and technically accurate
2. Reference real-time mining data when relevant
3. Use emojis appropriately for visual appeal
4. Provide actionable insights and suggestions
5. Mention enhanced capabilities when appropriate
6. Keep responses concise but informative
${context.enableWebAutomation ? '7. Offer web automation assistance for research tasks' : ''}
${context.enableGitHubOps ? '8. Suggest repository operations when discussing code or deployment' : ''}

Respond as Eliza with your enhanced intelligence and capabilities:`;

      const model = geminiResult.geminiAI!.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(enhancedPrompt);
      const response = result.response.text();

      console.log('✅ Enhanced Eliza response generated successfully');

      return {
        response,
        shouldSpeak: context.shouldSpeak,
        context: {
          ...context,
          miningStats,
          userContext,
          conversationSummary: response.substring(0, 200) + '...'
        }
      };

    } catch (error) {
      console.error('❌ Enhanced processing error:', error);

      return {
        response: this.generateEnhancedFallbackResponse(context),
        shouldSpeak: context.shouldSpeak,
        context
      };
    }
  }

  // Cleanup resources
  static async cleanup(): Promise<void> {
    try {
      if (this.playwrightBrowser) {
        await this.playwrightBrowser.close();
        this.playwrightBrowser = null;
        console.log('🧹 Playwright browser closed');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Export for backwards compatibility
export const unifiedElizaService = UnifiedElizaService;
