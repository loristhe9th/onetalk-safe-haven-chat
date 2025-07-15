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
  profile_id: string;
  profiles: { nickname: string }; // Dữ liệu join từ bảng profiles
}

export default function ChatSessionPage() {
  const { sessionId } = useParams();
  const { user, profile } = useAuth(); // Lấy profile từ hook đã nâng cấp
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Lấy dữ liệu và lắng nghe tin nhắn mới
  useEffect(() => {
    if (!sessionId) return;

    // 1. Lấy các tin nhắn đã có trong phòng chat
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, profiles(nickname)') // Join với bảng profiles để lấy nickname
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

    // 2. Lắng nghe các tin nhắn mới được thêm vào (INSERT)
    const channel = supabase
      .channel(`chat-session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          // Khi có tin nhắn mới, fetch lại tin nhắn đó kèm profile
          const fetchNewMessage = async () => {
             const { data, error } = await supabase
              .from('chat_messages')
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
      .subscribe();

    // Dọn dẹp listener khi rời khỏi trang
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, navigate]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !profile || !sessionId) return;

    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('chat_messages').insert({
      content: content,
      session_id: sessionId,
      profile_id: profile.id, // profile.id của người dùng hiện tại
    });

    if (error) {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
      setNewMessage(content); // Trả lại nội dung đã gõ nếu gửi lỗi
    }
  };
  
  const handleEndChat = async () => {
     if(!sessionId) return;
     await supabase.from('chat_sessions').update({ status: 'completed' }).eq('id', sessionId);
     toast({ title: "Chat Ended", description: "The chat session has been completed."});
     navigate('/dashboard');
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
              msg.profile_id === profile?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.profile_id !== profile?.id && (
                <Avatar className="w-8 h-8">
                    <AvatarFallback>{msg.profiles?.nickname?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
            )}
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                msg.profile_id === profile?.id
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