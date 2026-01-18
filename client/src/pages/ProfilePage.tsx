import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  Trophy,
  Award,
  TrendingUp,
  Edit,
  Upload,
  Zap,
  Target,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ProfilePage() {
  const { user, refetch } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.email[0].toUpperCase()
    : "?";

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      await refetch();
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }

      await refetch();
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const moduleAccess = [
    { name: "HR", enabled: user?.hasHRAccess, color: "purple" },
    { name: "Leaderboard", enabled: user?.hasLeaderboardAccess, color: "green" },
    { name: "Training", enabled: user?.hasTrainingAccess, color: "amber" },
    { name: "Field", enabled: user?.hasFieldAccess, color: "sky" },
  ];

  const levelProgress = user?.currentLevel || 1;
  const nextLevelXp = levelProgress * 1000;
  const currentXp = user?.totalXp || 0;
  const xpProgress = ((currentXp % nextLevelXp) / nextLevelXp) * 100;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your avatar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32">
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                  {user?.avatar || userInitials}
                </AvatarFallback>
              </Avatar>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isUploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? "Uploading..." : "Upload Photo"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Profile Picture</DialogTitle>
                    <DialogDescription>
                      Choose an image file to upload as your profile picture
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum file size: 5MB. Accepted formats: JPG, PNG, GIF
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="text-center pt-4 border-t">
              <h3 className="font-semibold text-lg">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {user?.role?.replace(/_/g, " ")}
              </p>
            </div>

            {/* Module Access Badges */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Module Access</h4>
              <div className="flex flex-wrap gap-2">
                {moduleAccess.map((module) => (
                  <Badge
                    key={module.name}
                    variant={module.enabled ? "default" : "outline"}
                    className={cn(
                      module.enabled && module.color === "purple" && "bg-purple-600",
                      module.enabled && module.color === "green" && "bg-green-600",
                      module.enabled && module.color === "amber" && "bg-amber-600",
                      module.enabled && module.color === "sky" && "bg-sky-600"
                    )}
                  >
                    {module.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleUpdateProfile}>
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                    />
                  ) : (
                    <span className="text-sm">{user?.firstName}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                    />
                  ) : (
                    <span className="text-sm">{user?.lastName}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user?.email}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed here. Contact admin.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user?.role?.replace(/_/g, " ")}</span>
                </div>
              </div>

              {user?.department && (
                <div className="space-y-2">
                  <Label>Department</Label>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.department}</span>
                  </div>
                </div>
              )}

              {user?.position && (
                <div className="space-y-2">
                  <Label>Position</Label>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.position}</span>
                  </div>
                </div>
              )}

              {user?.hireDate && (
                <div className="space-y-2">
                  <Label>Hire Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(user.hireDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}

              {user?.team && (
                <div className="space-y-2">
                  <Label>Team</Label>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.team}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Training Stats (if has training access) */}
        {user?.hasTrainingAccess && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Training Progress</CardTitle>
              <CardDescription>Your learning journey and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <Zap className="h-8 w-8 text-amber-600 mb-2" />
                  <div className="text-2xl font-bold">{user.currentLevel || 1}</div>
                  <div className="text-sm text-muted-foreground">Level</div>
                  <div className="w-full mt-2 bg-secondary rounded-full h-2">
                    <div
                      className="bg-amber-600 h-2 rounded-full transition-all"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <Target className="h-8 w-8 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold">{user.totalXp || 0}</div>
                  <div className="text-sm text-muted-foreground">Total XP</div>
                </div>

                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <Flame className="h-8 w-8 text-orange-600 mb-2" />
                  <div className="text-2xl font-bold">{user.currentStreak || 0}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>

                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <Trophy className="h-8 w-8 text-yellow-600 mb-2" />
                  <div className="text-2xl font-bold">{user.longestStreak || 0}</div>
                  <div className="text-sm text-muted-foreground">Best Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sales Performance (if has leaderboard access) */}
        {user?.hasLeaderboardAccess && user?.linkedSalesRepId && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
              <CardDescription>Your sales metrics and rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                  <div className="text-2xl font-bold">View Dashboard</div>
                  <div className="text-sm text-muted-foreground">Sales metrics available</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
