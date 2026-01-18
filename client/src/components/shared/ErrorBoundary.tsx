import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to logging service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleReportIssue = () => {
    const errorDetails = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Open email client with pre-filled error details
    const subject = encodeURIComponent('Roof ER Command Center - Error Report');
    const body = encodeURIComponent(
      `Error Report\n\nTimestamp: ${errorDetails.timestamp}\n\nError Message: ${errorDetails.message}\n\nPlease describe what you were doing when this error occurred:\n\n\n\n--- Technical Details ---\n${JSON.stringify(errorDetails, null, 2)}`
    );
    window.location.href = `mailto:support@roofer.com?subject=${subject}&body=${body}`;
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
          <Card className="max-w-2xl w-full p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Oops! Something went wrong
                </h1>
                <p className="text-muted-foreground">
                  Don't worry, we're here to help you get back on track.
                </p>
              </div>
            </div>

            {/* Error message for development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-mono text-sm text-destructive mb-2">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      View stack trace
                    </summary>
                    <pre className="mt-2 text-xs overflow-x-auto p-2 bg-background rounded">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You can try one of the following options:
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>

                <Button
                  onClick={this.handleReportIssue}
                  variant="ghost"
                  className="w-full"
                >
                  Report Issue
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                If this problem persists, please contact support with the error
                details above.
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
