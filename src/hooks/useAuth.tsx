import { useState, useEffect, createContext, useContext, ReactNode, useMemo } from 'react'; // Thêm useMemo
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// Định nghĩa Interface Profile hoàn chỉnh
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

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
        setProfile(profileData as Profile);
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);

        if (newUser) {
          const { data } = await supabase.from('profiles').select('*').eq('user_id', newUser.id).single();
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

  // === SỬA LỖI Ở ĐÂY ===
  // Sử dụng useMemo để ổn định tham chiếu của đối tượng value
  // Nó chỉ tạo ra một đối tượng mới khi một trong các dependency (user, profile, etc.) thay đổi
  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    signOut,
  }), [user, profile, session, loading]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
