import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Share2,
  QrCode,
  Check,
} from "lucide-react";
import QRCode from "qrcode";

interface PublicProfile {
  id: number;
  slug: string;
  firstName: string;
  lastName: string;
  position: string | null;
  department: string | null;
  avatar: string | null;
  publicBio: string | null;
  publicPhone: string | null;
  publicEmail: string | null;
}

export function PublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProfile();
      generateQRCode();
    }
  }, [slug]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/public/employees/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        toast({
          title: "Profile not found",
          description: "This employee profile is not available.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      const url = `${window.location.origin}/team/${slug}`;
      const qrUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.firstName} ${profile?.lastName} - Profile`,
          text: profile?.publicBio || undefined,
          url,
        });
        return;
      } catch (error) {
        // Fall through to clipboard copy
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Profile URL copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Profile Not Found</h2>
          <p className="text-slate-600 mb-4">This employee profile is not available.</p>
          <Link to="/directory">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/directory">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Directory
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold">
                    {profile.avatar || `${profile.firstName[0]}${profile.lastName[0]}`}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    {profile.firstName} {profile.lastName}
                  </h1>

                  <div className="space-y-3">
                    {profile.position && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Briefcase className="h-5 w-5 text-slate-400" />
                        <span className="text-lg">{profile.position}</span>
                      </div>
                    )}

                    {profile.department && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-slate-400" />
                        <Badge variant="secondary" className="text-base px-3 py-1">
                          {profile.department}
                        </Badge>
                      </div>
                    )}

                    {profile.publicBio && (
                      <p className="text-slate-600 mt-4 leading-relaxed">{profile.publicBio}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t">
                <Button onClick={handleShare} variant="outline" className="gap-2">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Share Profile
                    </>
                  )}
                </Button>
                <Button onClick={() => setShowQR(!showQR)} variant="outline" className="gap-2">
                  <QrCode className="h-4 w-4" />
                  {showQR ? "Hide" : "Show"} QR Code
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Card */}
          {showQR && qrCodeUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Scan to View Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-inner">
                  <img src={qrCodeUrl} alt="Profile QR Code" className="w-64 h-64" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          {(profile.publicEmail || profile.publicPhone) && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.publicEmail && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <a
                        href={`mailto:${profile.publicEmail}`}
                        className="text-blue-600 hover:underline"
                      >
                        {profile.publicEmail}
                      </a>
                    </div>
                  </div>
                )}

                {profile.publicPhone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Phone</p>
                      <a
                        href={`tel:${profile.publicPhone}`}
                        className="text-green-600 hover:underline"
                      >
                        {profile.publicPhone}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
