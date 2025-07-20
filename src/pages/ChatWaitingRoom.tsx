import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Mascot from '@/components/ui/Mascot'; // Import component Mascot

export default function ChatWaitingRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) {
      toast({ title: "Error", description: "Invalid session.", variant: "destructive" });
      navigate('/dashboard');
      return;
    }

    const channel = supabase
      .channel(`session-wait-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new.status === 'active') {
            toast({ title: "Connected!", description: "A listener has joined your chat." });
            navigate(`/chat/session/${sessionId}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-4">
        {/* === THAY THẾ ICON CŨ BẰNG MASCOT === */}
        <Mascot variant="waiting" className="w-32 h-32 mx-auto mb-6 animate-pulse" />
        
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
