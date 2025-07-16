import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, Shield, Heart, Ear, Loader2 } from 'lucide-react';

const guidelines = [
  { icon: Ear, text: "Lắng nghe chủ động: Tập trung hoàn toàn vào người nói, không ngắt lời hay phán xét." },
  { icon: Heart, text: "Đồng cảm, không thương hại: Cố gắng thấu hiểu cảm xúc của họ, không chỉ đơn thuần là thấy tội nghiệp." },
  { icon: Shield, text: "Bảo mật tuyệt đối: Không bao giờ chia sẻ nội dung cuộc trò chuyện với bất kỳ ai." },
  { icon: CheckCircle, text: "Không đưa ra lời khuyên nếu không được yêu cầu: Vai trò của bạn là lắng nghe, không phải là một chuyên gia giải quyết vấn đề." },
  { icon: Shield, text: "Biết giới hạn của mình: Nếu cảm thấy cuộc trò chuyện vượt quá khả năng, hãy lịch sự kết thúc và báo cáo nếu cần thiết." }
];

export default function ListenerOnboardingPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleAgreeAndContinue = async () => {
    if (!profile) return;

    setIsLoading(true);
    try {
      // Cập nhật trạng thái của listener thành 'verified'
      const { error } = await supabase
        .from('profiles')
        .update({ listener_status: 'verified' })
        .eq('id', profile.id);

      if (error) throw error;

      toast({ title: "Welcome, Listener!", description: "Thank you for joining our community of supporters." });
      // Chuyển người dùng đến hàng chờ của listener
      navigate('/listener/queue');

    } catch (error: any) {
      console.error("Error updating listener status:", error);
      toast({ title: "Error", description: "Could not complete the process. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
            <Ear className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Trở thành Người Lắng nghe</CardTitle>
          <CardDescription className="mt-2">
            Cảm ơn bạn đã muốn giúp đỡ người khác. Trước khi bắt đầu, hãy đọc và đồng ý với các nguyên tắc cộng đồng quan trọng sau:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3 text-muted-foreground">
            {guidelines.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <item.icon className="w-5 h-5 text-primary mt-1 shrink-0" />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
          <div className="pt-4">
            <Button onClick={handleAgreeAndContinue} disabled={isLoading} className="w-full" size="lg">
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                "Tôi hiểu và đồng ý"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}