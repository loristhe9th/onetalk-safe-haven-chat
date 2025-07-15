import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Send, LogOut } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  created_at: string;
  profile_id: string;
  profiles: { nickname: string }; // Giả định có join để lấy nickname
}

interface Session {
  id: string;
  seeker_id: string;
  listener_id: string;
}

export default function ChatSessionPage() {
  const { sessionId } = useParams();
  const { user, profile } = useAuth(); // Giả định useAuth trả về cả profile
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Lấy dữ liệu phiên và tin nhắn cũ, sau đó lắng nghe tin nhắn mới
  useEffect(() => {
    if (!sessionId) return;

    // 1. Lấy thông tin phiên chat
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (error) {
        toast({ title: "Error", description: "Could not load session.", variant: "destructive" });
        navigate('/');
      } else {
        setSession(data);
      }
    };

    // 2. Lấy các tin nhắn đã có
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, profiles(nickname)') // Join với bảng profiles để lấy nickname
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data as Message[]);
      }
    };

    fetchSession();
    fetchMessages();

    // 3. Lắng nghe tin nhắn mới trong thời gian thực
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
          // Cần fetch lại tin nhắn có join để lấy nickname
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

    // Dọn dẹp subscription khi component bị unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, navigate]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !profile || !session) return;

    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('chat_messages').insert({
      content: content,
      session_id: session.id,
      profile_id: profile.id, // profile.id của người dùng hiện tại
    });

    if (error) {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
      setNewMessage(content); // Khôi phục lại tin nhắn nếu gửi lỗi
    }
  };
  
  const handleEndChat = async () => {
     if(!session) return;
     // Cập nhật trạng thái session thành 'completed'
     await supabase.from('chat_sessions').update({ status: 'completed' }).eq('id', session.id);
     toast({ title: "Chat Ended", description: "The chat session has been completed."});
     navigate('/dashboard');
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
            <Avatar>
                <AvatarFallback>O</AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-bold">Chatting</h2>
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
                    <AvatarFallback>{msg.profiles?.nickname?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
            )}
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                msg.profile_id === profile?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
}