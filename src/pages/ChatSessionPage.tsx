import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, Profile } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Send, LogOut, Loader2, Clock, PlusCircle } from 'lucide-react';
import Mascot from '@/components/ui/Mascot';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  profiles: { nickname: string };
}

interface SessionInfo {
  seeker_id: string;
  listener_id: string;
  created_at: string;
  duration_minutes: number;
  extended_duration_minutes: number;
  status: 'waiting' | 'active' | 'completed';
}

const formatTime = (seconds: number) => {
  if (seconds < 0) return '00:00';
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
  const [isTyping, setIsTyping] = useState(false);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionRequest, setExtensionRequest] = useState<{ minutes: number; price: number } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleEndChat = useCallback(async (showToast = true) => {
    if (!sessionId || !sessionInfo || sessionInfo.status === 'completed') return;
    await supabase.from('chat_sessions').update({ status: 'completed' }).eq('id', sessionId);
    if (showToast) {
      toast({ title: "Chat Ended", description: "The session has been completed." });
    }
    if (profile?.id === sessionInfo.seeker_id) {
      navigate(`/rate/${sessionId}`);
    } else {
      navigate('/dashboard');
    }
  }, [sessionId, profile, sessionInfo, navigate]);

  // useEffect để lấy dữ liệu ban đầu
  useEffect(() => {
    if (!sessionId || !profile) return;
    
    const fetchInitialData = async () => {
      setLoading(true);

      // === SỬA LỖI Ở ĐÂY: GỌI HÀM LẤY GIỜ SERVER ===
      const { data: serverNow, error: timeError } = await supabase.rpc('get_server_time');
      if (timeError) {
          toast({ title: "Error", description: "Could not sync with server time.", variant: "destructive" });
          navigate('/dashboard');
          return;
      }
      const now = new Date(serverNow).getTime();

      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*, seeker_id, listener_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData || sessionData.status === 'completed') {
        toast({ title: "Session Ended", description: "This chat session is no longer active.", variant: "destructive" });
        navigate('/dashboard');
        return;
      }
      setSessionInfo(sessionData as SessionInfo);

      const otherUserId = sessionData.seeker_id === profile.id ? sessionData.listener_id : sessionData.seeker_id;
      if (otherUserId) {
        const { data: otherUserData } = await supabase.from('profiles').select('*').eq('id', otherUserId).single();
        setOtherUser(otherUserData as Profile);
      }

      const { data: messagesData } = await supabase.from('messages').select('*, profiles(nickname)').eq('session_id', sessionId).order('created_at', { ascending: true });
      setMessages((messagesData as Message[]) || []);

      const startTime = new Date(sessionData.created_at).getTime();
      const totalDurationSeconds = (sessionData.duration_minutes + (sessionData.extended_duration_minutes || 0)) * 60;
      
      // === SỬA LỖI Ở ĐÂY: SỬ DỤNG GIỜ SERVER ĐỂ TÍNH TOÁN ===
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      setTimeLeft(totalDurationSeconds - elapsedSeconds);
      
      setLoading(false);
    };

    fetchInitialData();
  }, [sessionId, navigate, profile]);

  // useEffect cho bộ đếm thời gian
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      if (timeLeft === 0) {
        toast({ title: "Time's up!", description: "The session has ended automatically." });
        handleEndChat(false);
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => (prev ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleEndChat]);
  
  // useEffect cho Realtime
  useEffect(() => {
    if (!sessionId || !otherUser) return;
    const channel = supabase.channel(`chat-session-${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', table: 'messages', filter: `session_id=eq.${sessionId}`}, 
        (payload) => {
          const newMessageData = payload.new as Omit<Message, 'profiles'>;
          if (newMessageData.sender_id === profile?.id) return;
          const fullMessage: Message = { ...newMessageData, profiles: { nickname: otherUser.nickname } };
          setMessages((prev) => [...prev, fullMessage]);
        }
      )
      .on('postgres_changes', { event: 'UPDATE', table: 'chat_sessions', filter: `id=eq.${sessionId}`}, 
        (payload) => {
          const newStatus = payload.new.status;
          const newExtendedDuration = payload.new.extended_duration_minutes;
          if (newStatus === 'completed') {
            toast({ title: "Chat Ended", description: "The other user has ended the session." });
            handleEndChat(false);
          }
          if (newExtendedDuration > (sessionInfo?.extended_duration_minutes || 0)) {
            const addedMinutes = newExtendedDuration - (sessionInfo?.extended_duration_minutes || 0);
            setTimeLeft(prev => (prev || 0) + addedMinutes * 60);
            setSessionInfo(prev => prev ? { ...prev, extended_duration_minutes: newExtendedDuration } : null);
            toast({ title: "Session Extended!", description: `${addedMinutes} minutes have been added.` });
          }
        }
      )
      .on('broadcast', { event: 'extension-request' }, 
        (payload) => {
          if (profile?.id !== sessionInfo?.seeker_id) {
            setExtensionRequest(payload.payload.package);
          }
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => { if (payload.payload.senderId !== profile?.id) setIsTyping(true); })
      .on('broadcast', { event: 'stopped-typing' }, (payload) => { if (payload.payload.senderId !== profile?.id) setIsTyping(false); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, profile, otherUser, handleEndChat, sessionInfo]);

  const handleTyping = () => {
    const channel = supabase.channel(`chat-session-${sessionId}`);
    channel.send({ type: 'broadcast', event: 'typing', payload: { senderId: profile?.id } });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channel.send({ type: 'broadcast', event: 'stopped-typing', payload: { senderId: profile?.id } });
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !profile || !sessionId) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    supabase.channel(`chat-session-${sessionId}`).send({ type: 'broadcast', event: 'stopped-typing', payload: { senderId: profile?.id } });
    
    const content = newMessage.trim();
    const tempId = Math.random().toString();
    
    const tempMessage: Message = {
      id: tempId,
      content,
      created_at: new Date().toISOString(),
      sender_id: profile.id,
      profiles: { nickname: profile.nickname }
    };
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({ content, session_id: sessionId, sender_id: profile.id });
    
    if (error) {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(content);
    }
  };

  const handleRequestExtension = (minutes: number, price: number) => {
    setShowExtensionModal(false);
    const channel = supabase.channel(`chat-session-${sessionId}`);
    channel.send({ type: 'broadcast', event: 'extension-request', payload: { package: { minutes, price } } });
    toast({ title: "Request Sent", description: "Waiting for the listener to accept." });
  };

  const handleAcceptExtension = async () => {
    if (!extensionRequest || !sessionId || !profile || !sessionInfo) return;
    setIsProcessingPayment(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const { error } = await supabase.rpc('extend_session', { session_id_to_extend: sessionId, minutes_to_add: extensionRequest.minutes });
    if (error) {
      toast({ title: "Error", description: "Failed to extend session.", variant: "destructive" });
    } else {
      await supabase.from('transactions').insert({ session_id: sessionId, profile_id: sessionInfo.seeker_id, amount: extensionRequest.price, currency: 'VND', status: 'completed' });
    }
    setIsProcessingPayment(false);
    setExtensionRequest(null);
  };

  if (loading) {
    return ( <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center space-x-3">
            <Mascot variant="talking" className="w-10 h-10" />
            <div>
                <h2 className="text-lg font-bold">Chatting with {otherUser?.nickname || '...'}</h2>
                <p className="text-xs text-muted-foreground">Session: {sessionId?.substring(0, 8)}</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 font-mono text-lg ${timeLeft && timeLeft < 300 ? 'text-destructive' : 'text-muted-foreground'}`}>
                <Clock className="w-5 h-5" />
                <span>{formatTime(timeLeft || 0)}</span>
            </div>
            {profile?.id === sessionInfo?.seeker_id && timeLeft && timeLeft < 300 && (
                <Button variant="outline" size="sm" onClick={() => setShowExtensionModal(true)}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Extend
                </Button>
            )}
            <Button variant="destructive" size="sm" onClick={() => handleEndChat(true)}>
                <LogOut className="w-4 h-4 mr-2" />
                End Chat
            </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${ msg.sender_id === profile?.id ? 'justify-end' : 'justify-start' }`}>
            {msg.sender_id !== profile?.id && (
                <Mascot variant="listening" className="w-8 h-8" />
            )}
            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${ msg.sender_id === profile?.id ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none' }`}>
              <p className="text-sm break-words">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-end gap-2 justify-start">
              <Mascot variant="listening" className="w-8 h-8 opacity-70" />
              <div className="p-3 rounded-lg bg-muted animate-pulse">
                  <p className="text-sm italic text-muted-foreground">is typing...</p>
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 border-t bg-background shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input value={newMessage} onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }} placeholder="Type a message..." autoComplete="off" />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}><Send className="w-4 h-4" /></Button>
        </form>
      </footer>

      {/* Modals cho luồng gia hạn */}
      <AlertDialog open={showExtensionModal} onOpenChange={setShowExtensionModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Extend Session Time</AlertDialogTitle>
            <AlertDialogDescription>Choose a package to continue your conversation.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button variant="outline" className="h-20 text-lg" onClick={() => handleRequestExtension(30, 29000)}>+30 mins<br/>(29k)</Button>
            <Button variant="outline" className="h-20 text-lg" onClick={() => handleRequestExtension(60, 49000)}>+60 mins<br/>(49k)</Button>
          </div>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!extensionRequest}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Extension Request</AlertDialogTitle>
            <AlertDialogDescription>The user wants to extend the session by {extensionRequest?.minutes} minutes. Do you accept?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExtensionRequest(null)} disabled={isProcessingPayment}>Decline</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptExtension} disabled={isProcessingPayment}>
              {isProcessingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept & Process'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
