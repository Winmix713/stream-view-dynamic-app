
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent } = this.props;
      
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} reset={this.handleReset} />;
      }

      return (
        <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
          <Card className="w-full max-w-2xl bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-600 bg-red-900/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">
                  <div className="font-medium mb-2">Application Error</div>
                  <div className="text-sm">
                    {this.state.error?.message || 'An unexpected error occurred'}
                  </div>
                </AlertDescription>
              </Alert>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Error Details:</h4>
                  <pre className="text-xs text-gray-400 overflow-auto max-h-40">
                    {this.state.error?.stack}
                  </pre>
                  <h4 className="text-sm font-medium text-gray-300 mb-2 mt-4">Component Stack:</h4>
                  <pre className="text-xs text-gray-400 overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for adding error boundary to components
export function withErrorBoundary<P extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<{ error: Error; reset: () => void }>
) {
  const WithErrorBoundaryComponent = (props: P) => {
    return (
      <ErrorBoundary fallback={FallbackComponent}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}
