
/**
 * Enhanced Error Handler with React Hooks Support
 * Fixed for Vite React SWC plugin compatibility
 */

import React from 'react';

export interface ErrorInfo {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
  step?: string;
}

export class FigmaStepsError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly step?: string;
  public readonly timestamp: Date;

  constructor(code: string, message: string, details?: unknown, step?: string) {
    super(message);
    this.name = 'FigmaStepsError';
    this.code = code;
    this.details = details;
    this.step = step;
    this.timestamp = new Date();
  }
}

type ErrorCallback = (error: Error) => void;

export class ErrorHandler {
  private static instance: ErrorHandler | null = null;
  private errorLog: ErrorInfo[] = [];
  private errorBoundaryCallbacks = new Set<ErrorCallback>();

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): ErrorHandler {
    if (ErrorHandler.instance === null) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public registerErrorBoundary(callback: ErrorCallback): () => void {
    this.errorBoundaryCallbacks.add(callback);
    return () => {
      this.errorBoundaryCallbacks.delete(callback);
    };
  }

  public handleError(error: Error | FigmaStepsError, step?: string): string {
    const errorInfo: ErrorInfo = {
      code: error instanceof FigmaStepsError ? error.code : 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      details: error instanceof FigmaStepsError ? error.details : undefined,
      timestamp: new Date(),
      step: step || (error instanceof FigmaStepsError ? error.step : undefined)
    };

    this.errorLog.push(errorInfo);
    console.error('FigmaSteps Error:', errorInfo);

    this.errorBoundaryCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error boundary callback failed:', callbackError);
      }
    });

    return this.getUserFriendlyMessage(errorInfo);
  }

  public handleHookError(error: Error, componentName: string, hookName: string): string {
    const enhancedError = new FigmaStepsError(
      'REACT_HOOK_ERROR',
      `Hook error in ${componentName}: ${error.message || 'Unknown hook error'}`,
      { componentName, hookName, originalError: error.message || 'Unknown error' }
    );

    return this.handleError(enhancedError);
  }

  private getUserFriendlyMessage(errorInfo: ErrorInfo): string {
    const code = errorInfo.code || 'UNKNOWN_ERROR';
    
    const messages: Record<string, string> = {
      'REACT_HOOK_ERROR': 'A component error occurred. Please refresh the page and try again.',
      'FIGMA_CONNECTION_FAILED': 'Failed to connect to Figma. Please check your URL and access token.',
      'INVALID_FIGMA_URL': 'Invalid Figma URL format. Please provide a valid Figma file URL.',
      'ACCESS_TOKEN_INVALID': 'Invalid access token. Please check your Figma Personal Access Token.',
      'SVG_CONVERSION_FAILED': 'Failed to convert SVG to TSX. Please check your SVG code format.',
      'CSS_VALIDATION_FAILED': 'CSS validation failed. Please check your CSS syntax.',
      'CODE_GENERATION_FAILED': 'Code generation failed. Please try again or contact support.',
      'NETWORK_ERROR': 'Network error occurred. Please check your internet connection.',
      'LARGE_FILE_ERROR': 'File is too large to process. Please use a smaller file or optimize your content.',
      'MEMORY_ERROR': 'Insufficient memory to process the file. Please try with a smaller file.'
    };

    return messages[code] || errorInfo.message || 'An unexpected error occurred. Please try again.';
  }

  public getErrorLog(): ErrorInfo[] {
    return [...this.errorLog];
  }

  public clearErrorLog(): void {
    this.errorLog = [];
  }

  public static createFigmaConnectionError(message: string, details?: unknown): FigmaStepsError {
    return new FigmaStepsError('FIGMA_CONNECTION_FAILED', message, details, 'step1');
  }

  public static createSvgConversionError(message: string, details?: unknown): FigmaStepsError {
    return new FigmaStepsError('SVG_CONVERSION_FAILED', message, details, 'step2');
  }

  public static createCssValidationError(message: string, details?: unknown): FigmaStepsError {
    return new FigmaStepsError('CSS_VALIDATION_FAILED', message, details, 'step3');
  }

  public static createCodeGenerationError(message: string, details?: unknown): FigmaStepsError {
    return new FigmaStepsError('CODE_GENERATION_FAILED', message, details, 'step4');
  }

  public static createLargeFileError(message: string, details?: unknown): FigmaStepsError {
    return new FigmaStepsError('LARGE_FILE_ERROR', message, details);
  }

  public static createMemoryError(message: string, details?: unknown): FigmaStepsError {
    return new FigmaStepsError('MEMORY_ERROR', message, details);
  }

  public static createReactHookError(message: string, componentName: string, hookName: string): FigmaStepsError {
    return new FigmaStepsError('REACT_HOOK_ERROR', message, { componentName, hookName });
  }
}

// Error Boundary Component (simplified for SWC compatibility)
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    errorHandler.handleError(error, 'component');
    console.error('Component Error Boundary:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return React.createElement(FallbackComponent, {
          error: this.state.error,
          reset: this.handleReset
        });
      }

      const errorMessage = this.state.error.message || 'An unexpected error occurred';

      return React.createElement('div', {
        className: 'p-4 bg-red-900/20 border border-red-600 rounded-lg'
      }, [
        React.createElement('h3', {
          key: 'title',
          className: 'text-red-400 font-medium mb-2'
        }, 'Something went wrong'),
        React.createElement('p', {
          key: 'message',
          className: 'text-red-300 text-sm mb-3'
        }, errorMessage),
        React.createElement('button', {
          key: 'button',
          onClick: this.handleReset,
          className: 'px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700',
          type: 'button'
        }, 'Try Again')
      ]);
    }

    return this.props.children;
  }
}

// HOC for error boundary (simplified)
export function withErrorBoundary<P extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<{ error: Error; reset: () => void }>
) {
  const WithErrorBoundaryComponent = (props: P) => {
    return React.createElement(ErrorBoundary, {
      fallback: FallbackComponent,
      children: React.createElement(WrappedComponent, props)
    });
  };

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

export const errorHandler = ErrorHandler.getInstance();
