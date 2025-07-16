import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Star, MessageSquare, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

// Định nghĩa kiểu dữ liệu cho hồ sơ công khai
interface PublicProfile {
  id: string;
  nickname: string;
  created_at: string;
  rating_average: number;
  rating_count: number;
  total_sessions: number;
  listener_status: string;
}

export default function ListenerProfilePage() {
  const { nickname } = useParams<{ nickname: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!nickname) return;

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('nickname', nickname)
        .single();

      if (error || !data) {
        console.error("Error fetching profile:", error);
        // Có thể tạo một trang "Không tìm thấy người dùng" riêng
        navigate('/dashboard'); 
      } else {
        setProfile(data as PublicProfile);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [nickname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
         <h1 className="text-2xl font-bold">User Not Found</h1>
         <Button variant="link" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold ml-4">Listener Profile</h1>
      </div>

      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="w-24 h-24 mb-4">
            <AvatarFallback className="text-4xl bg-primary/10 text-primary">
              {profile.nickname.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">{profile.nickname}</CardTitle>
          <div className="flex items-center gap-2 text-muted-foreground mt-2">
            <ShieldCheck className={`w-5 h-5 ${profile.listener_status === 'verified' ? 'text-green-500' : 'text-gray-400'}`} />
            <span>{profile.listener_status === 'verified' ? 'Verified Listener' : 'Member'}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Joined on {format(new Date(profile.created_at), 'MMMM yyyy')}
          </p>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <Star className="w-8 h-8 mx-auto text-yellow-400 mb-2" />
              <p className="text-3xl font-bold">
                {profile.rating_average.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">
                Average Rating ({profile.rating_count} reviews)
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <MessageSquare className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-3xl font-bold">{profile.total_sessions}</p>
              <p className="text-sm text-muted-foreground">Sessions Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}