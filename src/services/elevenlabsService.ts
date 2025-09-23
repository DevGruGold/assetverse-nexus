// Enhanced ElevenLabs TTS and Conversational AI Service
export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private currentAudio: HTMLAudioElement | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Generate AI response using ElevenLabs Conversational AI
  async generateResponse(
    userInput: string,
    context?: { miningStats?: any; userContext?: any }
  ): Promise<{ text: string; method: string; confidence: number }> {
    try {
      // Enhanced contextual prompt for XMRT-DAO
      const contextualPrompt = `As Eliza, the intelligent XMRT-DAO AI assistant, provide a helpful response to: "${userInput}"

Context about XMRT-DAO:
- Mobile Monero mining democracy platform
- Privacy-focused decentralized ecosystem  
- Community governance and DAO participation
- Mining pool integration and statistics
${context?.miningStats ? `- Current mining status: ${context.miningStats.isOnline ? 'Active mining' : 'Offline'} with ${context.miningStats.hashRate || 0} H/s` : ''}
${context?.userContext?.isFounder ? '- User is a project founder' : '- User is a community member'}

Provide a concise, helpful, and engaging response that acknowledges their input and offers relevant assistance.`;

      // Use ElevenLabs text generation (if available) or create intelligent response
      const response = await fetch(`${this.baseUrl}/text-generation`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          prompt: contextualPrompt,
          max_tokens: 200,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          text: data.text || this.generateFallbackResponse(userInput, context),
          method: 'ElevenLabs AI',
          confidence: 0.85
        };
      } else {
        // Fallback to our own intelligent response generation
        return {
          text: this.generateFallbackResponse(userInput, context),
          method: 'ElevenLabs (Fallback)',
          confidence: 0.75
        };
      }
    } catch (error) {
      console.error('❌ ElevenLabs AI response error:', error);
      return {
        text: this.generateFallbackResponse(userInput, context),
        method: 'ElevenLabs (Error Fallback)',
        confidence: 0.6
      };
    }
  }

  // Intelligent fallback response generation
  private generateFallbackResponse(userInput: string, context?: any): string {
    const input = userInput.toLowerCase();
    
    // Mining-related queries
    if (input.includes('mining') || input.includes('hash') || input.includes('xmr')) {
      return context?.miningStats?.lastHash 
        ? `Great! I can see your mining is active. Your current hashrate is ${context.miningStats.hash || 0} H/s. How can I help you optimize your mining setup?`
        : `I notice your miner might be offline. Would you like help troubleshooting your mining setup or checking your configuration?`;
    }
    
    // DAO and governance
    if (input.includes('dao') || input.includes('governance') || input.includes('vote')) {
      return `XMRT-DAO empowers mobile mining democracy! As a ${context?.userContext?.isFounder ? 'project founder' : 'community member'}, you can participate in governance decisions. What aspect of the DAO interests you most?`;
    }
    
    // Privacy and security
    if (input.includes('privacy') || input.includes('secure') || input.includes('anonymous')) {
      return `Privacy is at the core of XMRT-DAO! We're built on Monero's privacy-first principles. Whether it's mining, transactions, or governance, your privacy is protected. What privacy features would you like to learn about?`;
    }
    
    // Technical support
    if (input.includes('help') || input.includes('support') || input.includes('problem')) {
      return `I'm here to help! As your XMRT-DAO assistant, I can assist with mining setup, wallet management, DAO participation, or any technical questions. What specific area would you like support with?`;
    }
    
    // General greeting/conversation
    return `Hello! I'm Eliza, your XMRT-DAO AI assistant. I'm here to help you with mobile Monero mining, privacy education, and DAO participation. How can I assist you today?`;
  }

  // Convert text to speech using ElevenLabs with enhanced quality
  async textToSpeech(
    text: string,
    voiceId: string = 'Xb7hH8MSUJpSbSDYk0k2', // Alice - clear female voice for Eliza
    modelId: string = 'eleven_turbo_v2_5' // Fast, high quality, multilingual
  ): Promise<Blob> {
    try {
      console.log('🎵 Generating ElevenLabs TTS for:', text.substring(0, 50) + '...');
      
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: modelId,
          voice_settings: {
            stability: 0.6,        // Slightly more stable for AI assistant
            similarity_boost: 0.8, // High similarity to original voice
            style: 0.3,            // Moderate style expression
            use_speaker_boost: true // Enhance clarity
          },
          pronunciation_dictionary_locators: []
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ElevenLabs API error:', response.status, errorText);
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBlob = await response.blob();
      console.log('✅ ElevenLabs TTS generated successfully, size:', audioBlob.size, 'bytes');
      return audioBlob;
    } catch (error) {
      console.error('❌ ElevenLabs TTS error:', error);
      throw error;
    }
  }

  // Play audio blob with interruption support
  async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop any currently playing audio
      this.stopSpeaking();
      
      this.currentAudio = new Audio();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      this.currentAudio.src = audioUrl;
      this.currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        resolve();
      };
      this.currentAudio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        console.error('❌ Audio playback error:', e);
        reject(new Error('ElevenLabs audio playback failed'));
      };
      
      this.currentAudio.play().catch(error => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        reject(error);
      });
    });
  }

  // Stop any currently playing speech
  stopSpeaking(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  // Check if currently speaking
  isSpeaking(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }

  // Convert text to speech and play immediately with interruption support
  async speakText(
    text: string,
    voiceId?: string,
    modelId?: string,
    onSpeechEnd?: () => void
  ): Promise<void> {
    try {
      // Set up end callback before playing
      if (onSpeechEnd) {
        const audioBlob = await this.textToSpeech(text, voiceId, modelId);
        
        return new Promise((resolve, reject) => {
          // Stop any currently playing audio
          this.stopSpeaking();
          
          this.currentAudio = new Audio();
          const audioUrl = URL.createObjectURL(audioBlob);
          
          this.currentAudio.src = audioUrl;
          this.currentAudio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            this.currentAudio = null;
            onSpeechEnd();
            resolve();
          };
          this.currentAudio.onerror = (e) => {
            URL.revokeObjectURL(audioUrl);
            this.currentAudio = null;
            reject(new Error('ElevenLabs audio playback failed'));
          };
          
          this.currentAudio.play().catch(error => {
            URL.revokeObjectURL(audioUrl);
            this.currentAudio = null;
            reject(error);
          });
        });
      } else {
        const audioBlob = await this.textToSpeech(text, voiceId, modelId);
        await this.playAudio(audioBlob);
      }
      console.log('✅ ElevenLabs speech completed');
    } catch (error) {
      console.error('❌ Failed to speak text:', error);
      if (onSpeechEnd) onSpeechEnd();
      throw error;
    }
  }

  // Get available premium voices optimized for AI assistants
  static getAvailableVoices() {
    return [
      { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', description: 'Clear, professional female voice - Perfect for AI assistants' },
      { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', description: 'Warm, friendly female voice - Great for conversational AI' },
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Natural conversational female voice' },
      { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', description: 'Warm, professional male voice' },
      { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', description: 'Sophisticated female voice' },
      { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', description: 'Expressive female voice' },
      { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: 'Distinguished male voice' }
    ];
  }

  // Get voice characteristics for emotional context
  static getVoiceForEmotion(emotion: string): string {
    const emotionMap: { [key: string]: string } = {
      'happy': 'pFZP5JQG7iQjIQuC4Bku', // Lily - warm and friendly
      'confident': 'Xb7hH8MSUJpSbSDYk0k2', // Alice - clear and professional
      'empathetic': 'EXAVITQu4vr4xnSDxMaL', // Sarah - conversational
      'excited': 'cgSgspJ2msm6clMCkdW9', // Jessica - expressive
      'calm': 'XB0fDUnXU5powFXDhCwa', // Charlotte - sophisticated
      'default': 'Xb7hH8MSUJpSbSDYk0k2' // Alice - reliable default
    };
    
    return emotionMap[emotion.toLowerCase()] || emotionMap['default'];
  }

  // Test service availability
  async testService(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });
      
      const isAvailable = response.ok;
      console.log(isAvailable ? '✅ ElevenLabs service available' : '❌ ElevenLabs service unavailable');
      return isAvailable;
    } catch (error) {
      console.error('❌ ElevenLabs service test failed:', error);
      return false;
    }
  }
}

// Create service instance with environment variable
export const createElevenLabsService = () => {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ ELEVENLABS_API_KEY not found in environment variables');
    return null;
  }
  
  console.log('🎵 Initializing ElevenLabs service');
  return new ElevenLabsService(apiKey);
};