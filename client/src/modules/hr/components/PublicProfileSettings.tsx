import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Globe, Share2, Check, Copy } from "lucide-react";

interface PublicProfileSettingsProps {
  employee: {
    id: number;
    slug?: string;
    isPublicProfile: boolean;
    publicBio?: string;
    publicPhone?: string;
    publicEmail?: string;
    firstName: string;
    lastName: string;
  };
}

export function PublicProfileSettings({ employee }: PublicProfileSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPublic, setIsPublic] = useState(employee.isPublicProfile);
  const [bio, setBio] = useState(employee.publicBio || "");
  const [phone, setPhone] = useState(employee.publicPhone || "");
  const [email, setEmail] = useState(employee.publicEmail || "");
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/hr/employees/${employee.id}/public-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/employees", employee.id] });
      toast({
        title: "Profile Updated",
        description: "Public profile settings saved successfully",
      });
    },
  });

  const getProfileUrlMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/hr/employees/${employee.id}/profile-url`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to get profile URL");
      return res.json();
    },
    onSuccess: (data) => {
      const fullUrl = `${window.location.origin}${data.url}`;
      setProfileUrl(fullUrl);
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate({
      isPublicProfile: isPublic,
      publicBio: bio,
      publicPhone: phone,
      publicEmail: email,
    });
  };

  const handleGetUrl = () => {
    getProfileUrlMutation.mutate();
  };

  const handleCopyUrl = async () => {
    if (!profileUrl) return;

    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Profile URL copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy URL to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Public Profile Settings
          </CardTitle>
          <CardDescription>
            Make this employee's profile visible in the public directory
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Public Profile Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-profile">Public Profile</Label>
              <div className="text-sm text-slate-500">
                Allow this profile to be visible in the public employee directory
              </div>
            </div>
            <Switch
              id="public-profile"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {isPublic && (
            <>
              {/* Public Bio */}
              <div className="space-y-2">
                <Label htmlFor="public-bio">Public Bio</Label>
                <Textarea
                  id="public-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Enter a brief bio to display on the public profile..."
                  rows={4}
                />
              </div>

              {/* Public Phone */}
              <div className="space-y-2">
                <Label htmlFor="public-phone">Public Phone (Optional)</Label>
                <Input
                  id="public-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Public Email */}
              <div className="space-y-2">
                <Label htmlFor="public-email">Public Email (Optional)</Label>
                <Input
                  id="public-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@company.com"
                />
              </div>
            </>
          )}

          <Button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
            className="w-full"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Profile URL Card */}
      {isPublic && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Profile
            </CardTitle>
            <CardDescription>
              Get a shareable link to this employee's public profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!profileUrl ? (
              <Button
                onClick={handleGetUrl}
                disabled={getProfileUrlMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {getProfileUrlMutation.isPending ? "Generating..." : "Generate Profile URL"}
              </Button>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    value={profileUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopyUrl}
                    variant="outline"
                    size="icon"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => window.open(profileUrl, "_blank")}
                  variant="outline"
                  className="w-full"
                >
                  View Public Profile
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
