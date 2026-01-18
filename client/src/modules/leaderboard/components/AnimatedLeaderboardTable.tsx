import { useState, useEffect, useRef } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AnimatedRankRow } from './AnimatedRankRow';
import type { SalesRep } from '@shared/schema';

interface AnimatedLeaderboardTableProps {
  salesReps: SalesRep[];
  className?: string;
  onRepClick?: (salesRep: SalesRep) => void;
}

interface RankChange {
  salesRepId: number;
  oldRank: number;
  newRank: number;
  direction: 'up' | 'down';
}

export function AnimatedLeaderboardTable({ salesReps, className, onRepClick }: AnimatedLeaderboardTableProps) {
  const [previousRanks, setPreviousRanks] = useState<Map<number, number>>(new Map());
  const [rankChanges, setRankChanges] = useState<RankChange[]>([]);
  const [activeRankChanges, setActiveRankChanges] = useState<Set<number>>(new Set());
  const isFirstRender = useRef(true);

  // Get current year for display
  const currentYear = new Date().getFullYear();

  // Create rank mapping for current data
  const currentRanks = new Map<number, number>();
  salesReps.forEach((rep, index) => {
    currentRanks.set(rep.id, index + 1);
  });

  useEffect(() => {
    if (isFirstRender.current) {
      // Initialize previous ranks on first render
      setPreviousRanks(new Map(currentRanks));
      isFirstRender.current = false;
      return;
    }

    // Detect rank changes
    const changes: RankChange[] = [];

    currentRanks.forEach((newRank, salesRepId) => {
      const oldRank = previousRanks.get(salesRepId);
      if (oldRank && oldRank !== newRank) {
        const change: RankChange = {
          salesRepId,
          oldRank,
          newRank,
          direction: newRank < oldRank ? 'up' : 'down'
        };
        changes.push(change);
      }
    });

    if (changes.length > 0) {
      setRankChanges(changes);
      setActiveRankChanges(new Set(changes.map(c => c.salesRepId)));

      // Clear active changes after animation
      setTimeout(() => {
        setActiveRankChanges(new Set());
        setRankChanges([]);
      }, 3000);
    }

    // Update previous ranks
    setPreviousRanks(new Map(currentRanks));
  }, [salesReps]);

  const getRankChange = (salesRepId: number): RankChange | undefined => {
    return rankChanges.find(change => change.salesRepId === salesRepId);
  };

  const handleRankChangeComplete = (salesRepId: number) => {
    setActiveRankChanges(prev => {
      const newSet = new Set(prev);
      newSet.delete(salesRepId);
      return newSet;
    });
  };

  if (salesReps.length === 0) {
    return (
      <div className={className}>
        <div className="text-center py-12 text-muted-foreground">
          <p>No sales representatives found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center w-16">Rank</TableHead>
            <TableHead>Sales Rep</TableHead>
            <TableHead className="text-center">Progress & Trends</TableHead>
            <TableHead className="text-center">{currentYear} Revenue</TableHead>
            <TableHead className="text-center">All-Time Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {salesReps.map((salesRep, index) => {
            const rankChange = getRankChange(salesRep.id);
            const isChanging = activeRankChanges.has(salesRep.id);

            return (
              <AnimatedRankRow
                key={salesRep.id}
                salesRep={salesRep}
                currentRank={index + 1}
                previousRank={rankChange?.oldRank}
                isRankChanging={isChanging}
                onRankChangeComplete={() => handleRankChangeComplete(salesRep.id)}
                onClick={onRepClick}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
