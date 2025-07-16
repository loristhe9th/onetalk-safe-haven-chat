import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// === BƯỚC 1: ĐỊNH NGHĨA INTERFACE PROFILE HOÀN CHỈNH ===
// Interface này bao gồm tất cả các trường bạn cần trong ứng dụng.
export interface Profile {
  id: string;
  user_id: string;
  nickname: string;
  bio: string | null;
  role: 'seeker' | 'listener' | 'expert';
  rating_average: number;
  rating_count: number;
  total_sessions: number;
  is_available: boolean;
  listener_status: 'unverified' | 'verified' | 'pending';
}

// Định nghĩa kiểu dữ liệu cho giá trị của Context
interface AuthContextType {
  user: User | null;
  profile: Profile | null; // Profile giờ đây có kiểu dữ liệu hoàn chỉnh
  session: Session | null;
  loading: boolean;
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
    const fetchSessionAndProfile = async () => {
      // 1. Lấy session hiện tại
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error fetching session:", sessionError);
        setLoading(false);
        return;
      }

      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      // 2. Nếu có user, lấy profile tương ứng
      if (currentUser) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*') // Lấy tất cả các cột
          .eq('user_id', currentUser.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile on initial load:', profileError);
        }
        setProfile(profileData as Profile);
      }
      setLoading(false); // Hoàn tất loading
    };

    fetchSessionAndProfile();

    // 3. Lắng nghe các thay đổi về trạng thái đăng nhập
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);

        if (newUser) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', newUser.id)
            .single();
          
          if (error) {
            console.error('Error fetching profile on auth state change:', error);
          }
          setProfile(data as Profile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signOut,
  };

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
