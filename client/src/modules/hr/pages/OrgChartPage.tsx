import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
  role: string;
}

export function OrgChartPage() {
  const { data: staff = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/hr/team-directory"],
    queryFn: async () => {
      const response = await fetch("/api/hr/team-directory", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch org chart");
      return response.json();
    },
  });

  const grouped = useMemo(() => {
    const map = new Map<string, TeamMember[]>();
    staff.forEach((member) => {
      const key = member.department || "General";
      const list = map.get(key) || [];
      list.push(member);
      map.set(key, list);
    });
    return Array.from(map.entries());
  }, [staff]);

  if (isLoading) {
    return <div className="p-8">Loading org chart...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Org Chart</h1>
        <p className="text-muted-foreground">Department structure and roles</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {grouped.map(([department, members]) => (
          <Card key={department}>
            <CardHeader>
              <CardTitle>{department}</CardTitle>
              <CardDescription>{members.length} roles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <div className="font-medium">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {member.position || member.role}
                    </div>
                  </div>
                  <Badge variant="outline">{member.role}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {grouped.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No organizational data available.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
