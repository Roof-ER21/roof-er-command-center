import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  Settings,
  Lock,
  Bell,
  Globe,
  Clock,
  Shield,
  Key,
  Moon,
  Sun,
} from "lucide-react";

export function SettingsPage() {
  const { user, refetch } = useAuth();
  const { toast } = useToast();

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [pinData, setPinData] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });

  const [preferences, setPreferences] = useState({
    timezone: user?.timezone || "America/New_York",
    preferredAiProvider: user?.preferredAiProvider || "gemini",
    preferredState: user?.preferredState || "VA",
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePinChange = async () => {
    if (pinData.newPin !== pinData.confirmPin) {
      toast({
        title: "Error",
        description: "New PINs do not match.",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{4,6}$/.test(pinData.newPin)) {
      toast({
        title: "Error",
        description: "PIN must be 4-6 digits.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPin(true);
    try {
      const response = await fetch("/api/profile/pin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPin: pinData.currentPin || undefined,
          newPin: pinData.newPin,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change PIN");
      }

      toast({
        title: "PIN updated",
        description: "Your PIN has been updated successfully.",
      });

      setPinData({
        currentPin: "",
        newPin: "",
        confirmPin: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change PIN",
        variant: "destructive",
      });
    } finally {
      setIsChangingPin(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      await refetch();
      toast({
        title: "Preferences updated",
        description: "Your preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Account Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Account Security</CardTitle>
            </div>
            <CardDescription>Manage your password and PIN</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Password Change */}
            <div className="space-y-4 pb-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Change your account password
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and choose a new one
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handlePasswordChange}
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? "Changing..." : "Change Password"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* PIN Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Training PIN
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.pinHash ? "Update your training PIN" : "Set up a PIN for quick training access"}
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      {user?.pinHash ? "Change PIN" : "Set PIN"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{user?.pinHash ? "Change PIN" : "Set PIN"}</DialogTitle>
                      <DialogDescription>
                        {user?.pinHash
                          ? "Enter your current PIN and choose a new one"
                          : "Choose a 4-6 digit PIN for quick training access"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {user?.pinHash && (
                        <div className="space-y-2">
                          <Label htmlFor="currentPin">Current PIN</Label>
                          <Input
                            id="currentPin"
                            type="password"
                            maxLength={6}
                            value={pinData.currentPin}
                            onChange={(e) =>
                              setPinData({
                                ...pinData,
                                currentPin: e.target.value.replace(/\D/g, ""),
                              })
                            }
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="newPin">New PIN</Label>
                        <Input
                          id="newPin"
                          type="password"
                          maxLength={6}
                          value={pinData.newPin}
                          onChange={(e) =>
                            setPinData({
                              ...pinData,
                              newPin: e.target.value.replace(/\D/g, ""),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPin">Confirm New PIN</Label>
                        <Input
                          id="confirmPin"
                          type="password"
                          maxLength={6}
                          value={pinData.confirmPin}
                          onChange={(e) =>
                            setPinData({
                              ...pinData,
                              confirmPin: e.target.value.replace(/\D/g, ""),
                            })
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handlePinChange} disabled={isChangingPin}>
                        {isChangingPin ? "Updating..." : user?.pinHash ? "Change PIN" : "Set PIN"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Theme</h3>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark mode
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Preferences</CardTitle>
            </div>
            <CardDescription>Configure your app preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timezone
                  </div>
                </Label>
                <Select
                  value={preferences.timezone}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, timezone: value })
                  }
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {user?.hasFieldAccess && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="aiProvider">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Preferred AI Provider
                      </div>
                    </Label>
                    <Select
                      value={preferences.preferredAiProvider}
                      onValueChange={(value) =>
                        setPreferences({
                          ...preferences,
                          preferredAiProvider: value as any,
                        })
                      }
                    >
                      <SelectTrigger id="aiProvider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="groq">Groq</SelectItem>
                        <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Preferred State
                      </div>
                    </Label>
                    <Select
                      value={preferences.preferredState}
                      onValueChange={(value) =>
                        setPreferences({
                          ...preferences,
                          preferredState: value as any,
                        })
                      }
                    >
                      <SelectTrigger id="state">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VA">Virginia</SelectItem>
                        <SelectItem value="MD">Maryland</SelectItem>
                        <SelectItem value="PA">Pennsylvania</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="pt-4">
                <Button onClick={handlePreferencesUpdate}>
                  Save Preferences
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Notification settings will be available in a future update.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
