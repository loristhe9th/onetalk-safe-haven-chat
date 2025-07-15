import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Send, LogOut, Loader2 } from 'lucide-react';

// Định nghĩa kiểu dữ liệu
interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  profiles: { nickname: string };
}

// <-- THÊM: Định nghĩa kiểu dữ liệu cho thông tin phiên chat
interface SessionInfo {
  seeker_id: string;
}

export default function ChatSessionPage() {
  const { sessionId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // <-- THÊM: State để lưu thông tin phiên chat
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // <-- THÊM: useEffect mới để lấy thông tin seeker_id của phiên chat
  useEffect(() => {
    if (!sessionId) return;
    const fetchSessionInfo = async () => {
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('seeker_id')
            .eq('id', sessionId)
            .single();
        if (error) {
            console.error("Could not fetch session info:", error);
            navigate('/dashboard');
        } else {
            setSessionInfo(data);
        }
    };
    fetchSessionInfo();
  }, [sessionId, navigate]);

  useEffect(() => {
    if (!sessionId) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(nickname)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Error fetching messages:", error);
        toast({ title: "Error", description: "Could not load messages.", variant: "destructive" });
        navigate('/dashboard');
      } else {
        setMessages(data as Message[]);
      }
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-session-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${sessionId}`},
        (payload) => {
          const fetchNewMessage = async () => {
             const { data, error } = await supabase
              .from('messages')
              .select('*, profiles(nickname)')
              .eq('id', payload.new.id)
              .single();
            if (!error && data) {
               setMessages((prevMessages) => [...prevMessages, data as Message]);
            }
          }
          fetchNewMessage();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_sessions', filter: `id=eq.${sessionId}`},
        (payload) => {
          if (payload.new.status === 'completed') {
            // Kiểm tra để không điều hướng người vừa nhấn nút End Chat
            if (profile?.id !== sessionInfo?.seeker_id) {
                toast({ title: "Chat Ended", description: "The other user has ended the session." });
                navigate('/dashboard');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, navigate, profile, sessionInfo]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !profile || !sessionId) return;

    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      content: content,
      session_id: sessionId,
      sender_id: profile.id,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
      setNewMessage(content);
    }
  };
  
  // <-- SỬA: Cập nhật toàn bộ hàm handleEndChat
  const handleEndChat = async () => {
     if(!sessionId || !profile || !sessionInfo) return;

     // Cập nhật trạng thái session thành 'completed'
     await supabase.from('chat_sessions').update({ status: 'completed' }).eq('id', sessionId);

     // Kiểm tra vai trò của người dùng hiện tại
     if (profile.id === sessionInfo.seeker_id) {
         // Nếu là Seeker, chuyển đến trang đánh giá
         toast({ title: "Chat Ended", description: "Please rate your experience." });
         navigate(`/rate/${sessionId}`);
     } else {
         // Nếu là Listener, chuyển về trang chủ
         toast({ title: "Chat Ended", description: "The session has been completed." });
         navigate('/dashboard');
     }
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center space-x-3">
            <Avatar>
                <AvatarFallback>O</AvatarFallback>
            </Avatar>
            <div>
                <h2 className="text-lg font-bold">Chatting</h2>
                <p className="text-xs text-muted-foreground">Session: {sessionId?.substring(0, 8)}</p>
            </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleEndChat}>
            <LogOut className="w-4 h-4 mr-2" />
            End Chat
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${
              msg.sender_id === profile?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender_id !== profile?.id && (
                <Avatar className="w-8 h-8">
                    <AvatarFallback>{msg.profiles?.nickname?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
            )}
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                msg.sender_id === profile?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm break-words">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>
      <footer className="p-4 border-t bg-background shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
