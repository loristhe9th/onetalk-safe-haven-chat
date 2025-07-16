import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { User, Mail, Star, MessageSquare, Loader2, ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [nickname, setNickname] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname);
    }
  }, [profile]);

  const handleUpdateNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || nickname.trim() === '' || nickname.trim() === profile.nickname) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: nickname.trim() })
        .eq('id', profile.id);

      if (error) throw error;

      toast({ title: "Success", description: "Your nickname has been updated." });
      // Lưu ý: hook useAuth sẽ tự động cập nhật profile mới, nhưng có thể có độ trễ.
      // Để làm mới ngay lập tức, bạn có thể gọi lại hàm fetch profile trong useAuth hoặc reload trang.
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating nickname:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold ml-4">Your Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {profile.nickname.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{profile.nickname}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {user?.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form chỉnh sửa Nickname */}
          <div className="space-y-2">
            <h3 className="font-semibold">Nickname</h3>
            {isEditing ? (
              <form onSubmit={handleUpdateNickname} className="flex items-center gap-2">
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  autoFocus
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">{profile.nickname}</p>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              </div>
            )}
          </div>

          {/* Phần thống kê - Đã xóa ép kiểu (as any) */}
          <div className="space-y-4 pt-4 border-t">
             <h3 className="font-semibold">Your Stats</h3>
             <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                    <MessageSquare className="w-6 h-6 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold">{profile.total_sessions || 0}</p>
                    <p className="text-sm text-muted-foreground">Sessions Completed</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                    <Star className="w-6 h-6 mx-auto text-yellow-400 mb-2" />
                    <p className="text-2xl font-bold">
                        {(profile.rating_average || 0).toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                </div>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}