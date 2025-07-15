import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut,
  Star,
  Timer,
  Shield
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  nickname: string;
  avatar_id: string;
  bio: string | null;
  role: 'seeker' | 'listener' | 'expert';
  rating_average: number;
  rating_count: number;
  total_sessions: number;
  is_available: boolean;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  color: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchTopics();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const handleStartChat = () => {
    navigate('/chat/start');
  };

  const handleJoinAsListener = () => {
    navigate('/listener/queue');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You've been safely signed out of OneTalk",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Heart className="w-8 h-8 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">OneTalk</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {profile?.nickname.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium">{profile?.nickname}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {profile?.nickname}!</h2>
          <p className="text-muted-foreground">
            How can we support you today? Choose an option below to get started.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-safe-green/10 to-safe-green/5 border-safe-green/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <MessageCircle className="h-4 w-4 text-safe-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.total_sessions || 0}</div>
              <p className="text-xs text-muted-foreground">Conversations completed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warm-orange/10 to-warm-orange/5 border-warm-orange/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-warm-orange" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.rating_average > 0 ? profile.rating_average.toFixed(1) : '-'}
              </div>
              <p className="text-xs text-muted-foreground">
                {profile?.rating_count || 0} reviews
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-trust-teal/10 to-trust-teal/5 border-trust-teal/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Shield className="h-4 w-4 text-trust-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant={profile?.is_available ? "default" : "secondary"}>
                  {profile?.is_available ? "Available" : "Offline"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Current availability</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Start Conversation */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-primary" />
                <span>Need Support?</span>
              </CardTitle>
              <CardDescription>
                Connect with a caring listener who will provide emotional support and understanding.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Timer className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">30 min sessions</p>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Shield className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Anonymous & Safe</p>
                </div>
              </div>
              <Button onClick={handleStartChat} className="w-full" size="lg">
                Start a Conversation
              </Button>
            </CardContent>
          </Card>

          {/* Become a Listener */}
          <Card className="bg-gradient-to-br from-safe-green/10 to-safe-green/5 border-safe-green/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-safe-green" />
                <span>Be a Listener</span>
              </CardTitle>
              <CardDescription>
                Help others by offering your support and compassion to those who need it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Heart className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Make a difference</p>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Star className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Build reputation</p>
                </div>
              </div>
              <Button onClick={handleJoinAsListener} variant="outline" className="w-full" size="lg">
                Join Listener Queue
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Topics Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Popular Topics</span>
            </CardTitle>
            <CardDescription>
              Common areas where our community provides support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {topics.map((topic) => (
                <Badge
                  key={topic.id}
                  variant="secondary"
                  className="px-3 py-2 justify-center text-center"
                  style={{ borderColor: topic.color + '40', backgroundColor: topic.color + '10' }}
                >
                  {topic.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Button variant="outline" onClick={() => navigate('/profile')}>
            <Settings className="w-4 h-4 mr-2" />
            Profile Settings
          </Button>
          <Button variant="outline" onClick={() => navigate('/mood-journal')}>
            <BookOpen className="w-4 h-4 mr-2" />
            Mood Journal
          </Button>
          <Button variant="outline" onClick={() => navigate('/history')}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat History
          </Button>
        </div>
      </div>
    </div>
  );
}