import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, Users } from "lucide-react";

// Cập nhật lại interface Profile để có listener_status
interface Profile {
  id: string;
  user_id: string;
  listener_status: 'unverified' | 'verified' | 'pending';
}

export default function ListenerQueue() {
  // Sửa lại để lấy cả profile từ useAuth
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // === BẮT ĐẦU THÊM LOGIC MỚI ===
  useEffect(() => {
    // Nếu chưa tải xong profile thì không làm gì cả
    if (authLoading || !profile) return;

    // Nếu người dùng chưa được xác minh, chuyển họ đến trang onboarding
    if (profile.listener_status === 'unverified') {
      navigate('/listener/onboarding');
    }
  }, [profile, authLoading, navigate]);
  // === KẾT THÚC LOGIC MỚI ===

  const handleFindChat = async () => {
    if (!profile) {
      toast({ title: "Error", description: "Profile not found.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: sessionId, error } = await supabase.rpc('matchmake', {
        listener_profile_id: profile.id
      });

      if (error) throw error;

      if (sessionId) {
        toast({ title: "Success!", description: "Found a session. Connecting..." });
        navigate(`/chat/session/${sessionId}`);
      } else {
        toast({ title: "No one is waiting", description: "The queue is empty. Please try again later." });
      }
    } catch (error: any) {
      console.error("Error calling matchmake function:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Thêm màn hình chờ trong lúc kiểm tra profile
  if (authLoading || !profile || profile.listener_status !== 'verified') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <Users className="w-16 h-16 text-primary mb-4" />
      <h1 className="text-3xl font-bold mb-2">Join the Listener Queue</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Help someone in need by offering your support. Click the button below to find a person waiting to chat.
      </p>
      <Button onClick={handleFindChat} disabled={isLoading} size="lg">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Searching...
          </>
        ) : "Find a Conversation"}
      </Button>
    </div>
  );
}