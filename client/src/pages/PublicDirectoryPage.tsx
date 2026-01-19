import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Building2, Mail, Phone } from "lucide-react";

interface PublicEmployee {
  id: number;
  slug: string;
  firstName: string;
  lastName: string;
  position: string | null;
  department: string | null;
  avatar: string | null;
  publicBio: string | null;
}

interface Department {
  department: string;
  count: number;
}

export function PublicDirectoryPage() {
  const [employees, setEmployees] = useState<PublicEmployee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [selectedDepartment, search]);

  const fetchEmployees = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDepartment) params.append("department", selectedDepartment);
      if (search) params.append("search", search);

      const res = await fetch(`/api/public/directory?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/public/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Team Directory</h1>
            <p className="text-lg text-slate-600">Meet our amazing team</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, position, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>

          {/* Department Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedDepartment === null ? "default" : "outline"}
              onClick={() => setSelectedDepartment(null)}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              All Departments
            </Button>
            {departments.map((dept) => (
              <Button
                key={dept.department}
                variant={selectedDepartment === dept.department ? "default" : "outline"}
                onClick={() => setSelectedDepartment(dept.department)}
                className="gap-2"
              >
                <Building2 className="h-4 w-4" />
                {dept.department}
                <Badge variant="secondary" className="ml-1">
                  {dept.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Employee Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-slate-600">Loading team members...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-xl text-slate-600">No team members found</p>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <Link key={employee.id} to={`/team/${employee.slug}`}>
                <Card className="hover:shadow-lg transition-shadow duration-200 h-full">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      {/* Avatar */}
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
                        {employee.avatar || `${employee.firstName[0]}${employee.lastName[0]}`}
                      </div>

                      {/* Name */}
                      <h3 className="text-xl font-semibold text-slate-900 mb-1">
                        {employee.firstName} {employee.lastName}
                      </h3>

                      {/* Position */}
                      {employee.position && (
                        <p className="text-sm text-slate-600 mb-2">{employee.position}</p>
                      )}

                      {/* Department Badge */}
                      {employee.department && (
                        <Badge variant="secondary" className="mb-3">
                          {employee.department}
                        </Badge>
                      )}

                      {/* Bio Preview */}
                      {employee.publicBio && (
                        <p className="text-sm text-slate-500 line-clamp-2 mt-2">
                          {employee.publicBio}
                        </p>
                      )}

                      {/* View Profile Link */}
                      <Button variant="outline" size="sm" className="mt-4 w-full">
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
