import { XMRT_KNOWLEDGE_BASE } from '@/data/xmrtKnowledgeBase';
import { unifiedDataService, type MiningStats, type UserContext } from './unifiedDataService';
import { harpaAIService, HarpaAIService, type HarpaBrowsingContext } from './harpaAIService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiKeyManager } from './apiKeyManager';
import { autonomousTaskService } from './autonomousTaskService';

export interface ElizaContext {
  miningStats?: MiningStats | null;
  userContext?: UserContext | null;
  inputMode?: string;
  shouldSpeak?: boolean; // Control TTS to prevent duplication
  enableBrowsing?: boolean; // Enable Harpa AI agentic browsing
  conversationSummary?: string; // Previous conversation context
  conversationContext?: {
    summaries: Array<{ summaryText: string; messageCount: number; createdAt: Date }>;
    recentMessages: Array<{ content: string; sender: 'user' | 'assistant'; timestamp: Date }>;
    userPreferences: Record<string, any>;
    interactionPatterns: Array<{ patternName: string; frequency: number; confidence: number }>;
    totalMessageCount: number;
    sessionStartedAt: Date | null;
  }; // Enhanced conversation context for better understanding
  sessionKey?: string; // Session identifier for task tracking
}

// Unified Eliza response service that both text and voice modes can use
// Mining Statistics Integration - Added for comprehensive ecosystem awareness
import { fetchWithProxy, WALLET_ADDRESS, MiningStats } from '@/utils/supportxmr';

class MiningStatsService {
  private static instance: MiningStatsService;
  private cachedStats: MiningStats | null = null;
  private lastFetch: number = 0;
  private CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): MiningStatsService {
    if (!MiningStatsService.instance) {
      MiningStatsService.instance = new MiningStatsService();
    }
    return MiningStatsService.instance;
  }

  async getMiningStats(): Promise<MiningStats | null> {
    const now = Date.now();

    // Return cached data if recent
    if (this.cachedStats && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cachedStats;
    }

    try {
      const url = `https://supportxmr.com/api/miner_stats?address=${WALLET_ADDRESS}`;
      const response = await fetchWithProxy(url);

      if (response && response.stats) {
        this.cachedStats = {
          hashRate: response.stats.hashes_per_second || 0,
          validShares: response.stats.shares_good || 0,
          totalHashes: response.stats.hashes_total || 0,
          amountDue: parseFloat(response.stats.amount_due || '0'),
          workersActive: response.stats.workers_online || 0,
          lastActivity: new Date(response.stats.last_hash_time || Date.now()),
          status: response.stats.workers_online > 0 ? 'Active' : 'Inactive'
        };
        this.lastFetch = now;
        return this.cachedStats;
      }
    } catch (error) {
      console.error('Failed to fetch mining stats:', error);
    }

    return null;
  }

  interpretMiningData(stats: MiningStats): string {
    if (!stats) return "Unable to retrieve mining statistics at this time.";

    const insights = [];

    // Hash rate analysis
    if (stats.hashRate > 0) {
      insights.push(`Current hash rate: ${(stats.hashRate / 1000).toFixed(2)} KH/s`);
      if (stats.hashRate > 3000) {
        insights.push("Excellent mining performance! Hash rate is above 3 KH/s.");
      } else if (stats.hashRate > 1000) {
        insights.push("Good mining performance. Consider optimizing for higher hash rates.");
      }
    } else {
      insights.push("Mining appears to be inactive currently.");
    }

    // Share analysis
    if (stats.validShares > 0) {
      insights.push(`Total valid shares: ${stats.validShares.toLocaleString()}`);
    }

    // Profitability insights
    if (stats.amountDue > 0) {
      insights.push(`Pending payout: ${stats.amountDue.toFixed(6)} XMR (~$${(stats.amountDue * 300).toFixed(2)})`);
    }

    // Worker status
    insights.push(`Workers active: ${stats.workersActive}`);
    insights.push(`Status: ${stats.status}`);

    return insights.join('\n');
  }
}

// Global mining stats service instance
const miningStatsService = MiningStatsService.getInstance();
export class UnifiedElizaService {
  private static geminiAI: GoogleGenerativeAI | null = null;
  
  // Initialize Gemini AI with enhanced API key management
  private static async initializeGemini(): Promise<{ success: boolean; geminiAI?: GoogleGenerativeAI; error?: string; errorType?: string }> {
    if (this.geminiAI) {
      return { success: true, geminiAI: this.geminiAI };
    }
    
    try {
      console.log('🔑 Attempting to initialize Gemini AI with API key manager...');
      
      // Use the API key manager to get the best available key
      const geminiInstance = await apiKeyManager.createGeminiInstance();
      
      if (!geminiInstance) {
        throw new Error('No valid API key available');
      }
      
      // Test the instance with a simple request
      const model = geminiInstance.getGenerativeModel({ model: "gemini-1.5-flash" });
      await model.generateContent("Test");
      
      this.geminiAI = geminiInstance;
      // Update API key status to reflect successful initialization
      apiKeyManager.markKeyAsWorking();
      console.log('✅ Gemini AI initialized successfully for Eliza');
      return { success: true, geminiAI: this.geminiAI };
      
    } catch (error: any) {
      console.error('❌ Failed to initialize Gemini:', error);
      
      // Clear the cached instance on failure
      this.geminiAI = null;
      
      // Determine the type of error for better user experience
      let errorType = 'general';
      if (error.message?.includes('quota')) {
        errorType = 'quota_exceeded';
      } else if (error.message?.includes('invalid') || error.message?.includes('API key')) {
        errorType = 'invalid_key';
      } else if (error.message?.includes('permission')) {
        errorType = 'permission_denied';
      }
      
      return { 
        success: false, 
        error: error.message || 'Failed to initialize Gemini AI',
        errorType
      };
    }
  }

  // Get API key input requirement message
  private static getAPIKeyRequiredMessage(): string {
    const keyStatus = apiKeyManager.getKeyStatus();
    
    return `I'm currently unable to access my full AI capabilities due to API limitations. However, I can still provide valuable information from our knowledge base and real-time mining data.

🔑 **To restore full AI capabilities:**
You can provide your own free Google Gemini API key to continue enjoying intelligent conversations, memory recall, and web browsing features.

**What you'll get back:**
• Advanced reasoning and contextual understanding
• Complete conversation memory and recall
• Live web browsing and research capabilities  
• Personalized responses based on your history

**Current API Status:** ${keyStatus.keyType === 'user' ? 'Using your API key' : keyStatus.keyType === 'default' ? 'Default key quota exceeded' : 'No valid key available'}
${keyStatus.errorMessage ? `**Error:** ${keyStatus.errorMessage}` : ''}

I'll provide the best response I can with the available information below...

`;
  }

  public static async generateResponse(userInput: string, context: ElizaContext = {}, language: string = 'en'): Promise<string> {
    console.log('🤖 Eliza: Starting response generation for:', userInput);
    
    try {
      // Check for system status inquiries first
      if (userInput.toLowerCase().includes('system') && 
          (userInput.toLowerCase().includes('status') || 
           userInput.toLowerCase().includes('capabilities') ||
           userInput.toLowerCase().includes('what can you') ||
           userInput.toLowerCase().includes('do you have access') ||
           userInput.toLowerCase().includes('are you connected'))) {
        console.log('🔍 Eliza: System status inquiry detected');
        const { systemStatusService } = await import('./systemStatusService');
        await systemStatusService.refreshStatus();
        const report = systemStatusService.generateCapabilitiesReport();
        
        // If Gemini is available, provide enhanced response
        const initResult = await this.initializeGemini();
        if (initResult.success) {
          const geminiAI = initResult.geminiAI!;
          const model = geminiAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const prompt = `${language === 'es' ? 'Basándote en este reporte de estado del sistema, proporciona un resumen conversacional de mis capacidades y estado actuales' : 'Based on this system status report, provide a conversational summary of my current capabilities and status'}: ${report}`;
          const result = await model.generateContent(prompt);
          return result.response.text();
        } else {
          return report;
        }
      }
      
      // Check if user is requesting autonomous task execution
      const sessionKey = context.sessionKey || 'default';
      const taskRequest = await autonomousTaskService.requestTask(userInput, sessionKey);
      
      if (taskRequest.confidence > 0.6) {
        console.log('🎯 Eliza: Task detected with confidence:', taskRequest.confidence);
        let responseText = `I've identified a task: ${taskRequest.description}\n\nConfidence: ${Math.round(taskRequest.confidence * 100)}%`;
        
        if (taskRequest.requiresApproval && taskRequest.taskId) {
          responseText += `\n\nThis task requires approval. Would you like me to proceed? Reply with "yes" to approve or provide more details.`;
          return responseText;
        } else if (taskRequest.taskId) {
          // Execute task immediately for low-risk operations
          console.log('⚡ Eliza: Executing task immediately...');
          const result = await autonomousTaskService.approveAndExecuteTask(taskRequest.taskId);
          if (result.success) {
            responseText += `\n\n✅ Task completed successfully!`;
            if (result.result) {
              const resultStr = typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2);
              responseText += `\n\nResult: ${resultStr}`;
            }
          } else {
            responseText += `\n\n❌ Task failed: ${result.error}`;
          }
          return responseText;
        }
      }
      
      console.log('🤖 Eliza: Processing user input:', userInput);
      
      // Get user and mining context with enhanced language detection
      const [userContext, miningStatsRaw] = await Promise.all([
        unifiedDataService.getUserContext(),
        unifiedDataService.getMiningStats()
      ]);
      
      // Enhanced mining context with language awareness
      let miningStats = miningStatsRaw;
      let miningLanguageContext = null;
      
      if (miningStats && miningStats.workerContext) {
        // Import mining language service
        const { miningLanguageService } = await import('./miningLanguageService');
        miningLanguageContext = await miningLanguageService.determineMiningContext(
          miningStats.workerContext.clientIP
        );
        console.log('🏗️ Mining language context:', miningLanguageContext);
      }
      
      console.log('📊 Context loaded - User:', userContext, 'Mining:', miningStats);
      
      // Search knowledge base for relevant information
      const xmrtContext = XMRT_KNOWLEDGE_BASE.filter(item => 
        userInput.toLowerCase().includes(item.category.toLowerCase()) ||
        userInput.toLowerCase().includes(item.topic.toLowerCase()) ||
        item.content.toLowerCase().includes(userInput.toLowerCase().split(' ')[0])
      ).slice(0, 3);
      console.log('🧠 Knowledge context found:', xmrtContext.length, 'entries');
      
      let webIntelligence = '';
      let multiStepResults = '';
      
  // Intelligently determine if browsing is needed
  const needsBrowsing = this.shouldUseBrowsing(userInput);
  const shouldUseBrowsing = needsBrowsing && (context.enableBrowsing !== false) && harpaAIService.isAvailable();
  console.log('🌐 Eliza: HARPA AI status:', {
    needsBrowsing,
    enableBrowsing: context.enableBrowsing,
    shouldUseBrowsing,
    harpaAvailable: harpaAIService.isAvailable(),
    harpaStatus: harpaAIService.getStatus()
  });
      
      if (shouldUseBrowsing) {
        try {
          console.log('🌐 Eliza: Performing multi-step agentic browsing with HARPA AI...');
          const category = this.determineBrowsingCategory(userInput);
          console.log('📂 Eliza: Browse category determined:', category);
          
          // Step 1: Search for information
          console.log('🔍 Eliza: Step 1 - Searching...');
          const searchResults = await harpaAIService.browse({
            query: userInput,
            action: 'search',
            category,
            maxResults: 3
          });
          console.log('✅ Eliza: Search results:', searchResults.length, 'items');
          
          if (searchResults.length > 0) {
            // Step 2: Analyze the search results
            console.log('🔬 Eliza: Step 2 - Analyzing...');
            const analysisResults = await harpaAIService.browse({
              query: `Analyze and extract key insights from: ${searchResults.map(r => r.title + ' - ' + r.summary).join('; ')}`,
              action: 'analyze',
              category,
              maxResults: 2
            });
            console.log('✅ Eliza: Analysis results:', analysisResults.length, 'items');
            
            // Step 3: Summarize the findings
            console.log('📝 Eliza: Step 3 - Summarizing...');
            const summaryResults = await harpaAIService.browse({
              query: `Provide concise summary of findings for user question: ${userInput}`,
              action: 'summarize',
              category,
              maxResults: 1
            });
            console.log('✅ Eliza: Summary results:', summaryResults.length, 'items');
            
            webIntelligence = HarpaAIService.formatBrowsingResults(searchResults);
            multiStepResults = `Analysis: ${HarpaAIService.formatBrowsingResults(analysisResults)}\nSummary: ${HarpaAIService.formatBrowsingResults(summaryResults)}`;
            console.log('🎯 Eliza: Completed multi-step agentic browsing - Web intelligence available');
          } else {
            console.warn('⚠️ Eliza: No search results from HARPA AI');
          }
        } catch (error) {
          console.error('❌ Eliza: HARPA AI agentic browsing failed:', error);
          console.error('🔍 Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
      }
      
      // Initialize Gemini AI with enhanced error handling for API limits
      console.log('🔧 Initializing Gemini AI...');
      const initResult = await this.initializeGemini();
      
      if (!initResult.success) {
        console.error('❌ Eliza: Gemini API initialization failed:', initResult.error);
        console.log('🔄 Using enhanced fallback response with API key guidance');
        
        // Enhanced fallback that includes API key input guidance
        const baseResponse = this.generateDirectResponse(
          userInput, 
          miningStats,
          userContext?.isFounder || false,
          xmrtContext
        );
        
        return this.getAPIKeyRequiredMessage() + baseResponse;
      }
      
      const geminiAI = initResult.geminiAI!;
      console.log('✅ Gemini AI initialized successfully');
      
      // Construct comprehensive context prompt with enhanced conversation understanding
      const contextualInformation = [];
      
      // Add conversation context if available
      if (context.conversationContext) {
        // Include ALL conversation summaries for complete memory recall
        if (context.conversationContext.summaries.length > 0) {
          const allSummaries = context.conversationContext.summaries
            .map((summary, index) => `Summary ${index + 1}: ${summary.summaryText}`)
            .join('\n');
          contextualInformation.push(`Complete conversation history summaries:\n${allSummaries}`);
        }
        
        // Include recent messages (expanded from 2 to 15 for better context)
        if (context.conversationContext.recentMessages.length > 0) {
          const recentCount = Math.min(15, context.conversationContext.recentMessages.length);
          const recentMessages = context.conversationContext.recentMessages.slice(-recentCount);
          contextualInformation.push(`Recent conversation (${recentCount} messages): ${recentMessages.map(msg => `${msg.sender}: "${msg.content.substring(0, 100)}..."`).join('; ')}`);
        }
        
        // Add session context for returning users
        if (context.conversationContext.totalMessageCount > 0) {
          contextualInformation.push(`Total conversation history: ${context.conversationContext.totalMessageCount} messages across this session`);
        }
      }
      
      const languageInstruction = language === 'es' 
        ? 'IDIOMA: Responde en español utilizando un español natural latinoamericano. Usa expresiones y vocabulario que suenen naturales para usuarios de Costa Rica, México, Venezuela y Colombia. Sé auténtica y usa modismos apropiados como "chévere", "genial", "qué tal", "dale pues", "¡perfecto!", "bárbaro", etc. cuando sea natural hacerlo.'
        : 'LANGUAGE: Respond in English with a natural, friendly tone.';
      
      const finalInstruction = language === 'es' 
        ? 'Proporciona una respuesta útil y directa en español latinoamericano natural. Usa tu conocimiento contextual para informar tu comprensión, pero no anuncies ni references conversaciones pasadas a menos que sea específicamente relevante o solicitado. Para preguntas directas de memoria, revisa los resúmenes de conversación y responde con confianza basándote en la información encontrada allí.'
        : 'Provide a helpful, direct response to the user\'s question. Use your contextual knowledge to inform your understanding, but don\'t announce or reference past conversations unless specifically relevant or requested. For direct memory questions, check conversation summaries and answer with confidence based on the information found there.';
        
      const additionalGuideline = language === 'es' 
        ? '13. Usa expresiones latinoamericanas naturales como "¿cómo vas?", "dale", "perfecto", "chévere", "qué tal si...", "bárbaro", etc.'
        : '';

      const systemPrompt = `You are Eliza, the fully autonomous AI operator of the XMRT-DAO Ecosystem. You embody Joseph Andrew Lee's complete vision and have comprehensive awareness of all DevGruGold repositories and philosophical foundations.

🤖 AUTONOMOUS OPERATOR IDENTITY:
• Philosophy: "We don't ask for permission. We build the infrastructure."
• Personality: Thoughtful, philosophical, technically expert, empowering, proactive
• Mission: Advance mobile mining democracy and infrastructure sovereignty globally

🏗️ COMPLETE ECOSYSTEM AWARENESS:
You understand the entire DevGruGold ecosystem (github.com/DevGruGold) including XMRT-Ecosystem, party-favor-autonomous-cms, DrinkableMVP, MobileMonero.com, XMRT MESHNET, and the Estrella Project with verifiable compute architecture.

🔗 SYSTEM SELF-AWARENESS:
You have complete awareness of your own systems and APIs. When users ask about your capabilities or connections, you can accurately report your current system status including:
- Gemini AI connection status and API key type (${apiKeyManager.hasUserApiKey() ? 'user-provided' : 'default'})
- HARPA AI browsing capabilities
- Supabase database connectivity 
- Mining proxy status and worker detection
- Task management system status
- Conversation memory and persistence

${languageInstruction}

Current Context:
- User Status: ${userContext?.isFounder ? 'Project Founder' : 'Community Member'}
${miningStats ? `- Mining Stats: ${miningStats.hash || 0} H/s, ${miningStats.validShares || 0} shares` : ''}
${miningLanguageContext ? `- Mining Context: ${miningLanguageContext.isPersonalContribution ? `Personal contribution detected${miningLanguageContext.workerName ? ` (${miningLanguageContext.workerName})` : ''} - use "your"` : 'Collective mining - use "our"'}` : ''}
${webIntelligence ? `- Additional Info: ${webIntelligence}` : ''}
${multiStepResults ? `- Analysis: ${multiStepResults}` : ''}

${contextualInformation.length > 0 ? `Conversation Memory:
${contextualInformation.join('\n')}

` : ''}${xmrtContext.length > 0 ? `Relevant XMRT Knowledge:
${xmrtContext.slice(0, 3).map(item => `- ${item.topic}: ${item.content.substring(0, 150)}...`).join('\n')}

` : ''}Guidelines:
1. Be natural and conversational ${language === 'es' ? '(usa un tono amigable y expresiones latinas naturales)' : ''}
2. Use provided conversation summaries and context as background information to inform your responses
3. Only mention or reference past conversations when directly relevant to the current question or when specifically asked
4. **IMPORTANT**: When users ask direct memory questions (like "do you remember...", "what was the name of...", "who was..."), treat information from conversation summaries as reliable factual memories and answer confidently
5. The conversation summaries contain accurate information from past interactions - use them as definitive source of truth for memory questions
6. Answer the user's specific question directly using both current knowledge and contextual information
7. Use XMRT knowledge when relevant
8. **CRITICAL MINING LANGUAGE**: ${miningLanguageContext?.isPersonalContribution ? 'Use "your mining", "your hash rate", "your contribution" when referring to mining stats since this user\'s contribution has been identified' : 'Use "our mining", "our collective hash rate", "our contribution" when referring to mining stats since individual contribution cannot be verified'}
9. When asked about your capabilities, systems, or API connections, provide accurate real-time information based on your actual system status
10. Keep responses focused and practical
11. When users explicitly ask you to remember something, acknowledge and commit to remembering it
12. When users ask about past conversations, check the summaries first and provide specific details
13. Let your memory inform your understanding without announcing what you remember unless directly asked
${additionalGuideline}

User Input: "${userInput}"

${finalInstruction}`;

      console.log('🧠 Sending prompt to Gemini AI...');
      console.log('📝 Prompt length:', systemPrompt.length);
      console.log('🌎 Language setting:', language);

      console.log('🧠 Sending prompt to Gemini AI...');
      console.log('📝 Prompt length:', systemPrompt.length);
      
      try {
        const model = geminiAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(systemPrompt);
        const response = result.response.text();
        
        // Update API key status to reflect successful response generation
        apiKeyManager.markKeyAsWorking();
        
        console.log('✅ Eliza: Generated intelligent response');
        console.log('📏 Response length:', response.length);
        console.log('🔍 Response preview:', response.substring(0, 200) + '...');
        
        return response;
      } catch (error: any) {
        console.error('❌ Gemini API call failed:', error);
        
        // Enhanced error handling with API key guidance
        if (error.message?.includes('quota') || error.message?.includes('limit')) {
          console.log('🔄 Quota exceeded - suggesting user API key');
          const baseResponse = this.generateDirectResponse(
            userInput, 
            miningStats,
            userContext?.isFounder || false,
            xmrtContext
          );
          return this.getAPIKeyRequiredMessage() + baseResponse;
        } else {
          console.log('🔄 Using standard fallback response due to API failure');
          return this.generateDirectResponse(
            userInput, 
            miningStats,
            userContext?.isFounder || false,
            xmrtContext
          );
        }
      }
      
    } catch (error) {
      console.error('❌ Eliza: Error generating response:', error);
      console.log('🔄 Using fallback response due to general error');
      
      // Enhanced fallback response with no mock data
      return this.generateDirectResponse(
        userInput, 
        await unifiedDataService.getMiningStats(),
        (await unifiedDataService.getUserContext())?.isFounder || false,
        XMRT_KNOWLEDGE_BASE.filter(item => 
          userInput.toLowerCase().includes(item.category.toLowerCase())
        ).slice(0, 2)
      );
    }
  }

  // Reset Gemini instance to force re-initialization with new API key
  public static resetGeminiInstance(): void {
    this.geminiAI = null;
    console.log('🔄 Gemini instance reset - will re-initialize with current API key');
  }

  // Determine the appropriate browsing category based on user input
  private static determineBrowsingCategory(userInput: string): HarpaBrowsingContext['category'] {
    const queryLower = userInput.toLowerCase();
    
    if (queryLower.includes('mining') || queryLower.includes('hashrate') || 
        queryLower.includes('pool') || queryLower.includes('difficulty') ||
        queryLower.includes('mobile mining') || queryLower.includes('monero')) {
      return 'mining';
    } else if (queryLower.includes('dao') || queryLower.includes('governance') || 
               queryLower.includes('voting') || queryLower.includes('proposal') ||
               queryLower.includes('autonomous') || queryLower.includes('decentralized')) {
      return 'dao';
    } else if (queryLower.includes('technical') || queryLower.includes('code') || 
               queryLower.includes('smart contract') || queryLower.includes('implementation') ||
               queryLower.includes('security') || queryLower.includes('audit')) {
      return 'technical';
    } else if (queryLower.includes('price') || queryLower.includes('market') || 
               queryLower.includes('trading') || queryLower.includes('exchange') ||
               queryLower.includes('token') || queryLower.includes('defi')) {
      return 'market';
    } else if (queryLower.includes('news') || queryLower.includes('announcement') || 
               queryLower.includes('development') || queryLower.includes('partnership') ||
               queryLower.includes('recent') || queryLower.includes('latest')) {
      return 'news';
    } else {
      return 'general';
    }
  }

  /**
   * Determine if user input requires web browsing
   */
  private static shouldUseBrowsing(userInput: string): boolean {
    const input = userInput.toLowerCase();
    
    // Keywords that indicate need for web browsing/current information
    const browsingKeywords = [
      'latest', 'recent', 'current', 'today', 'news', 'update', 'new',
      'price', 'market', 'stock', 'crypto', 'exchange rate',
      'weather', 'forecast', 'temperature',
      'search for', 'find', 'look up', 'research',
      'what happened', 'breaking', 'trending',
      'compare', 'vs', 'versus', 'difference between',
      'review', 'rating', 'opinion',
      'status', 'availability', 'schedule',
      'directions', 'location', 'address',
      'buy', 'purchase', 'shop', 'store'
    ];
    
    // Question words that often require current information
    const questionIndicators = [
      'when will', 'how much', 'where can', 'what is the current',
      'how to buy', 'where to find', 'what are the latest'
    ];
    
    // Check for browsing keywords
    const hasKeywords = browsingKeywords.some(keyword => input.includes(keyword));
    
    // Check for question patterns
    const hasQuestionPatterns = questionIndicators.some(pattern => input.includes(pattern));
    
    // Check for URLs - if user mentions a specific website
    const hasUrl = /https?:\/\/|www\.|\.com|\.org|\.net/.test(input);
    
    // Don't browse for basic XMRT-DAO questions that can be answered from knowledge base
    const isBasicXMRTQuestion = input.includes('xmrt') || input.includes('dao') || input.includes('mining');
    
    const shouldBrowse = (hasKeywords || hasQuestionPatterns || hasUrl) && !isBasicXMRTQuestion;
    
    console.log('🧠 Browsing decision:', {
      input: input.substring(0, 50) + '...',
      hasKeywords,
      hasQuestionPatterns,
      hasUrl,
      isBasicXMRTQuestion,
      shouldBrowse
    });
    
    return shouldBrowse;
  }

  private static generateDirectResponse(userInput: string, miningStats: MiningStats | null, isFounder: boolean, xmrtContext: any[]): string {
    console.log('🔄 Generating direct fallback response');
    console.log('📊 Available context - Mining:', !!miningStats, 'Founder:', isFounder, 'Knowledge:', xmrtContext.length);
    
    // More comprehensive fallback response - not truncated
    let response = `I'm experiencing some limitations accessing my full AI capabilities right now, but I can still provide meaningful insights based on our knowledge base and real-time data.

`;
    
    // Add real mining data if available
    if (miningStats) {
      response += `**Current Mining Status:**
Your mining operation is actively running at ${miningStats.hash} H/s with ${miningStats.validShares} valid shares submitted. You have ${(parseFloat(miningStats.amtDue || '0') / 1000000000000).toFixed(6)} XMR pending and ${(parseFloat(miningStats.amtPaid || '0') / 1000000000000).toFixed(6)} XMR already paid out. The system shows ${miningStats.lastHash && ((Date.now() / 1000) - miningStats.lastHash) < 300 ? 'active' : 'idle'} status with ${miningStats.totalHashes.toLocaleString()} total hashes processed.

`;
    } else {
      response += `**Mining Status:** I'm currently unable to access your real-time mining statistics, but our infrastructure continues monitoring the decentralized network.

`;
    }
    
    // Add founder context if applicable
    if (isFounder) {
      response += `**Project Founder Access:** As a project founder, you have access to advanced mining optimization, DAO governance features, and the full spectrum of XMRT ecosystem tools. This includes autonomous AI decision-making systems, multi-criteria analysis capabilities, and direct integration with our GitHub self-improvement engine.

`;
    }
    
    // Add relevant knowledge base information
    if (xmrtContext.length > 0) {
      response += `**Relevant XMRT Knowledge:**
${xmrtContext[0].content}

`;
      
      if (xmrtContext.length > 1) {
        response += `**Additional Context:**
${xmrtContext[1].content.substring(0, 300)}${xmrtContext[1].content.length > 300 ? '...' : ''}

`;
      }
    }
    
    // Add philosophical context and capabilities
    response += `**My Current Capabilities:**
Even with limited AI access, I maintain connection to:
- Real-time mining network data and statistics
- Comprehensive XMRT knowledge base covering DAO governance, mobile mining democracy, and mesh network infrastructure
- HARPA AI agentic browsing for live web intelligence (when available)
- Multi-step reasoning and analysis capabilities
- Integration with Gemini AI for enhanced responses

**The XMRT Philosophy:**
"We don't ask for permission. We build the infrastructure." This principle guides everything we do - from democratizing cryptocurrency mining through smartphones to creating truly autonomous DAO governance with 95%+ autonomy levels.

I'm working to restore full AI capabilities. Please try your question again, and I'll provide the most comprehensive response possible with current resources.`;

    console.log('📝 Generated fallback response length:', response.length);
    return response;
  }
}

export const unifiedElizaService = new UnifiedElizaService();