import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { RankHistoryChart } from './RankHistoryChart';
import {
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Award,
  User,
  Clock,
  ChevronUp,
  ChevronDown,
  Star,
  Mail,
} from 'lucide-react';

interface RepDetailModalProps {
  repId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FullProfileData {
  rep: {
    id: number;
    name: string;
    email: string;
    team: string;
    title: string;
    avatar: string | null;
    monthlySignups: string;
    yearlySignups: string;
    monthlyRevenue: number;
    yearlyRevenue: number;
    monthlySignupGoal: number;
    yearlyRevenueGoal: string;
    currentBonusTier: number;
    goalProgress: string;
    currentRank: number;
    totalPlayers: number;
    territoryId: number | null;
  };
  user: {
    id: number;
    username: string | null;
    role: string;
    displayName: string | null;
    lastLoginAt: string | null;
    email: string;
  } | null;
  playerProfile: {
    playerLevel: number;
    totalCareerPoints: number;
    seasonPoints: number;
    monthlyPoints: number;
    currentStreak: number;
    longestStreak: number;
  } | null;
  history: Array<{
    id: number;
    snapshotDate: string;
    rank: number;
    points: number;
    monthlySignups: string;
    seasonId: string | null;
  }>;
  badges: Array<{
    id: number;
    name: string;
    description: string;
    iconUrl: string | null;
    category: string;
    rarity: string;
    earnedAt: string;
  }>;
  comparison: {
    teamAvg: {
      signups: number;
      revenue: number;
    };
    topPerformer: {
      name: string;
      signups: number;
      revenue: number;
    } | null;
    percentile: number;
    rankChange: number;
  };
}

const getBonusTierInfo = (tier: number) => {
  const tiers = [
    { name: 'None', color: 'bg-gray-600', textColor: 'text-gray-300' },
    { name: 'Bronze', color: 'bg-orange-600', textColor: 'text-orange-300', emoji: '🪙' },
    { name: 'Silver', color: 'bg-gray-400', textColor: 'text-gray-200', emoji: '💰' },
    { name: 'Gold', color: 'bg-yellow-500', textColor: 'text-yellow-300', emoji: '💎' },
    { name: 'Platinum', color: 'bg-indigo-500', textColor: 'text-indigo-300', emoji: '🏆' },
    { name: 'Diamond', color: 'bg-cyan-500', textColor: 'text-cyan-300', emoji: '👑' },
    { name: 'Elite', color: 'bg-purple-500', textColor: 'text-purple-300', emoji: '💯' },
  ];
  return tiers[tier] || tiers[0];
};

const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'legendary':
      return 'border-yellow-400 bg-yellow-400/10 text-yellow-500';
    case 'epic':
      return 'border-purple-400 bg-purple-400/10 text-purple-500';
    case 'rare':
      return 'border-blue-400 bg-blue-400/10 text-blue-500';
    default:
      return 'border-gray-400 bg-gray-400/10 text-muted-foreground';
  }
};

export function RepDetailModal({ repId, open, onOpenChange }: RepDetailModalProps) {
  const { data: profile, isLoading, error } = useQuery<FullProfileData>({
    queryKey: ['/api/leaderboard/sales-reps', repId, 'full-profile'],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard/sales-reps/${repId}/full-profile?days=30`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to fetch profile' }));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      return res.json();
    },
    enabled: open && repId !== null,
  });

  if (!open || !repId) return null;

  const tierInfo = profile ? getBonusTierInfo(profile.rep.currentBonusTier) : getBonusTierInfo(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-destructive mb-2">Failed to load profile</div>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </p>
          </div>
        ) : profile ? (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">{profile.rep.name} Profile</DialogTitle>
            </DialogHeader>

            {/* Profile Header */}
            <div className="flex items-start gap-6 pb-6 border-b">
              <Avatar className="w-24 h-24 border-4 border-border">
                <AvatarImage
                  src={
                    profile.rep.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      profile.rep.name
                    )}&background=dc2626&color=fff&size=128`
                  }
                  alt={profile.rep.name}
                />
                <AvatarFallback>
                  {profile.rep.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{profile.rep.name}</h2>
                  {profile.rep.currentBonusTier > 0 && (
                    <Badge className={`${tierInfo.color} text-white`}>
                      {tierInfo.emoji} {tierInfo.name}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {profile.rep.team || 'No Team'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profile.rep.email}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="text-lg font-bold">#{profile.rep.currentRank}</span>
                    <span className="text-sm text-muted-foreground">
                      of {profile.rep.totalPlayers}
                    </span>
                  </div>
                  {profile.comparison.rankChange !== 0 && (
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded ${
                        profile.comparison.rankChange > 0
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-red-500/20 text-red-500'
                      }`}
                    >
                      {profile.comparison.rankChange > 0 ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {Math.abs(profile.comparison.rankChange)} places
                      </span>
                    </div>
                  )}
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <span className="text-sm text-muted-foreground">Percentile: </span>
                    <span className="font-bold text-primary">
                      {profile.comparison.percentile}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-muted/50 rounded-lg p-4 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">Monthly Signups</span>
                </div>
                <div className="text-2xl font-bold text-green-500">
                  {parseFloat(profile.rep.monthlySignups).toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Goal: {profile.rep.monthlySignupGoal}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-xs">Yearly Signups</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {parseFloat(profile.rep.yearlySignups).toFixed(1)}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs">Yearly Revenue</span>
                </div>
                <div className="text-2xl font-bold text-yellow-500">
                  {formatCurrency(profile.rep.yearlyRevenue)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Goal: {formatCurrency(profile.rep.yearlyRevenueGoal)}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-xs">Goal Progress</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {parseFloat(profile.rep.goalProgress).toFixed(0)}%
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min(parseFloat(profile.rep.goalProgress), 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Rank History Chart */}
            <div className="mt-6">
              <RankHistoryChart history={profile.history} showToggle={true} defaultDays={14} />
            </div>

            {/* Team Comparison and Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-muted/50 rounded-lg p-4 border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Comparison
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Your Signups</span>
                    <span className="font-bold text-green-500">
                      {parseFloat(profile.rep.monthlySignups).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Team Average</span>
                    <span className="font-medium">
                      {profile.comparison.teamAvg.signups.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">vs Team Avg</span>
                    <span
                      className={`font-medium ${
                        parseFloat(profile.rep.monthlySignups) >
                        profile.comparison.teamAvg.signups
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {(
                        parseFloat(profile.rep.monthlySignups) -
                        profile.comparison.teamAvg.signups
                      ).toFixed(1)}
                      {parseFloat(profile.rep.monthlySignups) >
                      profile.comparison.teamAvg.signups
                        ? ' above'
                        : ' below'}
                    </span>
                  </div>
                  {profile.comparison.topPerformer && (
                    <>
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Top Performer</span>
                          <span className="font-medium text-yellow-500">
                            {profile.comparison.topPerformer.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-muted-foreground text-sm">Their Signups</span>
                          <span>
                            {profile.comparison.topPerformer.signups.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Badges Section */}
              <div className="bg-muted/50 rounded-lg p-4 border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Achievements ({profile.badges.length})
                </h3>
                {profile.badges.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {profile.badges.map((badge) => (
                      <div
                        key={badge.id}
                        className={`border rounded-lg p-2 ${getRarityColor(badge.rarity)}`}
                      >
                        <div className="flex items-center gap-2">
                          {badge.iconUrl ? (
                            <img src={badge.iconUrl} alt="" className="w-6 h-6" />
                          ) : (
                            <Star className="w-6 h-6" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{badge.name}</div>
                            <div className="text-xs opacity-75 capitalize">{badge.rarity}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No badges earned yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Linked HR User Info */}
            {profile.user && (
              <div className="mt-6 bg-muted/50 rounded-lg p-4 border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Linked HR Account
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Username</div>
                    <div className="font-medium">{profile.user.username || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Role</div>
                    <div className="font-medium capitalize">
                      {profile.user.role.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Display Name</div>
                    <div className="font-medium">
                      {profile.user.displayName || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last Login
                    </div>
                    <div className="font-medium">
                      {profile.user.lastLoginAt
                        ? new Date(profile.user.lastLoginAt).toLocaleDateString()
                        : 'Never'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gamification Stats */}
            {profile.playerProfile && (
              <div className="mt-6 bg-muted/50 rounded-lg p-4 border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Gamification Stats
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {profile.playerProfile.playerLevel}
                    </div>
                    <div className="text-xs text-muted-foreground">Level</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-500">
                      {profile.playerProfile.monthlyPoints?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Monthly Pts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-500">
                      {profile.playerProfile.seasonPoints?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Season Pts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-500">
                      {profile.playerProfile.totalCareerPoints?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Career Pts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-500">
                      {profile.playerProfile.currentStreak || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Current Streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-500">
                      {profile.playerProfile.longestStreak || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Best Streak</div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Failed to load profile data</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
