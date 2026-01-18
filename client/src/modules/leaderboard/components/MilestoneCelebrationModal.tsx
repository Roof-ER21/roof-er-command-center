import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { SalesRep } from "@shared/schema";

export interface Milestone {
  id: string;
  type: 'revenue' | 'signups' | 'bonus_tier' | 'goal_achieved';
  title: string;
  description: string;
  value: string | number;
  emoji: string;
  color: string;
  achievedAt: Date;
  salesRep: SalesRep;
}

interface MilestoneCelebrationModalProps {
  milestone: Milestone | null;
  onClose: () => void;
}

export function MilestoneCelebrationModal({ milestone, onClose }: MilestoneCelebrationModalProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (milestone) {
      setShowModal(true);

      // Fire confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#dc2626', '#16a34a', '#2563eb', '#ca8a04', '#9333ea'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#dc2626', '#16a34a', '#2563eb', '#ca8a04', '#9333ea'],
        });
      }, 250);

      return () => clearInterval(interval);
    } else {
      setShowModal(false);
    }
  }, [milestone]);

  const handleClose = () => {
    setShowModal(false);
    onClose();
  };

  if (!milestone) return null;

  const getMilestoneIcon = () => {
    switch (milestone.type) {
      case 'revenue':
        return (
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-4xl animate-bounce">
            💰
          </div>
        );
      case 'signups':
        return (
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-4xl animate-bounce">
            🎯
          </div>
        );
      case 'bonus_tier':
        return (
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-4xl animate-bounce">
            {milestone.emoji}
          </div>
        );
      case 'goal_achieved':
        return (
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-4xl animate-bounce">
            🏆
          </div>
        );
      default:
        return (
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-4xl animate-bounce">
            ⭐
          </div>
        );
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-2 border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            🎉 Milestone Achieved! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-6">
          {/* Achievement Icon */}
          <div className="relative">
            {getMilestoneIcon()}
            <div className="absolute -inset-4 animate-ping">
              <div className="w-28 h-28 border-4 border-primary/30 rounded-full"></div>
            </div>
          </div>

          {/* Sales Rep Info */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Avatar className="w-12 h-12 border-2 border-primary">
                <AvatarImage
                  src={milestone.salesRep.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(milestone.salesRep.name)}&background=dc2626&color=fff`}
                  alt={milestone.salesRep.name}
                />
                <AvatarFallback>
                  {milestone.salesRep.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold">{milestone.salesRep.name}</h3>
                <p className="text-muted-foreground">{milestone.salesRep.team}</p>
              </div>
            </div>
          </div>

          {/* Milestone Details */}
          <div className="text-center space-y-3">
            <Badge className={`${milestone.color} text-white text-lg px-4 py-2`}>
              {milestone.title}
            </Badge>
            <p className="text-muted-foreground text-lg">{milestone.description}</p>

            {/* Achievement Value */}
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="text-3xl font-bold text-primary mb-1">
                {typeof milestone.value === 'number'
                  ? milestone.type === 'revenue'
                    ? formatCurrency(milestone.value)
                    : formatNumber(milestone.value)
                  : milestone.value
                }
              </div>
              <div className="text-sm text-muted-foreground">
                Achieved on {milestone.achievedAt.toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleClose}
              className="bg-primary hover:bg-primary/90"
            >
              🎊 Awesome!
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Share functionality could be added here
                handleClose();
              }}
              className="border-primary hover:bg-primary hover:text-primary-foreground"
            >
              📢 Share Achievement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Milestone detection helper functions
export const detectMilestones = (
  currentRep: SalesRep,
  previousRep?: SalesRep
): Milestone[] => {
  const milestones: Milestone[] = [];
  const now = new Date();

  if (!previousRep) return milestones;

  // Revenue milestones
  const currentRevenue = parseFloat(String(currentRep.monthlyRevenue).replace(/[$,]/g, ''));
  const previousRevenue = parseFloat(String(previousRep.monthlyRevenue).replace(/[$,]/g, ''));

  const revenueMilestones = [10000, 25000, 50000, 75000, 100000];
  revenueMilestones.forEach(threshold => {
    if (currentRevenue >= threshold && previousRevenue < threshold) {
      milestones.push({
        id: `revenue_${threshold}_${currentRep.id}`,
        type: 'revenue',
        title: `$${threshold.toLocaleString()} Revenue Milestone`,
        description: `Reached $${threshold.toLocaleString()} in monthly revenue!`,
        value: currentRevenue,
        emoji: '💰',
        color: 'bg-green-500',
        achievedAt: now,
        salesRep: currentRep
      });
    }
  });

  // Signup milestones
  const currentSignups = parseFloat(String(currentRep.monthlySignups));
  const previousSignups = parseFloat(String(previousRep.monthlySignups));

  const signupMilestones = [10, 15, 20, 25, 30, 35, 40];
  signupMilestones.forEach(threshold => {
    if (currentSignups >= threshold && previousSignups < threshold) {
      milestones.push({
        id: `signups_${threshold}_${currentRep.id}`,
        type: 'signups',
        title: `${threshold} Signups Milestone`,
        description: `Achieved ${threshold} signups this month!`,
        value: currentSignups,
        emoji: '🎯',
        color: 'bg-blue-500',
        achievedAt: now,
        salesRep: currentRep
      });
    }
  });

  // Bonus tier milestones
  const getBonusTier = (signups: number) => {
    if (signups >= 40) return { tier: 6, emoji: '💯' };
    if (signups >= 35) return { tier: 5, emoji: '👑' };
    if (signups >= 30) return { tier: 4, emoji: '🏆' };
    if (signups >= 25) return { tier: 3, emoji: '💎' };
    if (signups >= 20) return { tier: 2, emoji: '💰' };
    if (signups >= 15) return { tier: 1, emoji: '🪙' };
    return null;
  };

  const currentTier = getBonusTier(currentSignups);
  const previousTier = getBonusTier(previousSignups);

  if (currentTier && (!previousTier || currentTier.tier > previousTier.tier)) {
    milestones.push({
      id: `bonus_tier_${currentTier.tier}_${currentRep.id}`,
      type: 'bonus_tier',
      title: `Bonus Tier ${currentTier.tier} Unlocked!`,
      description: `Advanced to Tier ${currentTier.tier} bonus level!`,
      value: currentTier.emoji,
      emoji: currentTier.emoji,
      color: 'bg-purple-500',
      achievedAt: now,
      salesRep: currentRep
    });
  }

  // Goal achievement milestone
  const currentProgress = parseFloat(String(currentRep.goalProgress));
  const previousProgress = parseFloat(String(previousRep.goalProgress));

  if (currentProgress >= 100 && previousProgress < 100) {
    milestones.push({
      id: `goal_achieved_${currentRep.id}`,
      type: 'goal_achieved',
      title: 'Monthly Goal Achieved!',
      description: 'Congratulations on reaching your monthly target!',
      value: `${Math.round(currentProgress)}%`,
      emoji: '🏆',
      color: 'bg-primary',
      achievedAt: now,
      salesRep: currentRep
    });
  }

  return milestones;
};
