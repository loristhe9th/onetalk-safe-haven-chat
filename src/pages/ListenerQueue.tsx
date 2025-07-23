import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Users, MessageSquareText, Clock, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

// Định nghĩa kiểu dữ liệu cho một phiên chat đang chờ
interface WaitingSession {
  id: string;
  created_at: string;
  description: string | null;
  topics: { name: string } | null;
}

export default function ListenerQueue() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [waitingSessions, setWaitingSessions] = useState<WaitingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Lấy danh sách các phiên đang chờ ban đầu
  useEffect(() => {
    if (!profile || profile.listener_status !== 'verified') return;

    const fetchWaitingSessions = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          created_at,
          description,
          topics ( name )
        `)
        .eq('status', 'waiting')
        .gt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Chỉ lấy các session trong 10 phút gần đây
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching waiting sessions:", error);
        toast({ title: "Error", description: "Could not load the queue.", variant: "destructive" });
      } else {
        setWaitingSessions(data as WaitingSession[]);
      }
      setIsLoading(false);
    };

    fetchWaitingSessions();
  }, [profile]);

  // Lắng nghe các thay đổi Realtime trên hàng chờ
  useEffect(() => {
    const channel = supabase
      .channel('waiting-sessions-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions', filter: 'status=eq.waiting' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newSession = payload.new as WaitingSession;
            const fetchFullNewSession = async () => {
              const { data } = await supabase.from('chat_sessions').select('*, topics(name)').eq('id', newSession.id).single();
              if (data) setWaitingSessions(prev => [...prev, data as WaitingSession]);
            }
            fetchFullNewSession();
          } else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            const oldSessionId = payload.old.id;
            setWaitingSessions(prev => prev.filter(s => s.id !== oldSessionId));
          }
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleClaimSession = async (sessionId: string) => {
    if (!profile) return;
    setClaimingId(sessionId);

    try {
      // === SỬA LỖI Ở ĐÂY: GỌI ĐÚNG HÀM 'claim_session' ===
      const { data: success, error } = await supabase.rpc('claim_session', {
        session_id_to_claim: sessionId,
        claiming_listener_id: profile.id
      });

      if (error) throw error;

      if (success) {
        toast({ title: "Success!", description: "You have claimed the session. Connecting..." });
        navigate(`/chat/session/${sessionId}`);
      } else {
        toast({ title: "Session Claimed", description: "Another listener has already taken this session.", variant: "destructive" });
        setWaitingSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (error: any) {
      console.error("Error claiming session:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setClaimingId(null);
    }
  };

  if (authLoading || !profile) {
    return ( <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> );
  }
  
  if (profile.listener_status !== 'verified') {
     navigate('/listener/onboarding');
     return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold ml-4">Listener Queue</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
      ) : waitingSessions.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">The Queue is Empty</h2>
          <p className="text-muted-foreground mt-2">There are currently no users waiting to chat. Please check back soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {waitingSessions.map((session) => (
            <Card key={session.id} className="bg-card/80 backdrop-blur-sm border shadow-card-depth">
              <CardHeader>
                <CardTitle>A user is waiting to talk about: <span className="text-primary">{session.topics?.name || 'General'}</span></CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {session.description && (
                  <div className="p-3 bg-muted rounded-lg border">
                    <p className="text-sm italic text-muted-foreground">"{session.description}"</p>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Waiting for {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}</span>
                  </div>
                  <Button onClick={() => handleClaimSession(session.id)} disabled={!!claimingId}>
                    {claimingId === session.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <MessageSquareText className="w-4 h-4 mr-2" />
                        Join Chat
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
