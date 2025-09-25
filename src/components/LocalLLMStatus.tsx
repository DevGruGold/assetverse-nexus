import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Download, CheckCircle, Loader2 } from 'lucide-react';
import { localLLMService } from '@/services/localLLMService';

export const LocalLLMStatus: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = () => {
    setIsReady(localLLMService.isReady());
    setIsLoading(localLLMService.isLoading());
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
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

        <div className="text-xs text-muted-foreground">
          {isReady ? (
            "Local AI model loaded successfully. No API keys required!"
          ) : isLoading ? (
            "Downloading and initializing DistilGPT-2 model..."
          ) : (
            "Initialize local AI for offline responses."
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