import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  text?: string;
  fullPage?: boolean;
  inline?: boolean;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const textSizeClasses: Record<SpinnerSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export function LoadingSpinner({
  size = 'md',
  className,
  text,
  fullPage = false,
  inline = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        'flex items-center gap-3',
        inline ? 'inline-flex' : 'flex-col',
        className
      )}
    >
      <Loader2
        className={cn(
          'animate-spin text-primary',
          sizeClasses[size]
        )}
      />
      {text && (
        <p
          className={cn(
            'text-muted-foreground font-medium',
            textSizeClasses[size]
          )}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}

// Specialized variants for common use cases
export function PageLoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function InlineLoadingSpinner({ text }: { text?: string }) {
  return <LoadingSpinner size="sm" inline text={text} />;
}

export function FullPageLoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return <LoadingSpinner size="xl" fullPage text={text} />;
}
