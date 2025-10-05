import { pipeline } from '@huggingface/transformers';

export class LocalLLMService {
  private static instance: LocalLLMService | null = null;
  private textGenerator: any = null;
  private modelLoading = false;
  private loadPromise: Promise<void> | null = null;
  private downloadProgress = 0;
  private progressCallbacks: Set<(progress: number) => void> = new Set();

  private constructor() {}

  static getInstance(): LocalLLMService {
    if (!this.instance) {
      this.instance = new LocalLLMService();
    }
    return this.instance;
  }

  async initialize(): Promise<void> {
    if (this.textGenerator) return;
    if (this.modelLoading && this.loadPromise) return this.loadPromise;

    this.modelLoading = true;
    
    this.loadPromise = this.loadModel();
    await this.loadPromise;
    
    this.modelLoading = false;
  }

  onProgress(callback: (progress: number) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  private notifyProgress(progress: number) {
    this.downloadProgress = progress;
    this.progressCallbacks.forEach(cb => cb(progress));
  }

  private async loadModel(): Promise<void> {
    try {
      console.log('🤖 Loading local LLM model...');
      this.notifyProgress(10);
      
      // Use a small, efficient model that can run in browser
      // DistilGPT-2 is a good balance of size and capability
      this.notifyProgress(30);
      this.textGenerator = await pipeline(
        'text-generation',
        'distilgpt2',
        {
          device: 'webgpu', // Use WebGPU if available, fallback to CPU
          dtype: 'fp16', // Use half precision for better performance
        }
      );
      
      this.notifyProgress(100);
      console.log('✅ Local LLM model loaded successfully');
    } catch (error) {
      console.warn('⚠️ WebGPU not available, falling back to CPU');
      this.notifyProgress(40);
      
      try {
        // Fallback to CPU if WebGPU fails
        this.textGenerator = await pipeline(
          'text-generation',
          'distilgpt2',
          {
            device: 'cpu',
            dtype: 'fp32',
          }
        );
        
        this.notifyProgress(100);
        console.log('✅ Local LLM model loaded on CPU');
      } catch (cpuError) {
        console.error('❌ Failed to load local LLM model:', cpuError);
        this.notifyProgress(0);
        throw cpuError;
      }
    }
  }

  getProgress(): number {
    return this.downloadProgress;
  }

  async generateResponse(prompt: string, options: {
    maxLength?: number;
    temperature?: number;
    topP?: number;
    doSample?: boolean;
  } = {}): Promise<string> {
    if (!this.textGenerator) {
      await this.initialize();
    }

    if (!this.textGenerator) {
      throw new Error('Local LLM model not available');
    }

    try {
      const {
        maxLength = 150,
        temperature = 0.7,
        topP = 0.9,
        doSample = true
      } = options;

      // Create a better prompt for the model
      const enhancedPrompt = `User: ${prompt}
Assistant: I'll help you with that. `;

      console.log('🧠 Generating response with local LLM...');
      
      const result = await this.textGenerator(enhancedPrompt, {
        max_length: maxLength,
        temperature,
        top_p: topP,
        do_sample: doSample,
        pad_token_id: 50256, // GPT-2 padding token
        eos_token_id: 50256, // GPT-2 end of sequence token
        return_full_text: false, // Only return generated text
      });

      let generatedText = '';
      
      if (Array.isArray(result)) {
        generatedText = (result[0] as any)?.generated_text || '';
      } else {
        generatedText = (result as any)?.generated_text || '';
      }

      // Clean up the response
      generatedText = this.cleanResponse(generatedText, enhancedPrompt);
      
      console.log('✅ Local LLM response generated');
      return generatedText;
      
    } catch (error) {
      console.error('❌ Error generating local LLM response:', error);
      throw error;
    }
  }

  private cleanResponse(response: string, originalPrompt: string): string {
    // Remove the original prompt if it's included
    let cleaned = response.replace(originalPrompt, '').trim();
    
    // Remove common artifacts
    cleaned = cleaned.replace(/^(Assistant:|AI:|Bot:)\s*/i, '');
    cleaned = cleaned.replace(/^I'll help you with that\.\s*/i, '');
    
    // Stop at natural break points
    const stopSequences = ['\nUser:', '\nHuman:', '\n\n', 'Assistant:', 'AI:'];
    for (const stop of stopSequences) {
      const index = cleaned.indexOf(stop);
      if (index !== -1) {
        cleaned = cleaned.substring(0, index);
      }
    }
    
    // Ensure it ends properly
    cleaned = cleaned.trim();
    if (cleaned && !cleaned.match(/[.!?]$/)) {
      // Find the last complete sentence
      const sentences = cleaned.split(/[.!?]/);
      if (sentences.length > 1) {
        sentences.pop(); // Remove incomplete sentence
        cleaned = sentences.join('.') + '.';
      }
    }
    
    return cleaned || "I understand your question, but I'm having trouble generating a complete response right now.";
  }

  isReady(): boolean {
    return this.textGenerator !== null;
  }

  isLoading(): boolean {
    return this.modelLoading;
  }

  // Create a specialized response for XMRT/mining context
  async generateXMRTResponse(input: string, context?: {
    miningStats?: any;
    userContext?: any;
  }): Promise<string> {
    // Create context-aware prompt
    let contextPrompt = `You are Eliza, an AI assistant for XMRT DAO, a decentralized mobile mining ecosystem. `;
    
    if (context?.miningStats) {
      contextPrompt += `Current mining status: ${context.miningStats.hash || 0} H/s hashrate. `;
    }
    
    contextPrompt += `User question: ${input}
    
Please provide a helpful response about XMRT, mining, or blockchain technology.`;

    return this.generateResponse(contextPrompt, {
      maxLength: 200,
      temperature: 0.8,
      topP: 0.9
    });
  }
}

// Export singleton instance
export const localLLMService = LocalLLMService.getInstance();