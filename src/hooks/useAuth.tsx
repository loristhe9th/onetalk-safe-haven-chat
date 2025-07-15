import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// Định nghĩa kiểu dữ liệu cho Profile để sử dụng lại
interface Profile {
  id: string; // Đây là ID từ bảng profiles, không phải user_id
  user_id: string;
  nickname: string;
  // Thêm các trường khác của profile nếu cần
}

// Định nghĩa kiểu dữ liệu cho giá trị của Context
interface AuthContextType {
  user: User | null;
  profile: Profile | null; // Thêm profile vào context
  session: Session | null;
  loading: boolean; // Thêm trạng thái loading
  signOut: () => Promise<void>;
}

// Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tạo Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Lấy session hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Nếu có user, lấy profile tương ứng
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching profile on initial load:', error);
            }
            setProfile(data as Profile);
            setLoading(false); // Hoàn tất loading
          });
      } else {
        setLoading(false); // Hoàn tất loading nếu không có session
      }
    });

    // 2. Lắng nghe các thay đổi về trạng thái đăng nhập
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Nếu có user (đăng nhập/đăng ký thành công)
        if (session?.user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (error) {
            console.error('Error fetching profile on auth state change:', error);
          }
          setProfile(data as Profile);
        } else {
          // Nếu không có user (đăng xuất)
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Dọn dẹp listener khi component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Hàm đăng xuất
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Cung cấp các giá trị cho các component con
  const value = {
    user,
    profile, // Thêm profile vào value
    session,
    loading, // Thêm loading vào value
    signOut,
  };

  // Chỉ hiển thị children khi không còn trong trạng thái loading ban đầu
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Tạo hook để dễ dàng sử dụng context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};