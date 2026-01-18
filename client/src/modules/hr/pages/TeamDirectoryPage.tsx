import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone } from "lucide-react";

interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  position?: string;
  phone?: string;
  role: string;
  avatar?: string;
}

export function TeamDirectoryPage() {
  const { data: staff = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/hr/team-directory"],
    queryFn: async () => {
      const response = await fetch("/api/hr/team-directory", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch team directory");
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
    return <div className="p-8">Loading team directory...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Directory</h1>
        <p className="text-muted-foreground">Find teammates and contact information</p>
      </div>

      {grouped.map(([department, members]) => (
        <Card key={department}>
          <CardHeader>
            <CardTitle>{department}</CardTitle>
            <CardDescription>{members.length} team members</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {members.map((member) => (
              <div key={member.id} className="rounded-lg border p-4">
                <div className="font-medium">
                  {member.firstName} {member.lastName}
                </div>
                <div className="text-sm text-muted-foreground">{member.position || member.role}</div>
                <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </span>
                  {member.phone && (
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {member.phone}
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="mt-3">
                  {member.role}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {grouped.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No team members found.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
