import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Shield, Users } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex flex-col items-center justify-center text-center p-4">
      <div className="max-w-2xl">

        {/* --- Phần Header --- */}
        <header className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 animate-pulse">
            <Heart className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Chào mừng đến với OneTalk
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Nơi an toàn để chia sẻ. Kết nối ẩn danh 1:1 với những người sẵn sàng lắng nghe.
          </p>
        </header>

        {/* --- Phần Tính năng nổi bật --- */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-8 my-12">
          <div className="flex flex-col items-center">
            <Shield className="w-8 h-8 text-green-500 mb-2" />
            <h3 className="font-semibold">Ẩn danh & Bảo mật</h3>
            <p className="text-sm text-muted-foreground mt-1">Danh tính của bạn luôn được giữ kín.</p>
          </div>
          <div className="flex flex-col items-center">
            <Users className="w-8 h-8 text-blue-500 mb-2" />
            <h3 className="font-semibold">Lắng nghe 1:1</h3>
            <p className="text-sm text-muted-foreground mt-1">Trò chuyện riêng tư với người đồng cảm.</p>
          </div>
          <div className="flex flex-col items-center">
            <Heart className="w-8 h-8 text-red-500 mb-2" />
            <h3 className="font-semibold">Hỗ trợ Tận tâm</h3>
            <p className="text-sm text-muted-foreground mt-1">Một cộng đồng luôn sẵn sàng chia sẻ.</p>
          </div>
        </section>

        {/* --- Phần Kêu gọi hành động (Call to Action) --- */}
        <footer>
          <Button size="lg" onClick={() => navigate('/auth')}>
            Bắt đầu một cuộc trò chuyện
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Tham gia miễn phí. Không cần thông tin cá nhân.
          </p>
        </footer>

      </div>
    </div>
  );
};

export default Index;