import { useEffect, useState } from 'react';
import { X, Sparkles, Trophy, Share2, Zap } from 'lucide-react';
import { getLevelTitle } from '../../../lib/gamification';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  perksUnlocked?: string[];
  totalXP: number;
}

export function LevelUpModal({
  isOpen,
  onClose,
  newLevel,
  perksUnlocked = [],
  totalXP
}: LevelUpModalProps) {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setAnimationStep(0);
      return;
    }

    // Stagger animations
    const timeouts = [
      setTimeout(() => setAnimationStep(1), 100),
      setTimeout(() => setAnimationStep(2), 600),
      setTimeout(() => setAnimationStep(3), 1100),
    ];

    return () => timeouts.forEach(clearTimeout);
  }, [isOpen]);

  if (!isOpen) return null;

  const levelTitle = getLevelTitle(newLevel);

  const defaultPerks = [
    'Access to advanced training modules',
    'Exclusive achievement badges',
    'Higher XP multipliers',
  ];

  const displayPerks = perksUnlocked.length > 0 ? perksUnlocked : defaultPerks;

  const handleShare = () => {
    const text = `I just reached Level ${newLevel} (${levelTitle}) in Roof-ER Training! 🎉`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Confetti Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-amber-400 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Content */}
        <div className="relative p-8 text-center space-y-6">
          {/* Trophy Icon */}
          <div
            className={`
              mx-auto w-24 h-24 rounded-full
              bg-gradient-to-br from-amber-400 to-amber-600
              flex items-center justify-center
              transform transition-all duration-700
              ${animationStep >= 1 ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}
            `}
          >
            <Trophy className="w-12 h-12 text-white" />
          </div>

          {/* Level Up Text */}
          <div
            className={`
              space-y-2 transition-all duration-700 delay-300
              ${animationStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-3xl font-bold text-gray-900">
                Level {newLevel}!
              </h2>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-lg font-semibold text-amber-600">
              {levelTitle}
            </p>
            <p className="text-sm text-gray-600">
              Total XP: {totalXP.toLocaleString()}
            </p>
          </div>

          {/* Perks Unlocked */}
          {displayPerks.length > 0 && (
            <div
              className={`
                transition-all duration-700 delay-500
                ${animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
            >
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-center gap-2 text-amber-900 font-semibold">
                  <Zap className="w-4 h-4" />
                  <span>New Perks Unlocked</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  {displayPerks.map((perk, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2"
                    >
                      <span className="text-amber-500 mt-0.5">✓</span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleShare}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-md"
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear infinite;
        }
      `}</style>
    </div>
  );
}
