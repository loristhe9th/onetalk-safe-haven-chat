import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Send, ArrowLeft, Loader2, Users } from 'lucide-react';
import Mascot from '@/components/ui/Mascot';

// Định nghĩa kiểu dữ liệu cho tin nhắn nhóm
interface GroupMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  profiles: { nickname: string }; // Dữ liệu join từ bảng profiles
}

// Định nghĩa kiểu dữ liệu cho thông tin phòng
interface RoomInfo {
    id: string;
    name: string;
}

export default function GroupChatPage() {
  const { roomId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Lấy dữ liệu và lắng nghe tin nhắn mới
  useEffect(() => {
    if (!roomId) return;

    const fetchData = async () => {
      setLoading(true);

      // 1. Lấy thông tin phòng
      const { data: roomData, error: roomError } = await supabase
        .from('group_rooms')
        .select('id, name')
        .eq('id', roomId)
        .single();

      if (roomError || !roomData) {
        toast({ title: "Error", description: "Room not found.", variant: "destructive" });
        navigate('/group-chats');
        return;
      }
      setRoomInfo(roomData);

      // 2. Lấy các tin nhắn đã có trong phòng
      const { data: messagesData, error: messagesError } = await supabase
        .from('group_messages')
        .select('*, profiles(nickname)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      
      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
      } else {
        setMessages(messagesData as GroupMessage[]);
      }
      setLoading(false);
    };

    fetchData();

    // 3. Lắng nghe các tin nhắn mới được thêm vào
    const channel = supabase
      .channel(`group-chat-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // Khi có tin nhắn mới, fetch lại tin nhắn đó kèm profile
          const fetchNewMessage = async () => {
             const { data, error } = await supabase
              .from('group_messages')
              .select('*, profiles(nickname)')
              .eq('id', payload.new.id)
              .single();
            if (!error && data) {
               setMessages((prevMessages) => [...prevMessages, data as GroupMessage]);
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
  }, [roomId, navigate]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !profile || !roomId) return;

    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('group_messages').insert({
      content: content,
      room_id: roomId,
      sender_id: profile.id,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
      setNewMessage(content);
    }
  };

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
            <Button variant="ghost" size="icon" onClick={() => navigate('/group-chats')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
                <Users className="w-6 h-6 text-primary" />
                <h2 className="text-lg font-bold">{roomInfo?.name || 'Group Chat'}</h2>
            </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender_id === profile?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            {/* Hiển thị avatar và nickname cho người khác */}
            {msg.sender_id !== profile?.id && (
                <div className="flex flex-col items-center shrink-0">
                    <Mascot variant="happy" className="w-10 h-10" />
                    <span className="text-xs text-muted-foreground mt-1 max-w-[60px] truncate">{msg.profiles?.nickname}</span>
                </div>
            )}
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                msg.sender_id === profile?.id
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted rounded-bl-none'
              }`}
            >
              <p className="text-sm break-words">{msg.content}</p>
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
            placeholder="Type a message..."
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
