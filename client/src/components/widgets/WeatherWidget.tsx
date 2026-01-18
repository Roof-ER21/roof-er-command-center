import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
  feelsLike: number;
  uvIndex?: number;
  precipitation?: number;
}

export interface WeatherWidgetProps {
  title?: string;
  location?: string;
  showDetails?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const getWeatherIcon = (condition: string) => {
  const lower = condition.toLowerCase();
  if (lower.includes("rain") || lower.includes("drizzle")) {
    return CloudRain;
  }
  if (lower.includes("snow")) {
    return CloudSnow;
  }
  if (lower.includes("cloud") || lower.includes("overcast")) {
    return Cloud;
  }
  return Sun;
};

const getWeatherColor = (condition: string) => {
  const lower = condition.toLowerCase();
  if (lower.includes("rain") || lower.includes("drizzle")) {
    return "text-blue-500";
  }
  if (lower.includes("snow")) {
    return "text-cyan-300";
  }
  if (lower.includes("cloud") || lower.includes("overcast")) {
    return "text-slate-400";
  }
  return "text-yellow-500";
};

const getFieldWorkRecommendation = (weather: WeatherData) => {
  const { temperature, condition, windSpeed } = weather;
  const lower = condition.toLowerCase();

  if (lower.includes("rain") || lower.includes("storm")) {
    return { status: "poor", message: "Not recommended - Wet conditions", color: "text-red-500" };
  }
  if (lower.includes("snow")) {
    return { status: "poor", message: "Not recommended - Snow", color: "text-red-500" };
  }
  if (temperature > 95 || temperature < 32) {
    return { status: "caution", message: "Caution - Extreme temperatures", color: "text-amber-500" };
  }
  if (windSpeed > 25) {
    return { status: "caution", message: "Caution - High winds", color: "text-amber-500" };
  }
  return { status: "good", message: "Good conditions for field work", color: "text-green-500" };
};

export function WeatherWidget({
  title = "Weather",
  location = "Current Location",
  showDetails = true,
  onRefresh,
  className,
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual weather API call
      // Simulating API call with mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setWeather({
        temperature: 72,
        condition: "Partly Cloudy",
        humidity: 65,
        windSpeed: 8,
        location: location,
        feelsLike: 70,
        uvIndex: 6,
        precipitation: 10,
      });
    } catch (err) {
      setError("Failed to fetch weather data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [location]);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      fetchWeather();
    }
  };

  const WeatherIcon = weather ? getWeatherIcon(weather.condition) : Cloud;
  const weatherColor = weather ? getWeatherColor(weather.condition) : "text-slate-400";
  const recommendation = weather ? getFieldWorkRecommendation(weather) : null;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-3">
              Try Again
            </Button>
          </div>
        ) : weather ? (
          <div className="space-y-4">
            {/* Main weather display */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <WeatherIcon className={cn("h-12 w-12", weatherColor)} />
                <div>
                  <div className="text-3xl font-bold">{Math.round(weather.temperature)}°F</div>
                  <p className="text-sm text-muted-foreground">{weather.condition}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Feels like {Math.round(weather.feelsLike)}°F
                  </p>
                </div>
              </div>
            </div>

            {/* Field work recommendation */}
            {recommendation && (
              <div className={cn("p-3 rounded-lg bg-card border", recommendation.color)}>
                <p className="text-sm font-medium">{recommendation.message}</p>
              </div>
            )}

            {/* Detailed weather info */}
            {showDetails && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Humidity</p>
                    <p className="text-sm font-medium">{weather.humidity}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Wind</p>
                    <p className="text-sm font-medium">{weather.windSpeed} mph</p>
                  </div>
                </div>
                {weather.uvIndex !== undefined && (
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">UV Index</p>
                      <p className="text-sm font-medium">{weather.uvIndex}</p>
                    </div>
                  </div>
                )}
                {weather.precipitation !== undefined && (
                  <div className="flex items-center gap-2">
                    <CloudRain className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Precip</p>
                      <p className="text-sm font-medium">{weather.precipitation}%</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center pt-2">
              📍 {weather.location}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
