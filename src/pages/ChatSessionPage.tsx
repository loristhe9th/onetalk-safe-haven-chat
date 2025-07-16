import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Send, LogOut, Loader2, Clock } from 'lucide-react';

// Định nghĩa kiểu dữ liệu
interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  profiles: { nickname: string };
}

interface SessionInfo {
  seeker_id: string;
  created_at: string;
  duration_minutes: number;
}

// Hàm trợ giúp để định dạng thời gian
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function ChatSessionPage() {
  const { sessionId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // === BƯỚC 1: THÊM STATE VÀ REF MỚI ===
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]); // Thêm isTyping để cuộn khi chỉ báo xuất hiện

  useEffect(() => {
    if (!sessionId) return;
    const fetchSessionInfo = async () => {
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('seeker_id, created_at, duration_minutes')
            .eq('id', sessionId)
            .single();
        if (error || !data) {
            console.error("Could not fetch session info:", error);
            toast({ title: "Error", description: "Invalid session.", variant: "destructive" });
            navigate('/dashboard');
        } else {
            setSessionInfo(data);
            const startTime = new Date(data.created_at).getTime();
            const durationSeconds = data.duration_minutes * 60;
            const now = new Date().getTime();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            const remainingSeconds = durationSeconds - elapsedSeconds;
            setTimeLeft(remainingSeconds > 0 ? remainingSeconds : 0);
        }
    };
    fetchSessionInfo();
  }, [sessionId, navigate]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if(timeLeft === 0) {
        toast({ title: "Time's up!", description: "The session has ended automatically." });
        handleEndChat();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime ? prevTime - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

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
        navigate('/dashboard');
      } else {
        setMessages(data as Message[]);
      }
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-session-${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${sessionId}`},
        (payload) => {
          const fetchNewMessage = async () => {
             const { data, error } = await supabase.from('messages').select('*, profiles(nickname)').eq('id', payload.new.id).single();
            if (!error && data) setMessages((prevMessages) => [...prevMessages, data as Message]);
          }
          fetchNewMessage();
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_sessions', filter: `id=eq.${sessionId}`},
        (payload) => {
          if (payload.new.status === 'completed' && timeLeft && timeLeft > 0) {
            if (profile?.id !== sessionInfo?.seeker_id) {
                toast({ title: "Chat Ended", description: "The other user has ended the session." });
                navigate('/dashboard');
            }
          }
        }
      )
      // === BƯỚC 2: CẬP NHẬT KÊNH REALTIME ===
      .on('broadcast', { event: 'typing' }, (payload) => {
          if (payload.payload.senderId !== profile?.id) setIsTyping(true);
      })
      .on('broadcast', { event: 'stopped-typing' }, (payload) => {
          if (payload.payload.senderId !== profile?.id) setIsTyping(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, navigate, profile, sessionInfo, timeLeft]);

  // === BƯỚC 3: THÊM HÀM XỬ LÝ GÕ PHÍM ===
  const handleTyping = () => {
    const channel = supabase.channel(`chat-session-${sessionId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { senderId: profile?.id },
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channel.send({
        type: 'broadcast',
        event: 'stopped-typing',
        payload: { senderId: profile?.id },
      });
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !profile || !sessionId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    supabase.channel(`chat-session-${sessionId}`).send({
        type: 'broadcast',
        event: 'stopped-typing',
        payload: { senderId: profile?.id },
    });

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
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleEndChat = async () => {
     if(!sessionId || !profile || !sessionInfo) return;
     await supabase.from('chat_sessions').update({ status: 'completed' }).eq('id', sessionId);
     if (profile.id === sessionInfo.seeker_id) {
         navigate(`/rate/${sessionId}`);
     } else {
         navigate('/dashboard');
     }
  }

  if (loading || timeLeft === null) {
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
            <Avatar><AvatarFallback>O</AvatarFallback></Avatar>
            <div>
                <h2 className="text-lg font-bold">Chatting</h2>
                <p className="text-xs text-muted-foreground">Session: {sessionId?.substring(0, 8)}</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 font-mono text-lg ${timeLeft < 300 ? 'text-destructive' : 'text-muted-foreground'}`}>
                <Clock className="w-5 h-5" />
                <span>{formatTime(timeLeft)}</span>
            </div>
            <Button variant="destructive" size="sm" onClick={handleEndChat}>
                <LogOut className="w-4 h-4 mr-2" />
                End Chat
            </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${ msg.sender_id === profile?.id ? 'justify-end' : 'justify-start' }`}>
            {msg.sender_id !== profile?.id && (
                <Avatar className="w-8 h-8"><AvatarFallback>{msg.profiles?.nickname?.charAt(0).toUpperCase() || 'U'}</AvatarFallback></Avatar>
            )}
            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${ msg.sender_id === profile?.id ? 'bg-primary text-primary-foreground' : 'bg-muted' }`}>
              <p className="text-sm break-words">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        {/* === BƯỚC 5: HIỂN THỊ CHỈ BÁO TRONG GIAO DIỆN === */}
        {isTyping && (
          <div className="flex items-end gap-2 justify-start">
              <Avatar className="w-8 h-8"><AvatarFallback>...</AvatarFallback></Avatar>
              <div className="p-3 rounded-lg bg-muted animate-pulse">
                  <p className="text-sm italic text-muted-foreground">is typing...</p>
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 border-t bg-background shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          {/* === BƯỚC 4: CẬP NHẬT Ô INPUT === */}
          <Input
            value={newMessage}
            onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
            }}
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
