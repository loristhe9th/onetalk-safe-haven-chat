import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, Users } from "lucide-react";

// Giả định bạn có kiểu dữ liệu Profile như thế này
interface Profile {
  id: string;
  user_id: string;
}

export default function ListenerQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Lấy thông tin profile của người dùng hiện tại
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('user_id', user.id)
        .single();
      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
    };
    fetchProfile();
  }, [user]);

  // Hàm này sẽ gọi Database Function 'matchmake'
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
        // Nếu tìm thấy phiên chat, điều hướng đến phòng chat
        toast({ title: "Success!", description: "Found a session. Connecting..." });
        // CHÚ Ý: Chúng ta sẽ tạo trang này ở bước sau
        navigate(`/chat/session/${sessionId}`);
      } else {
        // Nếu không có ai đang chờ
        toast({ title: "No one is waiting", description: "The queue is empty. Please try again later." });
      }
    } catch (error: any) {
      console.error("Error calling matchmake function:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <Users className="w-16 h-16 text-primary mb-4" />
      <h1 className="text-3xl font-bold mb-2">Join the Listener Queue</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Help someone in need by offering your support. Click the button below to find a person waiting to chat.
      </p>
      <Button onClick={handleFindChat} disabled={isLoading || !profile} size="lg">
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