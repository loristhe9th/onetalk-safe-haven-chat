import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Heart, 
  Users, 
  Star, 
  BrainCircuit,
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

export default function ChatStart() {
  const { profile, loading: authLoading } = useAuth(); 
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  // Bỏ 'expert' khỏi kiểu dữ liệu vì nó đã bị vô hiệu hóa
  const [listenerType, setListenerType] = useState<"listener" | "ai">("ai");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const { data, error } = await supabase.from('topics').select('*').eq('is_active', true).order('name');
        if (error) throw error;
        setTopics(data || []);
      } catch (error) {
        console.error('Error fetching topics:', error);
      }
    };
    fetchTopics();
  }, []);

  const handleStartChat = async () => {
    if (listenerType === 'ai') {
      navigate('/ai-chat');
      return;
    }

    if (!selectedTopic) {
      toast({ variant: "destructive", title: "Please select a topic" });
      return;
    }
    if (!profile) {
      toast({ variant: "destructive", title: "Profile not found" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
          seeker_id: profile.id,
          topic_id: selectedTopic,
          status: 'waiting',
          duration_minutes: 30,
          description: description.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Looking for a listener..." });
      navigate(`/chat/waiting/${session.id}`);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to start chat", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return ( <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20">
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

          <Card>
            <CardHeader>
              <CardTitle>Choose your support type</CardTitle>
              <CardDescription>Select who you would like to talk to.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={listenerType} onValueChange={(value: "listener" | "ai") => setListenerType(value)}>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border-2 transition-all ${listenerType === 'ai' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="ai" id="ai" />
                      <Label htmlFor="ai" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-2"><BrainCircuit className="w-5 h-5 text-primary" /><span className="font-semibold text-lg">AI Listener</span></div>
                        <div className="text-sm text-muted-foreground mt-1">Chat instantly with an empathetic AI, available 24/7.</div>
                      </Label>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg border-2 transition-all ${listenerType === 'listener' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="listener" id="listener" />
                      <Label htmlFor="listener" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-2"><Users className="w-5 h-5 text-green-500" /><span className="font-semibold text-lg">Peer Listener</span></div>
                        <div className="text-sm text-muted-foreground mt-1">Connect with a caring volunteer from our community.</div>
                      </Label>
                    </div>
                  </div>

                  {/* === PHẦN ĐƯỢC CẬP NHẬT: VÔ HIỆU HÓA LỰA CHỌN EXPERT === */}
                  <div className="p-4 rounded-lg border-2 transition-all opacity-50 cursor-not-allowed">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="expert" id="expert" disabled />
                      <Label htmlFor="expert" className="flex-1 cursor-not-allowed">
                        <div className="flex items-center space-x-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            <span className="font-semibold text-lg">Professional Expert</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            Schedule a paid session with a licensed counselor. (Coming Soon)
                        </div>
                      </Label>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {listenerType === 'listener' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>What would you like to talk about?</CardTitle>
                  <CardDescription>Choose a topic that best describes what's on your mind</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {topics.map((topic) => (
                      <label key={topic.id} className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedTopic === topic.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                        <input type="radio" name="topic" value={topic.id} checked={selectedTopic === topic.id} onChange={(e) => setSelectedTopic(e.target.value)} className="sr-only" />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: topic.color }} />
                        <div className="flex-1">
                          <div className="font-medium">{topic.name}</div>
                          <div className="text-sm text-muted-foreground">{topic.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Tell us more (optional)</CardTitle>
                  <CardDescription>Share more details to help us match you better</CardDescription>
                </Header>
                <CardContent>
                  <Textarea placeholder="Describe what's on your mind..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="resize-none" />
                </CardContent>
              </Card>
            </>
          )}

          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleStartChat} 
              disabled={isSubmitting || (listenerType === 'listener' && !selectedTopic)}
              size="lg"
              className="h-14 text-xl font-bold w-full max-w-xs"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Start Conversation'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}