import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import Mascot from '@/components/ui/Mascot';

// Định nghĩa kiểu dữ liệu cho tin nhắn
interface Message {
  id: string;
  role: 'user' | 'model'; // 'user' là người dùng, 'model' là AI
  content: string;
}

export default function AIChatPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Gửi tin nhắn chào mừng từ AI khi vào phòng
  useEffect(() => {
    setMessages([
      {
        id: 'initial-message',
        role: 'model',
        content: `Hi ${profile?.nickname || 'there'}, I'm your AI Listener. I'm here to listen without judgment. What's on your mind today?`
      }
    ]);
  }, [profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !profile || isLoading) return;

    const userMessageContent = newMessage.trim();
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessageContent,
    };

    // Thêm tin nhắn của người dùng vào UI và hiển thị trạng thái AI đang gõ
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      // Chuẩn bị lịch sử chat cho API
      const historyForApi = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));
      historyForApi.push({ role: 'user', parts: [{ text: userMessageContent }] });

      const payload = { contents: historyForApi };
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const result = await response.json();
      
      let aiResponseContent = "I'm sorry, I'm having trouble connecting right now. Please try again later.";
      if (result.candidates && result.candidates.length > 0) {
        aiResponseContent = result.candidates[0].content.parts[0].text;
      }
      
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        content: aiResponseContent,
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
      console.error("Error calling Gemini API:", error);
      toast({ title: "Error", description: "Could not get a response from the AI.", variant: "destructive" });
       // Khôi phục tin nhắn nếu gửi lỗi
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      setNewMessage(userMessageContent);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
                <Mascot variant="happy" className="w-10 h-10" />
                <h2 className="text-lg font-bold">AI Listener</h2>
            </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'model' && (
                <Mascot variant="listening" className="w-10 h-10 shrink-0" />
            )}
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted rounded-bl-none'
              }`}
            >
              <p className="text-sm break-words">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-end gap-2 justify-start">
                <Mascot variant="typing" className="w-10 h-10 opacity-70" />
                <div className="p-3 rounded-lg bg-muted animate-pulse">
                    <p className="text-sm italic text-muted-foreground">is thinking...</p>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 border-t bg-background shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Talk about anything..."
            autoComplete="off"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !newMessage.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </footer>
    </div>
  );
}
