import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export interface SearchResult {
  id: string | number;
  type: 'employee' | 'sales_rep' | 'candidate' | 'training_module' | 'document';
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, any>;
  url?: string;
}

export interface GroupedSearchResults {
  employees: SearchResult[];
  salesReps: SearchResult[];
  candidates: SearchResult[];
  trainingModules: SearchResult[];
  documents: SearchResult[];
}

export interface UseSearchOptions {
  debounceMs?: number;
  minLength?: number;
  modules?: Array<'hr' | 'leaderboard' | 'training' | 'field'>;
}

export function useSearch(options: UseSearchOptions = {}) {
  const {
    debounceMs = 300,
    minLength = 2,
    modules = ['hr', 'leaderboard', 'training', 'field']
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GroupedSearchResults>({
    employees: [],
    salesReps: [],
    candidates: [],
    trainingModules: [],
    documents: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, debounceMs);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minLength) {
      setResults({
        employees: [],
        salesReps: [],
        candidates: [],
        trainingModules: [],
        documents: [],
      });
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        modules: modules.join(','),
      });

      const response = await fetch(`/api/search?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults({
        employees: [],
        salesReps: [],
        candidates: [],
        trainingModules: [],
        documents: [],
      });
    } finally {
      setIsSearching(false);
    }
  }, [minLength, modules]);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults({
      employees: [],
      salesReps: [],
      candidates: [],
      trainingModules: [],
      documents: [],
    });
    setError(null);
  }, []);

  const totalResults = Object.values(results).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    clearSearch,
    totalResults,
  };
}
