import { useState } from 'react';
import { Award, Lock, Check, Filter, Search, Trophy, Star, Crown, Flame, Target, Clock, TrendingUp } from 'lucide-react';
import { ACHIEVEMENTS, RARITY_COLORS, ACHIEVEMENT_CATEGORIES, type Achievement, type AchievementRarity } from '@shared/constants/achievements';

interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string;
  progress?: number;
}

// Icons mapping
const ICON_MAP: Record<string, any> = {
  Footprints: Trophy,
  TrendingUp,
  Trophy,
  Flame,
  Zap: Star,
  Star,
  Shield: Target,
  Target,
  MessageSquare: Award,
  Sunrise: Clock,
  Moon: Clock,
  Calendar: Clock,
  Award,
  Crown,
};

export function AchievementsPage() {
  // Mock data - replace with actual API call
  const [unlockedAchievements] = useState<UnlockedAchievement[]>([
    { achievementId: 'first_steps', unlockedAt: '2024-12-15T10:30:00Z' },
    { achievementId: 'streak_3', unlockedAt: '2024-12-18T14:20:00Z' },
    { achievementId: 'perfectionist', unlockedAt: '2024-12-20T09:15:00Z' },
    { achievementId: 'xp_1000', unlockedAt: '2024-12-22T16:45:00Z' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<AchievementRarity | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Achievement['category'] | 'all'>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  // Filter achievements
  const filteredAchievements = ACHIEVEMENTS.filter((achievement) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!achievement.name.toLowerCase().includes(query) &&
          !achievement.description.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Rarity filter
    if (rarityFilter !== 'all' && achievement.rarity !== rarityFilter) {
      return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) {
      return false;
    }

    // Unlocked filter
    const isUnlocked = unlockedAchievements.some(ua => ua.achievementId === achievement.id);
    if (showUnlockedOnly && !isUnlocked) {
      return false;
    }

    return true;
  });

  // Calculate stats
  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;
  const progressPercentage = Math.round((unlockedCount / totalCount) * 100);
  const totalXPEarned = unlockedAchievements.reduce((sum, ua) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === ua.achievementId);
    return sum + (achievement?.xpReward || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-600" />
            <h1 className="text-3xl font-bold text-gray-900">Achievements</h1>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Progress</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {unlockedCount}/{totalCount}
                  </div>
                </div>
                <Trophy className="w-8 h-8 text-amber-500" />
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">XP from Achievements</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {totalXPEarned.toLocaleString()}
                  </div>
                </div>
                <Star className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {progressPercentage}%
                  </div>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
              className={`
                px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${showUnlockedOnly
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <Check className="w-3 h-3 inline mr-1" />
              Unlocked Only
            </button>

            {/* Rarity Filters */}
            <div className="flex items-center gap-1 pl-2 border-l border-gray-300">
              <Filter className="w-4 h-4 text-gray-400" />
              {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map((rarity) => (
                <button
                  key={rarity}
                  onClick={() => setRarityFilter(rarity)}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors
                    ${rarityFilter === rarity
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {rarity}
                </button>
              ))}
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-1 pl-2 border-l border-gray-300">
              {(['all', 'progress', 'performance', 'streak', 'time', 'mastery'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors
                    ${categoryFilter === category
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {category === 'all' ? 'All' : ACHIEVEMENT_CATEGORIES[category].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => {
            const isUnlocked = unlockedAchievements.some(ua => ua.achievementId === achievement.id);
            const unlockedData = unlockedAchievements.find(ua => ua.achievementId === achievement.id);
            const colors = RARITY_COLORS[achievement.rarity];
            const IconComponent = ICON_MAP[achievement.icon] || Award;

            return (
              <div
                key={achievement.id}
                className={`
                  relative bg-white rounded-lg border-2 p-6 transition-all
                  ${isUnlocked
                    ? `${colors.border} ${colors.bg} shadow-md hover:shadow-lg`
                    : 'border-gray-200 opacity-60 hover:opacity-80'
                  }
                `}
              >
                {/* Locked/Unlocked Badge */}
                <div className="absolute top-3 right-3">
                  {isUnlocked ? (
                    <div className="bg-green-500 rounded-full p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="bg-gray-300 rounded-full p-1">
                      <Lock className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Icon */}
                <div
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center mb-4
                    ${isUnlocked ? colors.bg : 'bg-gray-100'}
                  `}
                >
                  <IconComponent
                    className={`w-8 h-8 ${isUnlocked ? colors.text : 'text-gray-400'}`}
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-900">{achievement.name}</h3>
                    <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${colors.bg} ${colors.text}`}>
                      {achievement.rarity}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600">{achievement.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-1 text-amber-600">
                      <Star className="w-4 h-4" />
                      <span className="text-sm font-semibold">+{achievement.xpReward} XP</span>
                    </div>
                    {isUnlocked && unlockedData && (
                      <span className="text-xs text-gray-500">
                        {new Date(unlockedData.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No achievements found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
