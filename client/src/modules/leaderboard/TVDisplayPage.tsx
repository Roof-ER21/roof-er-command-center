import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Play, Square, RotateCcw, Maximize2, Minimize2, Trophy, Medal } from "lucide-react";
import { TerritorySelector } from "./components/TerritorySelector";
import { RepDetailModal } from "./components/RepDetailModal";

interface SalesRep {
  id: number;
  name: string;
  email: string;
  team: string;
  monthlyRevenue: number;
  yearlyRevenue: number;
  monthlySignups: number;
  yearlySignups: number;
  currentBonusTier: number;
  avatar?: string;
}

const bonusTierEmojis = ["", "🪙", "💰", "💎", "🏆", "👑", "💯"];

export function TVDisplayPage() {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(120); // seconds for full scroll
  const [showCreditsAtEnd, setShowCreditsAtEnd] = useState(true);
  const [sortBy, setSortBy] = useState<'monthlySignups' | 'yearlySignups' | 'yearlyRevenue'>('monthlySignups');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState<string>("all");
  const [cycleInterval, setCycleInterval] = useState<number | null>(null);

  // Rep detail modal state
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: salesReps = [], refetch } = useQuery<SalesRep[]>({
    queryKey: ["/api/leaderboard/sales-reps", { territoryId: selectedTerritory }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTerritory !== "all") params.append("territoryId", selectedTerritory);
      const res = await fetch(`/api/leaderboard/sales-reps?${params.toString()}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch sales reps");
      return res.json();
    },
    refetchInterval: 30000, // Auto refresh every 30 seconds
  });

  // Sort all sales reps by selected metric (descending order - #1 first)
  const sortedReps = salesReps
    .filter(rep => rep.name && rep.name.trim() !== '') // Filter out empty names
    .sort((a, b) => {
      if (sortBy === 'monthlySignups') {
        return b.monthlySignups - a.monthlySignups;
      } else if (sortBy === 'yearlySignups') {
        return b.yearlySignups - a.yearlySignups;
      } else {
        return b.yearlyRevenue - a.yearlyRevenue;
      }
    });

  // Auto-cycle through sort options
  const sortOptions: Array<'monthlySignups' | 'yearlySignups' | 'yearlyRevenue'> = ['monthlySignups', 'yearlySignups', 'yearlyRevenue'];
  
  const startAnimation = useCallback(() => {
    const creditsContainer = document.getElementById('credits-container');
    if (creditsContainer) {
      creditsContainer.style.animation = 'none';
      // Force reflow
      void creditsContainer.offsetWidth;
      creditsContainer.style.animation = `scrollUp ${scrollSpeed}s linear infinite`;
    }
  }, [scrollSpeed]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    startAnimation();
    
    // Set up auto-cycling
    let currentIndex = sortOptions.indexOf(sortBy);
    const interval = window.setInterval(() => {
      currentIndex = (currentIndex + 1) % sortOptions.length;
      setSortBy(sortOptions[currentIndex]);
      startAnimation();
    }, scrollSpeed * 1000);
    
    setCycleInterval(interval);
  }, [scrollSpeed, sortBy, startAnimation]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    if (cycleInterval) {
      clearInterval(cycleInterval);
      setCycleInterval(null);
    }
    const creditsContainer = document.getElementById('credits-container');
    if (creditsContainer) {
      creditsContainer.style.animation = 'none';
    }
  }, [cycleInterval]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handler for clicking on a rep
  const handleRepClick = useCallback((repId: number) => {
    setSelectedRepId(repId);
    setIsModalOpen(true);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden font-sans">
      <style>{`
        @keyframes scrollUp {
          0% { transform: translateY(100vh); }
          100% { transform: translateY(-100%); }
        }
        .credits-shadow {
          text-shadow: 0 4px 10px rgba(0,0,0,0.8);
        }
      `}</style>

      {/* Control Panel */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 relative z-50">
        <div className="flex items-center justify-between max-w-full mx-auto">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
              🏆 TV LEADERBOARD
            </h1>
            <div className="flex items-center space-x-3">
              <Label className="text-xs text-zinc-400">SPEED</Label>
              <select
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(Number(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
                disabled={isPlaying}
              >
                <option value={60}>Fast</option>
                <option value={120}>Normal</option>
                <option value={180}>Slow</option>
                <option value={240}>Marathon</option>
              </select>
            </div>
            <div className="flex items-center space-x-3">
              <Label className="text-xs text-zinc-400">METRIC</Label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
                disabled={isPlaying}
              >
                <option value="monthlySignups">Monthly Signups</option>
                <option value="yearlySignups">Yearly Signups</option>
                <option value="yearlyRevenue">Yearly Revenue</option>
              </select>
            </div>
            <TerritorySelector
              value={selectedTerritory}
              onValueChange={setSelectedTerritory}
              className="w-40 h-8 bg-zinc-800 border-zinc-700 text-xs"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              onClick={isPlaying ? handleStop : handlePlay}
              className={isPlaying ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isPlaying ? <Square className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isPlaying ? 'Stop' : 'Play'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Movie Credits Display Area */}
      <div className="relative h-[calc(100vh-65px)] bg-zinc-950">
        {sortedReps.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-zinc-700 mb-2">NO DATA</h2>
              <p className="text-zinc-500">Sales records will appear here</p>
            </div>
          </div>
        ) : (
          <div className="h-full relative overflow-hidden bg-gradient-to-b from-black via-zinc-900 to-black">
            {/* Credits Container */}
            <div 
              id="credits-container"
              className="absolute w-full text-center"
              style={{
                top: '0',
                animation: isPlaying ? `scrollUp ${scrollSpeed}s linear infinite` : 'none',
              }}
            >
              {/* Opening Title */}
              <div className="pt-[50vh] mb-64 px-4">
                <h1 className="text-7xl md:text-9xl font-black text-yellow-500 mb-8 tracking-tighter credits-shadow italic">
                  THE ROOF DOCS
                </h1>
                <h1 className="text-5xl md:text-7xl font-bold text-red-600 mb-12 tracking-widest credits-shadow">
                  MILLIONAIRES ROAD
                </h1>
                <div className="h-1 w-64 bg-yellow-500 mx-auto mb-12"></div>
                <h2 className="text-3xl md:text-4xl text-zinc-300 font-light tracking-[0.2em] uppercase">
                  Sales Leaders {new Date().getFullYear()}
                </h2>
                <p className="text-xl text-zinc-500 mt-8 font-mono">
                  {sortBy === 'monthlySignups' ? 'Metric: Monthly Signups' : 
                   sortBy === 'yearlySignups' ? 'Metric: Yearly Signups' : 
                   'Metric: Yearly Revenue'}
                </p>
              </div>

              {/* Sales Reps Credits */}
              <div className="space-y-48 pb-[100vh]">
                {sortedReps.map((rep, index) => (
                  <div
                    key={rep.id}
                    className="max-w-5xl mx-auto px-8 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    onClick={() => handleRepClick(rep.id)}
                  >
                    {/* Rank */}
                    <div className="text-8xl font-black text-zinc-800 mb-4 opacity-50">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>

                    <div className="flex flex-col items-center gap-8">
                      {/* Avatar */}
                      <div className="relative group">
                        {rep.avatar ? (
                          <img 
                            src={rep.avatar} 
                            alt={rep.name}
                            className="w-48 h-48 rounded-full border-8 border-yellow-500/50 shadow-2xl object-cover"
                          />
                        ) : (
                          <div className="w-48 h-48 rounded-full border-8 border-zinc-800 bg-zinc-900 flex items-center justify-center shadow-2xl">
                            <span className="text-6xl font-bold text-zinc-700">
                              {rep.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        )}
                        {index < 3 && (
                          <div className="absolute -top-4 -right-4 bg-yellow-500 p-3 rounded-full shadow-xl animate-bounce">
                            <Trophy className="h-8 w-8 text-black" />
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="space-y-4">
                        <h3 className="text-6xl md:text-8xl font-bold text-white tracking-tight credits-shadow">
                          {rep.name.toUpperCase()}
                        </h3>
                        <p className="text-2xl md:text-3xl text-red-500 font-medium tracking-widest uppercase">
                          {rep.team || "Independent"}
                        </p>
                        
                        <div className="flex justify-center items-center gap-4 text-3xl">
                          <span className="text-zinc-400">LEVEL</span>
                          <span className="text-yellow-500 font-mono font-bold">
                            {rep.currentBonusTier} {bonusTierEmojis[rep.currentBonusTier] || "🌱"}
                          </span>
                        </div>
                      </div>

                      {/* Stat Card */}
                      <div className="mt-8 p-12 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl min-w-[400px]">
                        {sortBy === 'monthlySignups' ? (
                          <div className="space-y-2">
                            <div className="text-8xl font-black text-green-500 tabular-nums">
                              {rep.monthlySignups.toFixed(1)}
                            </div>
                            <div className="text-xl text-zinc-400 tracking-widest uppercase">Monthly Signups</div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-16">
                            <div className="space-y-2 border-r border-white/10 pr-16">
                              <div className="text-5xl font-black text-green-500 tabular-nums">
                                {rep.yearlySignups.toFixed(1)}
                              </div>
                              <div className="text-sm text-zinc-400 tracking-widest uppercase">Yearly Signups</div>
                            </div>
                            <div className="space-y-2">
                              <div className="text-5xl font-black text-red-500 tabular-nums">
                                ${Math.round(rep.yearlyRevenue / 1000)}k
                              </div>
                              <div className="text-sm text-zinc-400 tracking-widest uppercase">Yearly Rev</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Ending Credits */}
                {showCreditsAtEnd && (
                  <div className="pt-64 space-y-12">
                    <h2 className="text-6xl font-bold text-zinc-700 tracking-widest uppercase">
                      Excellence in Action
                    </h2>
                    <div className="max-w-md mx-auto h-px bg-zinc-800"></div>
                    <p className="text-2xl text-zinc-500 font-light italic">
                      Dedicated to the best roofing sales team in the industry
                    </p>
                    <div className="text-zinc-600 font-mono text-sm pt-32">
                      &copy; {new Date().getFullYear()} THE ROOF DOCS COMMAND CENTER
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rep Detail Modal */}
      <RepDetailModal
        repId={selectedRepId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}