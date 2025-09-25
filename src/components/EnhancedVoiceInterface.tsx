import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Mic, MicOff, Volume2, VolumeX, Brain, Heart } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { humeEVIService } from '@/services/humeEVIService';
import { createElevenLabsService, ElevenLabsService } from '@/services/elevenlabsService';
import { UnifiedElizaService } from '@/services/unifiedElizaService';

interface EnhancedVoiceInterfaceProps {
  onTranscript?: (transcript: string, emotions?: any) => void;
  onResponse?: (response: string, emotions?: any) => void;
  className?: string;
  disabled?: boolean;
}

interface EmotionalState {
  dominant: string;
  confidence: number;
  details: { [key: string]: number };
}

export const EnhancedVoiceInterface: React.FC<EnhancedVoiceInterfaceProps> = ({
  onTranscript,
  onResponse,
  className = '',
  disabled = false
}) => {
  const { toast } = useToast();
  
  // Service states
  const [humeService, setHumeService] = useState<any>(null);
  const [elevenLabsService, setElevenLabsService] = useState<any>(null);
  const [servicesReady, setServicesReady] = useState(false);
  
  // Voice interface states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  // Emotional intelligence states
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({
    dominant: 'neutral',
    confidence: 0,
    details: {}
  });
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // Audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('🚀 Initializing enhanced voice services...');
        
        // Initialize Hume EVI for voice processing only
        const hume = humeEVIService();
        if (hume) {
          await hume.initializeVoiceProcessing();
          setHumeService(hume);
          console.log('🧠 Hume EVI initialized for voice processing');
        }
        
        // Initialize ElevenLabs for premium TTS
        const elevenLabs = createElevenLabsService();
        if (elevenLabs) {
          const isAvailable = await elevenLabs.testService();
          if (isAvailable) {
            setElevenLabsService(elevenLabs);
            console.log('🎵 ElevenLabs TTS initialized');
          }
        }
        
        setServicesReady(true);
        
        toast({
          title: "🧠 Enhanced Voice Ready",
          description: "Emotional intelligence and premium voice activated",
        });
        
      } catch (error) {
        console.error('❌ Service initialization failed:', error);
        toast({
          title: "⚠️ Voice Services",
          description: "Some voice features may be limited",
          variant: "destructive"
        });
      }
    };

    initializeServices();
  }, []);

  // Start voice recording with enhanced audio processing
  const startListening = useCallback(async () => {
    if (disabled || isListening) return;

    try {
      console.log('🎤 Starting enhanced voice capture...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioInput(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);

      console.log('✅ Enhanced voice capture started');

    } catch (error) {
      console.error('❌ Failed to start voice capture:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  }, [disabled, isListening]);

  // Stop voice recording
  const stopListening = useCallback(() => {
    if (!isListening) return;

    console.log('🛑 Stopping voice capture...');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsListening(false);
    console.log('✅ Voice capture stopped');
  }, [isListening]);

  // Process audio input with emotional understanding
  const processAudioInput = async (audioBlob: Blob) => {
    if (!servicesReady) return;

    setIsProcessing(true);
    
    try {
      console.log('🧠 Processing audio with emotional intelligence...');

      let transcript = '';
      let emotions = {};
      let response = '';

      // Use Hume for emotional speech-to-text if available
      if (humeService) {
        try {
          const humeResult = await humeService.processAudioInput(audioBlob);
          transcript = humeResult.transcript;
          emotions = humeResult.emotions;
          
          // Update emotional state
          if (emotions && Object.keys(emotions).length > 0) {
            const dominantEmotion = Object.entries(emotions)
              .reduce((a, b) => a[1] > b[1] ? a : b);
            
            setEmotionalState({
              dominant: dominantEmotion[0],
              confidence: dominantEmotion[1] as number,
              details: emotions
            });
          }
          
          console.log('🧠 Emotional analysis:', emotions);
          
        } catch (error) {
          console.warn('⚠️ Hume processing failed, using fallback:', error);
          // Fallback to Web Speech API
          transcript = await fallbackSpeechRecognition(audioBlob);
        }
      } else {
        // Fallback to Web Speech API
        transcript = await fallbackSpeechRecognition(audioBlob);
      }

      if (transcript) {
        setCurrentTranscript(transcript);
        onTranscript?.(transcript, emotions);

        // Generate AI response using UnifiedElizaService (Gemini)
        try {
          console.log('🤖 Generating AI response with Gemini...');
          const result = await UnifiedElizaService.generateResponse(transcript, {
            miningStats: undefined,
            userContext: undefined,
            shouldSpeak: false // Prevent duplication since we handle TTS here
          });
          response = result.response;
          
          // Speak response with emotional context
          if (voiceEnabled && elevenLabsService) {
            setIsSpeaking(true);
            
            // Select voice based on emotional context
            const voiceId = ElevenLabsService.getVoiceForEmotion(emotionalState.dominant);
            
            await elevenLabsService.speakText(response, voiceId, undefined, () => {
              setIsSpeaking(false);
            });
          }
          
        } catch (error) {
          console.error('❌ AI response generation failed:', error);
          response = "I understand what you're saying. How can I help you with XMRT-DAO?";
        }

        onResponse?.(response, emotions);
      }

    } catch (error) {
      console.error('❌ Audio processing failed:', error);
      toast({
        title: "Processing Error",
        description: "Could not process your voice input",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fallback speech recognition using Web Speech API
  const fallbackSpeechRecognition = async (audioBlob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        resolve('');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = () => resolve('');
      recognition.onend = () => resolve('');

      // Note: Web Speech API doesn't directly accept audio blobs
      // This is a simplified fallback - in production, you'd need audio conversion
      recognition.start();
    });
  };

  // Toggle listening state
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Stop speaking immediately
  const stopSpeaking = () => {
    if (elevenLabsService) {
      elevenLabsService.stopSpeaking();
      setIsSpeaking(false);
    }
  };

  // Get emotional color for UI
  const getEmotionalColor = (emotion: string): string => {
    const colorMap: { [key: string]: string } = {
      'joy': 'text-yellow-500',
      'happiness': 'text-yellow-500',
      'sadness': 'text-blue-500',
      'anger': 'text-red-500',
      'fear': 'text-purple-500',
      'surprise': 'text-green-500',
      'confidence': 'text-blue-600',
      'calmness': 'text-green-600',
      'neutral': 'text-gray-500'
    };
    
    return colorMap[emotion.toLowerCase()] || 'text-gray-500';
  };

  return (
    <Card className={`p-6 bg-card/50 backdrop-blur-sm border border-border/50 ${className}`}>
      <div className="space-y-4">
        {/* Service Status */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Brain className="w-4 h-4" />
          <span>Enhanced AI Voice</span>
          {servicesReady && (
            <Badge variant="secondary" className="text-xs">
              {humeService ? 'Emotional' : ''} {elevenLabsService ? 'Premium' : ''}
            </Badge>
          )}
        </div>

        {/* Emotional State Display */}
        {emotionalState.confidence > 0.3 && (
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
            <Heart className={`w-4 h-4 ${getEmotionalColor(emotionalState.dominant)}`} />
            <span className="text-sm">
              Emotion: <span className={getEmotionalColor(emotionalState.dominant)}>
                {emotionalState.dominant}
              </span>
              <span className="text-muted-foreground ml-1">
                ({Math.round(emotionalState.confidence * 100)}%)
              </span>
            </span>
          </div>
        )}

        {/* Voice Controls */}
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleListening}
            disabled={disabled || isProcessing}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className="flex-1"
          >
            {isListening ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Button>

          <Button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            variant="outline"
            size="lg"
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>

          {isSpeaking && (
            <Button
              onClick={stopSpeaking}
              variant="outline"
              size="lg"
            >
              Stop
            </Button>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex gap-2">
          {isListening && (
            <Badge variant="default" className="animate-pulse">
              <Mic className="w-3 h-3 mr-1" />
              Listening
            </Badge>
          )}
          {isProcessing && (
            <Badge variant="secondary" className="animate-pulse">
              <Brain className="w-3 h-3 mr-1" />
              Processing
            </Badge>
          )}
          {isSpeaking && (
            <Badge variant="outline" className="animate-pulse">
              <Volume2 className="w-3 h-3 mr-1" />
              Speaking
            </Badge>
          )}
        </div>

        {/* Current Transcript */}
        {currentTranscript && (
          <div className="p-3 bg-muted/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">You said:</div>
            <div className="text-sm">{currentTranscript}</div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EnhancedVoiceInterface;