import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SessionInfo {
  seeker_id: string;
  listener_id: string;
}

export default function RatingPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  // Lấy thông tin phiên chat để xác thực
  useEffect(() => {
    const fetchSessionInfo = async () => {
      if (!sessionId || !profile) return;

      const { data, error } = await supabase
        .from('chat_sessions')
        .select('seeker_id, listener_id')
        .eq('id', sessionId)
        .single();
      
      if (error || !data) {
        toast({ title: "Error", description: "Invalid session.", variant: "destructive" });
        navigate('/dashboard');
        return;
      }

      // Chỉ Seeker mới có quyền đánh giá
      if (data.seeker_id !== profile.id) {
        toast({ title: "Thank you!", description: "The session has ended." });
        navigate('/dashboard');
        return;
      }
      
      setSessionInfo(data);
    };

    fetchSessionInfo();
  }, [sessionId, profile, navigate]);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('submit_rating', {
        session_id_to_rate: sessionId,
        rating_value: rating,
        comment_text: comment,
      });

      if (error) throw error;

      toast({ title: "Thank you!", description: "Your feedback has been submitted." });
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Error submitting rating:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!sessionInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Rate Your Conversation</CardTitle>
          <CardDescription>
            Your feedback helps us improve the community. How was your experience?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-10 h-10 cursor-pointer transition-colors ${
                  (hoverRating || rating) >= star
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              />
            ))}
          </div>

          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Add a comment (optional)
            </label>
            <Textarea
              id="comment"
              placeholder="Tell us more about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <Button onClick={handleSubmitRating} disabled={isLoading} className="w-full">
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
