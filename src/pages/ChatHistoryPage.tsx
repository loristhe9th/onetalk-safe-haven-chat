import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import { format } from 'date-fns';

// Định nghĩa kiểu dữ liệu cho một phiên chat trong lịch sử
interface HistorySession {
  id: string;
  created_at: string;
  status: 'completed' | 'active' | 'waiting';
  // Lấy thông tin từ các bảng liên quan
  topics: { name: string } | null;
  seeker: { nickname: string } | null;
  listener: { nickname: string } | null;
}

export default function ChatHistoryPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          created_at,
          status,
          topics ( name ),
          seeker:seeker_id ( nickname ),
          listener:listener_id ( nickname )
        `)
        .or(`seeker_id.eq.${profile.id},listener_id.eq.${profile.id}`)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching chat history:", error);
      } else {
        setHistory(data as HistorySession[]);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold ml-4">Nhật ký Hoạt động</h1>
      </div>
      
      {history.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Chưa có cuộc trò chuyện nào</h2>
          <p className="text-muted-foreground mt-2">Các cuộc trò chuyện đã hoàn thành sẽ xuất hiện ở đây.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((session) => {
            const partner = profile?.nickname === session.seeker?.nickname
              ? session.listener
              : session.seeker;
            
            return (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Cuộc trò chuyện
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(session.created_at), 'MMMM d, yyyy')}</span>
                      </CardDescription>
                    </div>
                    <Badge variant="outline">Đã hoàn thành</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                     <User className="w-4 h-4" />
                     <span>Bạn đã trò chuyện với: </span>
                     <span className="font-semibold text-foreground">{partner?.nickname || 'một người ẩn danh'}</span>
                  </div>
                   <div className="flex items-center gap-2">
                     <Tag className="w-4 h-4" />
                     <span>Chủ đề: </span>
                     <span className="font-semibold text-foreground">{session.topics?.name || 'Chung'}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  );
}
