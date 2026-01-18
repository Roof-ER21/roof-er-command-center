import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ApiErrorProps {
  error: Error | string;
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
  variant?: 'default' | 'inline' | 'toast';
}

export function ApiError({
  error,
  onRetry,
  onGoHome,
  className,
  variant = 'default',
}: ApiErrorProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const isNetworkError =
    errorMessage.toLowerCase().includes('network') ||
    errorMessage.toLowerCase().includes('fetch');
  const isAuthError =
    errorMessage.toLowerCase().includes('unauthorized') ||
    errorMessage.toLowerCase().includes('authentication');

  // Inline variant for small error messages
  if (variant === 'inline') {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{errorMessage}</span>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Default card variant
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">
              {isNetworkError && 'Connection Error'}
              {isAuthError && 'Authentication Error'}
              {!isNetworkError && !isAuthError && 'Something went wrong'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {errorMessage}
            </p>

            {/* Helpful suggestions */}
            {isNetworkError && (
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">Troubleshooting tips:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Check your internet connection</li>
                  <li>Verify the server is running</li>
                  <li>Try refreshing the page</li>
                </ul>
              </div>
            )}

            {isAuthError && (
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">Authentication issue:</p>
                <p className="text-xs">
                  Your session may have expired. Please log in again.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              {onRetry && (
                <Button onClick={onRetry} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              {onGoHome && (
                <Button onClick={onGoHome} variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              )}
              {isAuthError && (
                <Button
                  onClick={() => (window.location.href = '/login')}
                  variant="outline"
                  size="sm"
                >
                  Log In Again
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Technical details for development */}
        {process.env.NODE_ENV === 'development' && error instanceof Error && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              View technical details
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </Card>
  );
}

// Specialized variants
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ApiError
      error="Unable to connect to the server. Please check your internet connection."
      onRetry={onRetry}
    />
  );
}

export function NotFoundError({ onGoHome }: { onGoHome?: () => void }) {
  return (
    <ApiError
      error="The requested resource was not found."
      onGoHome={onGoHome}
    />
  );
}

export function UnauthorizedError() {
  return (
    <ApiError error="You are not authorized to access this resource. Please log in again." />
  );
}

export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ApiError
      error="The server encountered an error. Please try again later."
      onRetry={onRetry}
    />
  );
}
