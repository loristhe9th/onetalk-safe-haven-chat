import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ChatWaitingRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) {
      // Nếu không có sessionId, quay về dashboard
      toast({ title: "Error", description: "Invalid session.", variant: "destructive" });
      navigate('/dashboard');
      return;
    }

    // Tạo một kênh lắng nghe (channel) riêng cho phiên chat này
    const channel = supabase
      .channel(`session-wait-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${sessionId}`, // Chỉ lắng nghe thay đổi trên đúng dòng này
        },
        (payload) => {
          // Khi có cập nhật, kiểm tra xem trạng thái có phải là 'active' không
          if (payload.new.status === 'active') {
            toast({ title: "Connected!", description: "A listener has joined your chat." });
            // Nếu đúng, điều hướng đến phòng chat
            navigate(`/chat/session/${sessionId}`);
          }
        }
      )
      .subscribe();

    // Rất quan trọng: Dọn dẹp listener khi người dùng rời khỏi trang
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-4">
        <div className="relative mb-6 inline-block">
          <Heart className="w-16 h-16 text-primary opacity-20" />
          <Loader2 className="w-16 h-16 text-primary absolute top-0 left-0 animate-spin" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Finding a listener...</h1>
        <p className="text-muted-foreground mb-4">
          Please wait while we connect you.
        </p>
        <p className="text-xs text-muted-foreground mt-8">
          Session ID: {sessionId}
        </p>
      </div>
    </div>
  );
}