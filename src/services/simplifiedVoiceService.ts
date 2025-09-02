// Simplified Voice Service - Mobile-First Approach
import { mobilePermissionService } from './mobilePermissionService';

export interface VoiceRecognitionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export interface VoiceServiceConfig {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}

export class SimplifiedVoiceService {
  private static recognition: SpeechRecognition | null = null;
  private static isListening = false;
  private static onResultCallback: ((result: VoiceRecognitionResult) => void) | null = null;
  private static onErrorCallback: ((error: string) => void) | null = null;

  static isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  static async initialize(config: VoiceServiceConfig = {}): Promise<{ success: boolean; error?: string }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Speech recognition not supported' };
    }

    try {
      // Ensure mobile permissions are granted
      const permissionResult = await mobilePermissionService.initializeMobileAudio();
      if (!permissionResult.success) {
        return { success: false, error: permissionResult.error };
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Configure recognition
      this.recognition.continuous = config.continuous ?? false;
      this.recognition.interimResults = config.interimResults ?? true;
      this.recognition.lang = config.language ?? 'en-US';
      // Note: maxAlternatives is not widely supported, skip it

      // Set up event handlers
      this.recognition.onstart = () => {
        console.log('🎤 Voice recognition started');
        this.isListening = true;
      };

      this.recognition.onresult = (event) => {
        if (!this.onResultCallback) return;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0.8;
          
          this.onResultCallback({
            text: transcript,
            confidence,
            isFinal: result.isFinal
          });
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        this.isListening = false;
        
        let errorMessage = 'Voice recognition error';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone permission denied';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected';
            break;
          case 'network':
            errorMessage = 'Network error - check internet connection';
            break;
          case 'audio-capture':
            errorMessage = 'Audio capture failed';
            break;
        }

        if (this.onErrorCallback) {
          this.onErrorCallback(errorMessage);
        }
      };

      this.recognition.onend = () => {
        console.log('🎤 Voice recognition ended');
        this.isListening = false;
      };

      return { success: true };
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      return { success: false, error: 'Failed to initialize voice recognition' };
    }
  }

  static async startListening(
    onResult: (result: VoiceRecognitionResult) => void,
    onError?: (error: string) => void
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.recognition) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return initResult;
      }
    }

    if (this.isListening) {
      return { success: false, error: 'Already listening' };
    }

    try {
      this.onResultCallback = onResult;
      this.onErrorCallback = onError || null;
      
      this.recognition!.start();
      return { success: true };
    } catch (error) {
      console.error('Failed to start listening:', error);
      return { success: false, error: 'Failed to start voice recognition' };
    }
  }

  static stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    this.isListening = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
  }

  static isCurrentlyListening(): boolean {
    return this.isListening;
  }

  static getStatus(): {
    supported: boolean;
    listening: boolean;
    mobile: boolean;
    permissionGranted: boolean;
  } {
    const permissionStatus = mobilePermissionService.getStatus();
    
    return {
      supported: this.isSupported(),
      listening: this.isListening,
      mobile: permissionStatus.isMobile,
      permissionGranted: permissionStatus.microphone === 'granted'
    };
  }

  static cleanup(): void {
    this.stopListening();
    this.recognition = null;
    mobilePermissionService.cleanup();
  }
}

// Global cleanup
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    SimplifiedVoiceService.cleanup();
  });
}