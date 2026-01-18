import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Territory } from "@shared/schema";
import { MapPin } from "lucide-react";

interface TerritorySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function TerritorySelector({ value, onValueChange, className }: TerritorySelectorProps) {
  const { data: territories = [], isLoading } = useQuery<Territory[]>({
    queryKey: ["/api/leaderboard/territories"],
  });

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <SelectValue placeholder="Select territory" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Territories</SelectItem>
        {isLoading ? (
          <SelectItem value="loading" disabled>
            Loading territories...
          </SelectItem>
        ) : (
          territories.map((territory) => (
            <SelectItem key={territory.id} value={territory.id.toString()}>
              {territory.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
