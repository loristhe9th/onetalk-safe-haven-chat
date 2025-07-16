import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, BookHeart } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

// Định nghĩa kiểu dữ liệu cho một mục nhật ký
interface MoodEntry {
  id: string;
  created_at: string;
  mood: string;
  notes: string;
  mood_score: number;
  emotions: string[];
}

const moodOptions = [
  { name: 'happy', emoji: '😄', score: 5 },
  { name: 'good', emoji: '🙂', score: 4 },
  { name: 'neutral', emoji: '😐', score: 3 },
  { name: 'sad', emoji: '😔', score: 2 },
  { name: 'awful', emoji: '😭', score: 1 },
];

export default function MoodJournalPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho form tạo mới
  const [newContent, setNewContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<{ name: string; emoji: string; score: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const fetchEntries = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching mood entries:", error);
        toast({ title: "Error", description: "Could not load journal entries.", variant: "destructive" });
      } else {
        setEntries(data as MoodEntry[]);
      }
      setLoading(false);
    };

    fetchEntries();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood || newContent.trim() === '' || !profile) {
        toast({ title: "Missing information", description: "Please select a mood and write a note.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    try {
        const { data, error } = await supabase
            .from('mood_entries')
            .insert({
                profile_id: profile.id,
                mood: selectedMood.name,
                mood_score: selectedMood.score,
                notes: newContent,
                emotions: [] // Tạm thời để trống, sẽ nâng cấp sau
            })
            .select()
            .single();

        if (error) throw error;

        // Thêm entry mới vào đầu danh sách
        setEntries([data as MoodEntry, ...entries]);
        // Reset form
        setNewContent('');
        setSelectedMood(null);
        toast({ title: "Success", description: "Your journal entry has been saved." });

    } catch (error: any) {
        console.error("Error creating entry:", error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };


  if (loading) {
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
        <h1 className="text-3xl font-bold ml-4">Mood Journal</h1>
      </div>

      {/* Form để thêm entry mới */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How are you feeling today?</CardTitle>
          <CardDescription>Take a moment to reflect and write down your thoughts.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select your mood</label>
              <div className="flex justify-around p-2 bg-muted rounded-lg">
                {moodOptions.map((mood) => (
                  <button
                    type="button"
                    key={mood.name}
                    onClick={() => setSelectedMood(mood)}
                    className={`text-4xl p-2 rounded-full transition-transform transform hover:scale-125 ${
                      selectedMood?.name === mood.name ? 'bg-primary/20 scale-125' : ''
                    }`}
                  >
                    {mood.emoji}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="What's on your mind?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save Entry'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danh sách các entry cũ */}
      <h2 className="text-2xl font-bold mt-8 mb-4">Past Entries</h2>
      {entries.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <BookHeart className="w-12 h-12 mx-auto mb-2" />
          <p>Your past journal entries will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    Entry from {format(new Date(entry.created_at), 'MMMM d, yyyy')}
                  </CardTitle>
                  <CardDescription>
                    Mood: {moodOptions.find(m => m.name === entry.mood)?.emoji} {entry.mood}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{entry.notes}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}