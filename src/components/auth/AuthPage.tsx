import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Lock, Users, Shield, Heart, Loader2 } from "lucide-react";
import Mascot from '@/components/ui/Mascot';

const DUMMY_DOMAIN = "@onetalk.app";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("signup");
  const [formData, setFormData] = useState({ nickname: "", password: "" });
  const [nicknameError, setNicknameError] = useState("");
  const navigate = useNavigate();

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedNickname = value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_-]/g, '');
    setFormData({ ...formData, nickname: sanitizedNickname });

    if (value.length > 0 && sanitizedNickname.length < 3) {
      setNicknameError("Nickname must be at least 3 characters long.");
    } else if (value !== sanitizedNickname) {
      setNicknameError("Only letters, numbers, '_' and '-' are allowed. No spaces.");
    } else {
      setNicknameError("");
    }
  };
  
  useEffect(() => {
    setFormData({ nickname: "", password: "" });
    setNicknameError("");
    setShowPassword(false);
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent, action: 'signup' | 'signin') => {
    e.preventDefault();
    if (nicknameError) {
      toast({ variant: "destructive", title: "Invalid Nickname", description: nicknameError });
      return;
    }
    if (!formData.nickname || !formData.password) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill in all fields" });
      return;
    }

    setIsLoading(true);
    // ... (logic xử lý submit không đổi)
    try {
      const email = `${formData.nickname}${DUMMY_DOMAIN}`;
      let error = null;
      if (action === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password: formData.password, options: { data: { nickname: formData.nickname } } });
        error = signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: formData.password });
        error = signInError;
      }
      if (error) {
        if (action === 'signup' && error.message.includes("already registered")) {
          toast({ variant: "destructive", title: "Nickname Taken", description: "This nickname is already in use." });
        } else if (action === 'signin' && (error.message.includes("Invalid login credentials") || error.message.includes("Email not confirmed"))) {
           toast({ variant: "destructive", title: "Sign In Failed", description: "Invalid nickname or password" });
        } else {
          toast({ variant: "destructive", title: `${action === 'signup' ? 'Signup' : 'Signin'} Failed`, description: error.message });
        }
      } else {
        toast({ title: "Success!", description: `You have successfully ${action === 'signup' ? 'signed up' : 'signed in'}.` });
        navigate("/");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <Mascot variant="happy" className="w-24 h-24 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-foreground mb-2">Welcome to OneTalk</h1>
            <p className="text-lg text-muted-foreground">Your safe haven for anonymous support</p>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border shadow-card-depth">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Join the Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted p-1 h-11">
                <TabsTrigger value="signup" className="text-base data-[state=active]:bg-background data-[state=active]:shadow-md">Sign Up</TabsTrigger>
                <TabsTrigger value="signin" className="text-base data-[state=active]:bg-background data-[state=active]:shadow-md">Sign In</TabsTrigger>
              </TabsList>
              
              {/* Sign Up Form */}
              <TabsContent value="signup">
                <form onSubmit={(e) => handleSubmit(e, 'signup')} className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <label htmlFor="signup-nickname" className="text-sm font-medium text-muted-foreground">Nickname</label>
                    <div className="relative flex items-center">
                        <User className="absolute left-3 w-5 h-5 text-muted-foreground" />
                        <Input id="signup-nickname" name="nickname" type="text" placeholder="Your anonymous nickname" value={formData.nickname} onChange={handleNicknameChange} required className="pl-10 h-12 text-base" autoComplete="username" />
                    </div>
                    {nicknameError && <p className="text-xs text-destructive">{nicknameError}</p>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="signup-password" className="text-sm font-medium text-muted-foreground">Password</label>
                    <div className="relative flex items-center">
                        <Lock className="absolute left-3 w-5 h-5 text-muted-foreground" />
                        <Input id="signup-password" name="password" type={showPassword ? "text" : "password"} placeholder="Create a secure password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="pl-10 h-12 text-base pr-10" autoComplete="new-password" />
                        <button type="button" className="absolute right-3" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
                        </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg font-semibold hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
              
              {/* Sign In Form */}
              <TabsContent value="signin">
                <form onSubmit={(e) => handleSubmit(e, 'signin')} className="space-y-6 pt-6">
                   <div className="space-y-2">
                    <label htmlFor="signin-nickname" className="text-sm font-medium text-muted-foreground">Nickname</label>
                    <div className="relative flex items-center">
                        <User className="absolute left-3 w-5 h-5 text-muted-foreground" />
                        <Input id="signin-nickname" name="nickname" type="text" placeholder="Your nickname" value={formData.nickname} onChange={handleNicknameChange} required className="pl-10 h-12 text-base" autoComplete="username" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="signin-password" className="text-sm font-medium text-muted-foreground">Password</label>
                    <div className="relative flex items-center">
                       <Lock className="absolute left-3 w-5 h-5 text-muted-foreground" />
                       <Input id="signin-password" name="password" type={showPassword ? "text" : "password"} placeholder="Your password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="pl-10 h-12 text-base pr-10" autoComplete="current-password" />
                       <button type="button" className="absolute right-3" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
                       </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg font-semibold hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
