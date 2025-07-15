import { useState, useEffect } from "react"; // ADDED useEffect
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Heart, Shield, Users } from "lucide-react";

// HELPER: Define a valid dummy domain
const DUMMY_DOMAIN = "@onetalk.app"; // CHANGED: Using a more valid-looking domain

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("signup"); // ADDED: To track current tab
  const [formData, setFormData] = useState({
    nickname: "",
    password: "",
  });
  const [nicknameError, setNicknameError] = useState(""); // ADDED: For validation
  const navigate = useNavigate();

  // ADDED: Sanitize and validate nickname input
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only letters, numbers, underscore, dash. Convert to lowercase and remove spaces.
    const sanitizedNickname = value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_-]/g, '');

    setFormData({ ...formData, nickname: sanitizedNickname });

    if (value.length > 0 && sanitizedNickname.length < 3) {
      setNicknameError("Nickname must be at least 3 characters long.");
    } else if (value !== sanitizedNickname) {
      setNicknameError("Only letters, numbers, '_' and '-' are allowed. No spaces.");
    }
    else {
      setNicknameError("");
    }
  };
  
  // ADDED: Clear form when switching tabs for better UX
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
    try {
      const email = `${formData.nickname}${DUMMY_DOMAIN}`; // CHANGED: Using the new domain

      let error = null;
      if (action === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: formData.password,
          options: { data: { nickname: formData.nickname } },
        });
        error = signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: formData.password,
        });
        error = signInError;
      }
      
      if (error) {
        if (action === 'signup' && error.message.includes("already registered")) {
          toast({ variant: "destructive", title: "Nickname Taken", description: "This nickname is already in use." });
        } else if (action === 'signin' && (error.message.includes("Invalid login credentials") || error.message.includes("Email not confirmed"))) {
           toast({ variant: "destructive", title: "Sign In Failed", description: "Invalid nickname or password" });
        }
        else {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ... (Your Header and Features JSX remains the same) ... */}
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4"><Heart className="w-8 h-8 text-primary" /></div>
            <h1 className="text-3xl font-bold text-foreground mb-2">OneTalk</h1>
            <p className="text-muted-foreground">Your safe haven for anonymous support</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center"><Shield className="w-6 h-6 text-green-500 mx-auto mb-2" /><p className="text-xs text-muted-foreground">Anonymous</p></div>
          <div className="text-center"><Heart className="w-6 h-6 text-red-500 mx-auto mb-2" /><p className="text-xs text-muted-foreground">Supportive</p></div>
          <div className="text-center"><Users className="w-6 h-6 text-blue-500 mx-auto mb-2" /><p className="text-xs text-muted-foreground">Community</p></div>
        </div>

        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Join OneTalk</CardTitle>
            <CardDescription className="text-center">Connect with caring listeners anonymously</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="signin">Sign In</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signup">
                <form onSubmit={(e) => handleSubmit(e, 'signup')} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Choose a Nickname</label>
                    <Input
                      type="text"
                      placeholder="Your anonymous nickname"
                      value={formData.nickname}
                      onChange={handleNicknameChange} // CHANGED
                      required
                      className={`bg-background/50 ${nicknameError ? 'border-destructive' : ''}`} // ADDED: Highlight on error
                    />
                    {nicknameError ? ( // ADDED: Display validation error
                      <p className="text-xs text-destructive">{nicknameError}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Min 3 characters. No spaces or special characters.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">{/* ... (Your password input JSX remains the same) ... */}
                        <Input type={showPassword ? "text" : "password"} placeholder="Create a secure password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="bg-background/50 pr-10" />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signin">
                <form onSubmit={(e) => handleSubmit(e, 'signin')} className="space-y-4 pt-4">
                   <div className="space-y-2">
                    <label className="text-sm font-medium">Nickname</label>
                    <Input
                      type="text"
                      placeholder="Your nickname"
                      value={formData.nickname}
                      onChange={handleNicknameChange} // CHANGED
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">{/* ... (Your password input JSX remains the same) ... */}
                       <Input type={showPassword ? "text" : "password"} placeholder="Your password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="bg-background/50 pr-10" />
                       <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        {/* ... (Your Footer JSX remains the same) ... */}
        <p className="text-center text-xs text-muted-foreground mt-6">By joining OneTalk, you agree to maintain a supportive and respectful environment for everyone.</p>
      </div>
    </div>
  );
}