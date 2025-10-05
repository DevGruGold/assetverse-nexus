import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, Download, CheckCircle, Loader2 } from 'lucide-react';
import { localLLMService } from '@/services/localLLMService';

export const LocalLLMStatus: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const checkStatus = () => {
    setIsReady(localLLMService.isReady());
    setIsLoading(localLLMService.isLoading());
    setProgress(localLLMService.getProgress());
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 500);
    const unsubscribe = localLLMService.onProgress(setProgress);
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const initializeModel = async () => {
    try {
      setError(null);
      await localLLMService.initialize();
      checkStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize model');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4" />
          Local AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          {isLoading ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading...
            </Badge>
          ) : isReady ? (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Ready
            </Badge>
          ) : (
            <Badge variant="outline">
              Not Initialized
            </Badge>
          )}
        </div>

        {error && (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        {isLoading && progress > 0 && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">{progress}%</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {isReady ? (
            "Local AI model loaded successfully. Works offline on any device!"
          ) : isLoading ? (
            "Downloading DistilGPT-2 model (~80MB). Works on mobile via WASM..."
          ) : (
            "Initialize local AI for offline responses on any device."
          )}
        </div>

        {!isReady && !isLoading && (
          <Button 
            onClick={initializeModel}
            size="sm" 
            className="w-full"
            disabled={isLoading}
          >
            <Download className="h-3 w-3 mr-1" />
            Initialize Local AI
          </Button>
        )}
      </CardContent>
    </Card>
  );
};