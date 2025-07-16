import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, ArrowLeft, PlusCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Định nghĩa kiểu dữ liệu cho một phòng chat nhóm
interface GroupRoom {
  id: string;
  name: string;
  description: string | null;
  topics: { name: string } | null;
}

export default function GroupRoomsListPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<GroupRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('group_rooms')
        .select(`
          id,
          name,
          description,
          topics ( name )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching group rooms:", error);
        toast({ title: "Error", description: "Could not load rooms.", variant: "destructive" });
      } else {
        setRooms(data as GroupRoom[]);
      }
      setLoading(false);
    };

    fetchRooms();
  }, []);

  const handleJoinRoom = (roomId: string) => {
    // Chúng ta sẽ tạo trang này ở bước tiếp theo
    navigate(`/group-chat/${roomId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold ml-4">Group Chats</h1>
        </div>
        {/* Nút này hiện chưa có chức năng, sẽ làm sau */}
        <Button disabled>
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Room
        </Button>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No Active Rooms</h2>
          <p className="text-muted-foreground mt-2">Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{room.name}</CardTitle>
                {room.topics && (
                  <span className="text-xs font-semibold text-primary">{room.topics.name}</span>
                )}
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <p className="text-sm text-muted-foreground mb-4">
                  {room.description || 'Join the conversation and share your thoughts.'}
                </p>
                <Button onClick={() => handleJoinRoom(room.id)} className="w-full mt-auto">
                  Join Room
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}