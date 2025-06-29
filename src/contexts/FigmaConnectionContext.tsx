
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { figmaApiService } from '@/services/figma-api-service';
import { enhancedCodeGenerationEngine } from '@/services/enhanced-code-generation-engine';

// Types
export interface FigmaConnectionState {
  figmaUrl: string;
  accessToken: string;
  figmaData: any;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

type FigmaConnectionAction =
  | { type: 'SET_URL'; payload: string }
  | { type: 'SET_TOKEN'; payload: string }
  | { type: 'SET_STATUS'; payload: FigmaConnectionState['status'] }
  | { type: 'SET_DATA'; payload: any }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

const initialState: FigmaConnectionState = {
  figmaUrl: 'https://www.figma.com/design/...',
  accessToken: '',
  figmaData: null,
  status: 'idle'
};

function figmaConnectionReducer(state: FigmaConnectionState, action: FigmaConnectionAction): FigmaConnectionState {
  switch (action.type) {
    case 'SET_URL':
      return { ...state, figmaUrl: action.payload };
    case 'SET_TOKEN':
      return { ...state, accessToken: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_DATA':
      return { ...state, figmaData: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, status: 'error' };
    case 'CLEAR_ERROR':
      return { ...state, error: undefined };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface FigmaConnectionContextType {
  state: FigmaConnectionState;
  actions: {
    setUrl: (url: string) => void;
    setToken: (token: string) => void;
    setStatus: (status: FigmaConnectionState['status']) => void;
    setData: (data: any) => void;
    setError: (error: string) => void;
    clearError: () => void;
    reset: () => void;
    connectToFigma: () => Promise<void>;
  };
}

const FigmaConnectionContext = createContext<FigmaConnectionContextType | undefined>(undefined);

export const FigmaConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(figmaConnectionReducer, initialState);

  const setUrl = useCallback((url: string) => {
    dispatch({ type: 'SET_URL', payload: url });
  }, []);

  const setToken = useCallback((token: string) => {
    dispatch({ type: 'SET_TOKEN', payload: token });
  }, []);

  const setStatus = useCallback((status: FigmaConnectionState['status']) => {
    dispatch({ type: 'SET_STATUS', payload: status });
  }, []);

  const setData = useCallback((data: any) => {
    dispatch({ type: 'SET_DATA', payload: data });
  }, []);

  const setError = useCallback((error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const connectToFigma = useCallback(async () => {
    const { figmaUrl, accessToken } = state;
    
    if (!figmaUrl.trim() || !accessToken.trim()) {
      setError('Please provide both Figma URL and Access Token');
      return;
    }

    setStatus('loading');
    clearError();

    try {
      const validation = await figmaApiService.validateFigmaUrl(figmaUrl);
      if (!validation.valid || !validation.fileId) {
        throw new Error(validation.error || 'Invalid Figma URL');
      }

      const figmaFile = await figmaApiService.fetchFigmaFile(validation.fileId, accessToken);
      const metadata = await figmaApiService.getFileMetadata(validation.fileId, accessToken);
      const components = await figmaApiService.getFileComponents(validation.fileId, accessToken);
      const styles = await figmaApiService.getFileStyles(validation.fileId, accessToken);

      const completeData = {
        file: figmaFile,
        metadata,
        components,
        styles,
        fileId: validation.fileId,
        extractedAt: new Date().toISOString()
      };

      setData(completeData);
      setStatus('success');

    } catch (error) {
      console.error('Connection error:', error);
      let errorMessage = 'Connection failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes('Access denied') || error.message.includes('403')) {
          errorMessage = 'Access denied. Please provide a valid Figma Personal Access Token.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Figma file not found. Please check if the file exists and the URL is correct.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Invalid or expired access token.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        }
      }
      
      setError(errorMessage);
    }
  }, [state.figmaUrl, state.accessToken, setStatus, setData, setError, clearError]);

  const contextValue: FigmaConnectionContextType = {
    state,
    actions: {
      setUrl,
      setToken,
      setStatus,
      setData,
      setError,
      clearError,
      reset,
      connectToFigma
    }
  };

  return (
    <FigmaConnectionContext.Provider value={contextValue}>
      {children}
    </FigmaConnectionContext.Provider>
  );
};

export const useFigmaConnection = () => {
  const context = useContext(FigmaConnectionContext);
  if (context === undefined) {
    throw new Error('useFigmaConnection must be used within a FigmaConnectionProvider');
  }
  return context;
};
