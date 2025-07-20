import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageSquare, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut,
  Star,
  ShieldCheck,
  Ear
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Mascot from "@/components/ui/Mascot"; // Thêm import Mascot

interface Topic {
  id: string;
  name: string;
  description: string;
  color: string;
}

export default function Dashboard() {
  const { profile, signOut, loading: authLoading } = useAuth(); 
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
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
    fetchTopics();
  }, []);

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

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center">
        {/* === THAY THẾ LOADER2 BẰNG MASCOT === */}
        <Mascot variant="waiting" className="w-24 h-24 animate-pulse text-primary mb-4" />
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/80 bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">OneTalk</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile.nickname}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
            </div>
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/20 text-primary text-lg">
                {profile.nickname.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <h2 className="text-4xl font-bold mb-2">Welcome back, {profile.nickname}!</h2>
          <p className="text-lg text-muted-foreground">
            How can we support you today?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="bg-card/50 border shadow-card-depth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{profile.total_sessions || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border shadow-card-depth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(profile.rating_average || 0) > 0 ? profile.rating_average.toFixed(1) : '-'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border shadow-card-depth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Listener Status</CardTitle>
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={profile.listener_status === 'verified' ? "default" : "secondary"} className="text-lg capitalize">
                {profile.listener_status}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <Card className="bg-primary/10 border-primary/50 shadow-card-depth flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Need Support?</CardTitle>
              <CardDescription>Connect with a caring listener for an anonymous 1:1 chat.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
              <Button onClick={() => navigate('/chat/start')} className="w-full h-14 text-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                Start a Conversation
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border shadow-card-depth flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Be a Listener</CardTitle>
              <CardDescription>Help others by offering your support and compassion.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
              <Button onClick={() => navigate('/listener/queue')} variant="secondary" className="w-full h-14 text-xl font-bold">
                <Ear className="w-6 h-6 mr-3" />
                Join Listener Queue
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Topics Section */}
        <Card className="bg-card/50 border shadow-card-depth">
          <CardHeader>
            <CardTitle className="text-2xl">Popular Topics</CardTitle>
            <CardDescription>Common areas where our community provides support.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {topics.map((topic) => (
                <Badge
                  key={topic.id}
                  variant="secondary"
                  className="px-4 py-2 text-base cursor-pointer hover:bg-accent transition-colors"
                >
                  {topic.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <div className="mt-10 flex flex-wrap gap-4">
          <Button variant="outline" onClick={() => navigate('/profile/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            Profile Settings
          </Button>
          <Button variant="outline" onClick={() => navigate('/mood-journal')}>
            <BookOpen className="w-4 h-4 mr-2" />
            Mood Journal
          </Button>
          <Button variant="outline" onClick={() => navigate('/history')}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat History
          </Button>
           <Button variant="outline" onClick={() => navigate('/group-chats')}>
            <Users className="w-4 h-4 mr-2" />
            Group Chats
          </Button>
        </div>
      </div>
    </div>
  );
}
