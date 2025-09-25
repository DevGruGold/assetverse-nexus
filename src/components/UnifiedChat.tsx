import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { AdaptiveAvatar } from './AdaptiveAvatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { GeminiAPIKeyInput } from './GeminiAPIKeyInput';
import { TaskApprovalInterface } from './TaskApprovalInterface';
import { mobilePermissionService } from '@/services/mobilePermissionService';
import { Send, Volume2, VolumeX, Trash2, Key } from 'lucide-react';

// Services
import { UnifiedElizaService } from '@/services/unifiedElizaService';
import { GeminiTTSService } from '@/services/geminiTTSService';
import { unifiedDataService, type MiningStats, type UserContext } from '@/services/unifiedDataService';
import { unifiedFallbackService } from '@/services/unifiedFallbackService';
import { conversationPersistence } from '@/services/conversationPersistenceService';
import { quickGreetingService } from '@/services/quickGreetingService';
import { apiKeyManager } from '@/services/apiKeyManager';
import { autonomousTaskService } from '@/services/autonomousTaskService';

// Debug environment variables on component load
console.log('UnifiedChat Environment Check:', {
  VITE_GEMINI_API_KEY_exists: !!import.meta.env.VITE_GEMINI_API_KEY,
  VITE_GEMINI_API_KEY_length: import.meta.env.VITE_GEMINI_API_KEY?.length || 0,
  VITE_ELEVENLABS_API_KEY_exists: !!import.meta.env.VITE_ELEVENLABS_API_KEY,
  all_env_vars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
});

interface UnifiedMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  attachments?: {
    images?: string[];
    audio?: Blob;
    transcript?: string;
  };
  emotionalContext?: {
    voiceTone?: string;
    facialExpression?: string;
    confidenceLevel?: number;
  };
  emotion?: string;
  confidence?: number;
  taskRequest?: {
    taskId: string;
    requiresApproval: boolean;
    description: string;
    confidence: number;
    type?: string;
    parameters?: any;
  };
}

// MiningStats imported from unifiedDataService

interface UnifiedChatProps {
  apiKey?: string;
  className?: string;
  miningStats?: MiningStats;
}

// Internal component that uses ElevenLabs TTS instead of Hume
const UnifiedChatInner: React.FC<UnifiedChatProps> = ({
  apiKey = import.meta.env.VITE_GEMINI_API_KEY || "",
  className = '',
  miningStats: externalMiningStats
}) => {
  // Core state
  const { language } = useLanguage();
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [conversationSummaries, setConversationSummaries] = useState<Array<{ summaryText: string; messageCount: number; createdAt: Date }>>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [totalMessageCount, setTotalMessageCount] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(true); // Always connected for text/TTS mode

  // Voice/TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [geminiTTSService, setGeminiTTSService] = useState<GeminiTTSService | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Default to enabled
  const [currentAIMethod, setCurrentAIMethod] = useState<string>('');
  const [currentTTSMethod, setCurrentTTSMethod] = useState<string>('');

  // API Key Management state
  const [showAPIKeyInput, setShowAPIKeyInput] = useState(false);
  const [needsAPIKey, setNeedsAPIKey] = useState(false);

  // Task handling state
  const [pendingTaskApproval, setPendingTaskApproval] = useState<{
    taskId: string;
    requiresApproval: boolean;
    description: string;
    confidence: number;
  } | null>(null);
  const [executingTask, setExecutingTask] = useState<string | null>(null);

  const [currentEmotion, setCurrentEmotion] = useState<string>('');
  const [emotionConfidence, setEmotionConfidence] = useState<number>(0);

  // XMRT context state - using unified service
  const [miningStats, setMiningStats] = useState<MiningStats | null>(externalMiningStats || null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [lastElizaMessage, setLastElizaMessage] = useState<string>("");

  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini TTS service
  useEffect(() => {
    try {
      const service = new GeminiTTSService('AIzaSyB3jfxdMQzPpIb5MNfT8DtP5MOvT_Sp7qk');
      setGeminiTTSService(service);
      console.log('Gemini TTS service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemini TTS:', error);
      setVoiceEnabled(false);
    }
  }, []);

  // Auto-scroll to bottom only when messages are actually added (within chat container only)
  useEffect(() => {
    // Only scroll if there are messages and not just loading
    if (messages.length > 0 && !isProcessing) {
      // Use setTimeout to ensure DOM updates are complete
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
        // Use scrollIntoView with block: 'nearest' to prevent page-level scrolling
        messagesEndRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "nearest",
          inline: "nearest" 
        });
      }, 100);
    }
  }, [messages, isProcessing]);

  // Initialize unified data service and conversation persistence
  useEffect(() => {
    const initialize = async () => {
      try {
        const [userCtx, miningData] = await Promise.all([
          unifiedDataService.getUserContext(),
          externalMiningStats || unifiedDataService.getMiningStats()
        ]);
        
        setUserContext(userCtx);
        if (!externalMiningStats) {
          setMiningStats(miningData);
        }

        // Initialize conversation persistence with optimized loading
        try {
          await conversationPersistence.initializeSession();
          
          // Load conversation context (summaries only, no messages for return users)
          const context = await conversationPersistence.getConversationContext(0); // 0 messages = summaries only
          
          if (context.summaries.length > 0 || context.totalMessageCount > 0) {
            // Set context but don't load messages - let AI greeting handle the context
            setConversationSummaries(context.summaries);
            setHasMoreMessages(context.totalMessageCount > 0);
            setTotalMessageCount(context.totalMessageCount);
            
            console.log(`Found ${context.summaries.length} summaries for ${context.totalMessageCount} total messages. Starting with summary-aware greeting.`);
          }
        } catch (error) {
          console.log('Conversation persistence temporarily disabled:', error);
        }

        // Set up periodic refresh for mining stats only if not provided externally
        if (!externalMiningStats) {
          const interval = setInterval(async () => {
            const freshStats = await unifiedDataService.getMiningStats();
            setMiningStats(freshStats);
          }, 30000);
          return () => clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to initialize unified data:', error);
      }
    };
    
    initialize();
  }, []);

  // Generate immediate greeting when user context is available
  useEffect(() => {
    if (userContext && messages.length === 0) {
      generateQuickGreeting();
    }
  }, [userContext, conversationSummaries]);

  const generateQuickGreeting = () => {
    // Show immediate greeting without waiting for AI
    const cachedSummary = quickGreetingService.getCachedConversationSummary();
    
    const quickGreeting = quickGreetingService.generateQuickGreeting({
      isFounder: userContext?.isFounder,
      conversationSummary: cachedSummary?.summary || (conversationSummaries.length > 0 ? conversationSummaries[conversationSummaries.length - 1].summaryText : undefined),
      totalMessageCount: cachedSummary?.messageCount || totalMessageCount,
      miningStats
    });
    
    const greeting: UnifiedMessage = {
      id: 'quick-greeting',
      content: quickGreeting,
      sender: 'assistant',
      timestamp: new Date()
    };
    
    setMessages([greeting]);
    setLastElizaMessage(quickGreeting);
    
    // Store greeting in persistent storage (non-blocking)
    conversationPersistence.storeMessage(quickGreeting, 'assistant', {
      type: 'quick-greeting',
      isReturnUser: conversationSummaries.length > 0,
      totalPreviousMessages: totalMessageCount
    }).catch(error => {
      console.log('Conversation persistence error:', error);
    });
  };

  // Clear conversation history
  const handleClearConversation = async () => {
    if (!confirm('Are you sure you want to clear the entire conversation history? This cannot be undone.')) {
      return;
    }

    try {
      await conversationPersistence.clearConversationHistory();
      
      // Reset local state
      setMessages([]);
      setConversationSummaries([]);
      setHasMoreMessages(false);
      setTotalMessageCount(0);
      setLastElizaMessage('');
      
      // Generate new greeting for fresh start
      if (userContext) {
        const greeting: UnifiedMessage = {
          id: 'fresh-greeting',
          content: "Hello! I'm Eliza, your XMRT assistant. How can I help you today?",
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages([greeting]);
        setLastElizaMessage(greeting.content);
        
        // Store new greeting
        await conversationPersistence.storeMessage(greeting.content, 'assistant', {
          type: 'fresh-start-greeting'
        });
      }
      
      console.log('✅ Conversation cleared and reset');
    } catch (error) {
      console.error('Failed to clear conversation:', error);
      // Show error to user
      const errorMessage: UnifiedMessage = {
        id: `error-${Date.now()}`,
        content: 'Failed to clear conversation history. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Load more messages for pagination
  const loadMoreMessages = async () => {
    if (loadingMoreMessages || !hasMoreMessages) return;
    
    setLoadingMoreMessages(true);
    try {
      // Load recent messages from the database (this replaces the current empty state)
      const recentMessages = await conversationPersistence.getRecentConversationHistory(20);
      if (recentMessages.length > 0) {
        const convertedMessages: UnifiedMessage[] = recentMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
          ...msg.metadata
        }));
        
        // Replace the greeting with actual conversation history
        setMessages(prev => {
          // Keep the greeting if it exists, then add the history
          const greeting = prev.find(msg => msg.id === 'greeting');
          return greeting ? [greeting, ...convertedMessages] : convertedMessages;
        });
      }
      
      // After loading first batch, enable normal pagination
      setHasMoreMessages(recentMessages.length >= 20 && recentMessages.length < totalMessageCount);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  // XMRT Knowledge Base Integration Functions
  const fetchMiningStats = async () => {
    try {
      const response = await fetch(
        "https://www.supportxmr.com/api/miner/46UxNFuGM2E3UwmZWWJicaRPoRwqwW4byQkaTHkX8yPcVihp91qAVtSFipWUGJJUyTXgzSqxzDQtNLf2bsp2DX2qCCgC5mg/stats"
      );
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      setMiningStats({
        hash: data.hash || 0,
        identifier: data.identifier || 'global',
        lastHash: data.lastHash || 0,
        totalHashes: data.totalHashes || 0,
        validShares: data.validShares || 0,
        invalidShares: data.invalidShares || 0,
        amtDue: ((data.amtDue || 0) / 1000000000000).toString(),
        amtPaid: ((data.amtPaid || 0) / 1000000000000).toString(),
        txnCount: data.txnCount || 0,
        workerContext: {
          canIdentifyWorker: false,
          detectedWorker: null,
          registrationRequired: false,
          clientIP: ''
        },
        historyData: {
          hasHistory: false
        },
        paymentsData: {
          hasPayments: false
        },
        lastUpdate: new Date().toISOString(),
        status: 'live' as const
      });
    } catch (err) {
      console.error('Failed to fetch mining stats:', err);
      // Keep using unified service for consistency
    }
  };

  // Remove old IP function - using unified service
  // const fetchUserIP = async () => { ... removed ... };

  // Helper functions using unified service
  const isFounder = () => {
    return userContext?.isFounder || false;
  };

  const formatHashrate = (hashrate: number): string => {
    if (hashrate >= 1000000) {
      return `${(hashrate / 1000000).toFixed(2)} MH/s`;
    } else if (hashrate >= 1000) {
      return `${(hashrate / 1000).toFixed(2)} KH/s`;
    }
    return `${hashrate.toFixed(2)} H/s`;
  };

  // Unified response display with intelligent TTS control
  const displayResponse = async (responseText: string, shouldSpeak: boolean = false) => {
    const elizaMessage: UnifiedMessage = {
      id: `eliza-${Date.now()}`,
      content: responseText,
      sender: 'assistant',
      timestamp: new Date(),
      emotion: currentEmotion,
      confidence: emotionConfidence
    };

    setMessages(prev => [...prev, elizaMessage]);
    setLastElizaMessage(responseText);

    // Use TTS if requested and voice service is available
    // Add a small delay in voice mode to reduce overlap with speech recognition
    if (shouldSpeak && geminiTTSService && voiceEnabled) {
      try {
        setIsSpeaking(true);
        
        await geminiTTSService.speakText({ text: responseText });
      } catch (error) {
        console.error('Gemini TTS error:', error);
      } finally {
        setIsSpeaking(false);
      }
    }
  };

  // Voice input handler - WITH smart TTS timing and speech recognition pausing
  const handleVoiceInput = async (transcript: string) => {
    if (!transcript?.trim() || isProcessing) return;

    // If Eliza is speaking, interrupt her
    if (isSpeaking && geminiTTSService) {
      geminiTTSService.stopSpeaking();
      setIsSpeaking(false);
    }

    const userMessage: UnifiedMessage = {
      id: `voice-user-${Date.now()}`,
      content: transcript,
      sender: 'user',
      timestamp: new Date(),
      emotion: currentEmotion,
      confidence: emotionConfidence
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    // Store user message
    try {
      await conversationPersistence.storeMessage(transcript, 'user', {
        emotion: currentEmotion,
        confidence: emotionConfidence,
        inputType: 'voice'
      });
    } catch (error) {
      console.log('Conversation persistence error:', error);
    }

    try {
      
      const result = await UnifiedElizaService.generateResponse(transcript, {
        miningStats,
        userContext,
        inputMode: 'voice',
        shouldSpeak: true,
        enableBrowsing: true,
        conversationContext: await conversationPersistence.getFullConversationContext()  // Enhanced context for voice too
      });

      const elizaMessage: UnifiedMessage = {
        id: `eliza-${Date.now()}`,
        content: result.response,
        sender: 'assistant',
        timestamp: new Date(),
        confidence: 0.95
      };

      setMessages(prev => [...prev, elizaMessage]);
      setLastElizaMessage(result.response);
      
      // Store Eliza's response
      try {
        await conversationPersistence.storeMessage(result.response, 'assistant', {
          confidence: 0.95,
          method: 'Gemini AI',
          inputType: 'voice'
        });
      } catch (error) {
        console.log('Conversation persistence error:', error);
      }

      // Speak response using Gemini TTS directly
      if (voiceEnabled && geminiTTSService) {
        try {
          setIsSpeaking(true);
          
          // Add small delay in voice mode to let speech recognition settle
          await new Promise(resolve => setTimeout(resolve, 500));
          
          await geminiTTSService.speakText({ text: result.response }, () => {
            setIsSpeaking(false);
          });
          setCurrentTTSMethod('Gemini TTS');
        } catch (error) {
          console.error('Gemini TTS failed:', error);
          setCurrentTTSMethod('failed');
        } finally {
          setIsSpeaking(false);
        }
      }
      
    } catch (error) {
      console.error('Failed to process voice input:', error);
      const errorMessage: UnifiedMessage = {
        id: `error-${Date.now()}`,
        content: 'I apologize, but I\'m having trouble processing your voice input right now.',
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Text message handler
  const handleSendMessage = async () => {
    if (!textInput.trim() || isProcessing) return;

    // Check if user pasted a Gemini API key (starts with "AIza")
    if (textInput.trim().startsWith('AIza') && textInput.trim().length > 30) {
      setIsProcessing(true);
      try {
        const apiKey = textInput.trim();
        const result = await apiKeyManager.setUserApiKey(apiKey);
        
        if (result.success) {
          // Clear the API key from input and reset services
          setTextInput('');
          UnifiedElizaService.resetGeminiInstance();
          setNeedsAPIKey(false);
          
          const successMessage: UnifiedMessage = {
            id: `api-success-${Date.now()}`,
            content: '🔑 Perfect! Your Gemini API key has been validated and saved securely. Full AI capabilities have been restored. What would you like to talk about?',
            sender: 'assistant',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, successMessage]);
          setLastElizaMessage(successMessage.content);
        } else {
          const errorMessage: UnifiedMessage = {
            id: `api-error-${Date.now()}`,
            content: `❌ ${result.message}`,
            sender: 'assistant',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, errorMessage]);
          setTextInput('');
        }
      } catch (error) {
        console.error('API key validation error:', error);
        const errorMessage: UnifiedMessage = {
          id: `api-error-${Date.now()}`,
          content: '❌ Failed to validate the API key. Please try again or use the 🔑 button above for the setup form.',
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
        setTextInput('');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // If Eliza is speaking, interrupt her when user sends a message
    if (isSpeaking && geminiTTSService) {
      geminiTTSService.stopSpeaking();
      setIsSpeaking(false);
    }

    const userMessage: UnifiedMessage = {
      id: `user-${Date.now()}`,
      content: textInput,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setTextInput('');
    setIsProcessing(true);

    // Store user message
    try {
      await conversationPersistence.storeMessage(userMessage.content, 'user', {
        inputType: 'text'
      });
    } catch (error) {
      console.log('Conversation persistence error:', error);
    }

    try {
      console.log('💬 Starting message processing:', textInput.trim());
      console.log('🔧 Context:', { miningStats: !!miningStats, userContext: !!userContext });
      
      console.log('💾 User message stored, generating response...');
      
      // Get full conversation context for better AI understanding
      const fullContext = await conversationPersistence.getFullConversationContext();
      
      const result = await UnifiedElizaService.generateResponse(textInput.trim(), {
        miningStats,
        userContext,
        inputMode: 'text',
        shouldSpeak: false,
        enableBrowsing: true,  // Let the service decide when to browse
        conversationContext: fullContext,  // Enhanced context for better understanding
        sessionKey: 'unified-chat-session'  // Add session key for task tracking
      });
      
      // Check if response indicates API key is needed
      if (result.response.includes('🔑 **To restore full AI capabilities:**')) {
        setNeedsAPIKey(true);
      }
      
      console.log('✅ Response generated:', result.response.substring(0, 100) + '...');

      const elizaMessage: UnifiedMessage = {
        id: `eliza-${Date.now()}`,
        content: result.response,
        sender: 'assistant',
        timestamp: new Date(),
        confidence: 0.95
      };

      setMessages(prev => [...prev, elizaMessage]);
      setLastElizaMessage(result.response);
      
      // Store Eliza's response
      try {
        await conversationPersistence.storeMessage(result.response, 'assistant', {
          confidence: 0.95,
          method: 'Gemini AI',
          inputType: 'text'
        });
      } catch (error) {
        console.log('Conversation persistence error:', error);
      }

      // Speak response if voice is enabled using Gemini TTS directly
      if (voiceEnabled && geminiTTSService) {
        try {
          setIsSpeaking(true);
          await geminiTTSService.speakText({ text: result.response }, () => {
            setIsSpeaking(false);
          });
          setCurrentTTSMethod('Gemini TTS');
        } catch (error) {
          console.error('Gemini TTS failed:', error);
          setCurrentTTSMethod('failed');
          setIsSpeaking(false);
        }
      }
      
    } catch (error) {
      console.error('❌ Chat error:', error);
      console.error('Error details:', error.message, error.stack);
      const errorMessage: UnifiedMessage = {
        id: `error-${Date.now()}`,
        content: 'I apologize, but I\'m having trouble processing your message right now. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      console.log('🏁 Message processing complete, setting isProcessing to false');
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle voice synthesis
  const toggleVoiceSynthesis = () => {
    const newVoiceState = !voiceEnabled;
    setVoiceEnabled(newVoiceState);
    
    // If disabling voice (muting), stop any ongoing speech
    if (!newVoiceState && geminiTTSService) {
      geminiTTSService.stopSpeaking();
      setIsSpeaking(false);
    }
  };

  const handleAPIKeyValidated = () => {
    console.log('✅ API key validated, resetting Gemini and hiding input');
    
    // Reset Gemini instance to use new API key
    UnifiedElizaService.resetGeminiInstance();
    
    // Hide the API key input
    setShowAPIKeyInput(false);
    setNeedsAPIKey(false);
    
    // Add a success message to chat
    const successMessage: UnifiedMessage = {
      id: `success-${Date.now()}`,
      content: 'Great! Your API key has been validated and saved. Full AI capabilities have been restored. How can I help you?',
      sender: 'assistant',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, successMessage]);
  };

  return (
    <Card className={`bg-card/50 backdrop-blur-sm border border-border/50 flex flex-col h-[500px] sm:h-[600px] ${className}`}>
      {/* Simplified Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AdaptiveAvatar
              apiKey={apiKey}
              className="h-8 w-8 sm:h-10 sm:w-10"
              size="sm"
              enableVoice={voiceEnabled}
            />
            <div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Eliza AI</h3>
              <p className="text-xs text-muted-foreground">Your XMRT Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* API Key Button */}
            <Button
              onClick={() => setShowAPIKeyInput(true)}
              variant="ghost"
              size="sm"
              className={needsAPIKey ? 'text-orange-500 animate-pulse' : 'text-muted-foreground'}
              title="Add or update Gemini API key"
            >
              <Key className="h-4 w-4" />
            </Button>
            
            {/* Clear Conversation Button */}
            {totalMessageCount > 0 && (
              <Button
                onClick={handleClearConversation}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                title="Clear conversation history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            {/* Voice Toggle */}
            <Button
              onClick={toggleVoiceSynthesis}
              variant="ghost"
              size="sm"
              className={voiceEnabled ? 'text-primary' : 'text-muted-foreground'}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Clean Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* Load Previous Conversation Button */}
            {hasMoreMessages && totalMessageCount > 0 && (
              <div className="flex justify-center">
                <Button
                  onClick={loadMoreMessages}
                  disabled={loadingMoreMessages}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {loadingMoreMessages ? 'Loading...' : `View Previous Conversation (${totalMessageCount} messages)`}
                </Button>
              </div>
            )}
            
            {/* Conversation Summary Context (only show if user hasn't loaded messages) */}
            {conversationSummaries.length > 0 && !messages.some(m => m.id !== 'greeting') && (
              <div className="bg-muted/30 border border-border/30 rounded-lg p-3 mb-2">
                <div className="text-xs text-muted-foreground mb-1">Last conversation context:</div>
                <div className="text-xs leading-relaxed opacity-75">
                  {conversationSummaries[conversationSummaries.length - 1]?.summaryText}
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[75%] p-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted/50 text-foreground rounded-bl-md'
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-60 mt-2">
                    {message.timestamp instanceof Date 
                      ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  </div>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-muted/50 text-foreground p-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* API Key Input Dialog - Show automatically when needed or manually requested */}
        {(showAPIKeyInput || needsAPIKey) && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <GeminiAPIKeyInput 
              onKeyValidated={handleAPIKeyValidated}
              onClose={() => {
                setShowAPIKeyInput(false);
                setNeedsAPIKey(false);
              }}
              showAsDialog={true}
            />
          </div>
        )}
      </div>

      {/* Text Input Area */}
      <div className="border-t border-border/50 bg-background/50">
        <div className="p-4">
          <div className="flex gap-3">
            <Input
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value);
                // If user starts typing while Eliza is speaking, interrupt her
                if (isSpeaking && geminiTTSService && e.target.value.length > 0) {
                  geminiTTSService.stopSpeaking();
                  setIsSpeaking(false);
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder={
                needsAPIKey 
                  ? "Paste your Gemini API key here or use the 🔑 button above..." 
                  : isSpeaking 
                    ? "Start typing to interrupt..." 
                    : "Ask Eliza anything..."
              }
              className="flex-1 rounded-full border-border/50 bg-background/50 min-h-[48px] text-sm px-4"
              disabled={isProcessing}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!textInput.trim() || isProcessing}
              size="sm"
              className="rounded-full min-h-[48px] min-w-[48px] hover-scale"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// External wrapper - no longer needs Hume provider
export const UnifiedChat: React.FC<UnifiedChatProps> = (props) => {
  return <UnifiedChatInner {...props} />;
};

export default UnifiedChat;