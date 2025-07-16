import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Heart, 
  Users, 
  Star, 
  Clock,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Topic {
  id: string;
  name: string;
  description: string;
  color: string;
}

// KHÔNG CẦN INTERFACE PROFILE Ở ĐÂY NỮA

export default function ChatStart() {
  // Lấy profile và trạng thái loading trực tiếp từ useAuth
  const { profile, loading: authLoading } = useAuth(); 
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [listenerType, setListenerType] = useState<"listener" | "expert">("listener");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Chỉ cần fetch topics khi component được tạo
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

  // KHÔNG CẦN HÀM fetchProfile Ở ĐÂY NỮA

  const handleStartChat = async () => {
    if (!selectedTopic) {
      toast({
        variant: "destructive",
        title: "Please select a topic",
        description: "Choose what you'd like to talk about",
      });
      return;
    }

    if (!profile) {
      toast({
        variant: "destructive",
        title: "Profile not found",
        description: "Unable to start chat session. Please try logging in again.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
          seeker_id: profile.id, // Dùng profile.id trực tiếp từ useAuth
          topic_id: selectedTopic,
          status: 'waiting',
          // is_emergency: isEmergency, // Cột này có thể không còn cần thiết
          duration_minutes: 30
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Looking for a listener...",
        description: "We're finding the perfect person to chat with you",
      });

      navigate(`/chat/waiting/${session.id}`);
    } catch (error: any) {
      console.error('Error creating chat session:', error);
      toast({
        variant: "destructive",
        title: "Failed to start chat",
        description: error.message || "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thêm màn hình chờ trong lúc kiểm tra profile
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <Heart className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Start a Conversation</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-8">
          {/* Emergency Notice */}
          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-500">
                <AlertTriangle className="w-5 h-5" />
                <span>Crisis Support</span>
              </CardTitle>
              <CardDescription>
                If you're in immediate danger or having thoughts of self-harm, please contact emergency services 
                or a crisis hotline immediately. OneTalk listeners are caring volunteers, not professional counselors.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Topic Selection */}
          <Card>
            <CardHeader>
              <CardTitle>What would you like to talk about?</CardTitle>
              <CardDescription>
                Choose a topic that best describes what's on your mind
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topics.map((topic) => (
                  <label
                    key={topic.id}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTopic === topic.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="topic"
                      value={topic.id}
                      checked={selectedTopic === topic.id}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: topic.color }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{topic.name}</div>
                      <div className="text-sm text-muted-foreground">{topic.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Listener Type */}
          <Card>
            <CardHeader>
              <CardTitle>Choose your support type</CardTitle>
              <CardDescription>
                Different types of support are available based on your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={listenerType} onValueChange={(value: "listener" | "expert") => setListenerType(value)}>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border">
                    <RadioGroupItem value="listener" id="listener" />
                    <Label htmlFor="listener" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-green-500" />
                            <span className="font-medium">Peer Listener</span>
                            <Badge variant="secondary">Free</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Caring volunteers who provide emotional support and active listening
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border opacity-50 cursor-not-allowed">
                    <RadioGroupItem value="expert" id="expert" disabled />
                    <Label htmlFor="expert" className="flex-1 cursor-not-allowed">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium">Professional Expert</span>
                            <Badge>Premium</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Licensed counselors and therapists for professional guidance (Coming Soon)
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Tell us more (optional)</CardTitle>
              <CardDescription>
                Share more details about what you're going through to help us match you better
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe what's on your mind or what kind of support you're looking for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Start Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleStartChat} 
              disabled={isSubmitting || !selectedTopic}
              size="lg"
              className="px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finding a listener...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Start Conversation
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}