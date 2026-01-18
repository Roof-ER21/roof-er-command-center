import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Users,
  Trophy,
  GraduationCap,
  FileText,
  Clock,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSearch, type SearchResult } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = 'roof-er-recent-searches';
const MAX_RECENT_SEARCHES = 5;

const moduleIcons = {
  employee: Users,
  sales_rep: Trophy,
  candidate: Users,
  training_module: GraduationCap,
  document: FileText,
};

const moduleColors = {
  employee: 'text-purple-600',
  sales_rep: 'text-green-600',
  candidate: 'text-blue-600',
  training_module: 'text-amber-600',
  document: 'text-sky-600',
};

const moduleBadgeColors = {
  employee: 'bg-purple-100 text-purple-700',
  sales_rep: 'bg-green-100 text-green-700',
  candidate: 'bg-blue-100 text-blue-700',
  training_module: 'bg-amber-100 text-amber-700',
  document: 'bg-sky-100 text-sky-700',
};

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { query, setQuery, results, isSearching, clearSearch, totalResults } = useSearch();

  // Load recent searches from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load recent searches:', err);
      }

      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Save to recent searches
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setRecentSearches(prev => {
      const updated = [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save recent search:', err);
      }
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (err) {
      console.error('Failed to clear recent searches:', err);
    }
  }, []);

  // Flatten results for keyboard navigation
  const flatResults = [
    ...results.employees,
    ...results.salesReps,
    ...results.candidates,
    ...results.trainingModules,
    ...results.documents,
  ];

  // Handle result selection
  const handleSelectResult = useCallback((result: SearchResult) => {
    saveRecentSearch(query);

    if (result.url) {
      navigate(result.url);
    } else {
      // Default navigation based on type
      switch (result.type) {
        case 'employee':
          navigate(`/hr/employees/${result.id}`);
          break;
        case 'sales_rep':
          navigate(`/leaderboard?rep=${result.id}`);
          break;
        case 'candidate':
          navigate(`/hr/recruiting/${result.id}`);
          break;
        case 'training_module':
          navigate(`/training/modules/${result.id}`);
          break;
        case 'document':
          navigate(`/field/documents/${result.id}`);
          break;
      }
    }

    onClose();
    clearSearch();
  }, [query, navigate, onClose, clearSearch, saveRecentSearch]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatResults[selectedIndex]) {
            handleSelectResult(flatResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatResults, selectedIndex, handleSelectResult, onClose]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleClose = () => {
    onClose();
    clearSearch();
    setSelectedIndex(0);
  };

  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    inputRef.current?.focus();
  };

  const renderResultGroup = (title: string, items: SearchResult[], startIndex: number) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </div>
        <div className="space-y-1">
          {items.map((result, index) => {
            const Icon = moduleIcons[result.type];
            const globalIndex = startIndex + index;
            const isSelected = globalIndex === selectedIndex;

            return (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelectResult(result)}
                className={cn(
                  "w-full px-3 py-2 flex items-start gap-3 rounded-md text-left transition-colors",
                  isSelected ? "bg-accent" : "hover:bg-accent/50"
                )}
              >
                <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", moduleColors[result.type])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm truncate">{result.title}</span>
                    <Badge variant="secondary" className={cn("text-xs", moduleBadgeColors[result.type])}>
                      {result.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  {result.subtitle && (
                    <div className="text-xs text-muted-foreground truncate">
                      {result.subtitle}
                    </div>
                  )}
                  {result.description && (
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {result.description}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search employees, sales reps, candidates, training..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-base"
          />
          {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery('')}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!query && recentSearches.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Recent Searches
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRecentSearches}
                  className="h-auto py-1 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((recentQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(recentQuery)}
                    className="w-full px-3 py-2 flex items-center gap-3 rounded-md text-left hover:bg-accent/50 transition-colors"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{recentQuery}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!query && recentSearches.length === 0 && (
            <div className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Search across all modules
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for employees, sales reps, or training modules
              </p>
            </div>
          )}

          {query && isSearching && (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Searching...</p>
            </div>
          )}

          {query && !isSearching && totalResults === 0 && (
            <div className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm font-medium mb-1">No results found</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search query
              </p>
            </div>
          )}

          {query && !isSearching && totalResults > 0 && (
            <>
              {renderResultGroup('Employees', results.employees, 0)}
              {renderResultGroup('Sales Reps', results.salesReps, results.employees.length)}
              {renderResultGroup('Candidates', results.candidates, results.employees.length + results.salesReps.length)}
              {renderResultGroup('Training Modules', results.trainingModules, results.employees.length + results.salesReps.length + results.candidates.length)}
              {renderResultGroup('Documents', results.documents, results.employees.length + results.salesReps.length + results.candidates.length + results.trainingModules.length)}
            </>
          )}
        </div>

        {/* Footer with keyboard shortcuts */}
        <div className="flex items-center gap-4 px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-background border">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-background border">Enter</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-background border">Esc</kbd>
            <span>Close</span>
          </div>
          {totalResults > 0 && (
            <div className="ml-auto flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{totalResults} result{totalResults === 1 ? '' : 's'}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
