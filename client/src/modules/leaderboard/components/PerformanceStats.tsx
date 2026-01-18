import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, Target } from "lucide-react";

interface PerformanceStatsProps {
  stats?: {
    totalRevenue: string;
    totalSignups: string;
    avgPerformance: string;
    goalsMet: string;
  };
}

export function PerformanceStats({ stats }: PerformanceStatsProps) {
  if (!stats) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-6 bg-muted rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Revenue",
      value: stats.totalRevenue,
      icon: DollarSign,
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500"
    },
    {
      title: "Total Signups",
      value: stats.totalSignups,
      icon: Users,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-500"
    },
    {
      title: "Avg Performance",
      value: stats.avgPerformance,
      icon: TrendingUp,
      bgColor: "bg-yellow-500/10",
      iconColor: "text-yellow-500"
    },
    {
      title: "Goals Met",
      value: stats.goalsMet,
      icon: Target,
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-500"
    }
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
      {statsData.map((stat, index) => (
        <Card
          key={stat.title}
          className="hover:shadow-lg transition-shadow duration-300"
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
