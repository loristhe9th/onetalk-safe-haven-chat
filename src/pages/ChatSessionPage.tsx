import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

// Cập nhật để có cả extended_duration_minutes
interface SessionInfo {
  seeker_id: string;
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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // === THÊM STATE CHO LUỒNG GIA HẠN ===
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionRequest, setExtensionRequest] = useState<{ minutes: number; price: number } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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

  useEffect(() => {
    if (!sessionId) return;
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.from('chat_sessions').select('seeker_id, created_at, duration_minutes, extended_duration_minutes, status').eq('id', sessionId).single();
      if (sessionError || !sessionData || sessionData.status === 'completed') {
        toast({ title: "Session Ended", description: "This chat session is no longer active.", variant: "destructive" });
        navigate('/dashboard');
        return;
      }
      setSessionInfo(sessionData);
      const { data: messagesData } = await supabase.from('messages').select('*, profiles(nickname)').eq('session_id', sessionId).order('created_at', { ascending: true });
      setMessages((messagesData as Message[]) || []);
      const startTime = new Date(sessionData.created_at).getTime();
      const totalDurationSeconds = (sessionData.duration_minutes + (sessionData.extended_duration_minutes || 0)) * 60;
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      setTimeLeft(totalDurationSeconds - elapsedSeconds);
      setLoading(false);
    };
    fetchInitialData();
  }, [sessionId, navigate]);

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
  
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase.channel(`chat-session-${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', table: 'messages', filter: `session_id=eq.${sessionId}`}, (payload) => { /* ... */ })
      .on('postgres_changes', { event: 'UPDATE', table: 'chat_sessions', filter: `id=eq.${sessionId}`}, (payload) => {
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
      })
      .on('broadcast', { event: 'extension-request' }, (payload) => {
          if (profile?.id !== sessionInfo?.seeker_id) {
            setExtensionRequest(payload.payload.package);
          }
      })
      .on('broadcast', { event: 'typing' }, (payload) => { /* ... */ })
      .on('broadcast', { event: 'stopped-typing' }, (payload) => { /* ... */ })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, profile?.id, handleEndChat, sessionInfo]);

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

  const handleTyping = () => { /* ... */ };
  const handleSendMessage = async (e: React.FormEvent) => { /* ... */ };

  if (loading || timeLeft === null) {
    return ( <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center space-x-3">
            <Mascot variant="talking" className="w-10 h-10" />
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
            {/* Nút gia hạn, chỉ Seeker thấy khi sắp hết giờ */}
            {profile?.id === sessionInfo?.seeker_id && timeLeft < 300 && (
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

      <main> {/* ... JSX của main không đổi ... */} </main>
      <footer> {/* ... JSX của footer không đổi ... */} </footer>

      {/* Modal cho Seeker để chọn gói gia hạn */}
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

      {/* Modal cho Listener để chấp nhận yêu cầu */}
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
