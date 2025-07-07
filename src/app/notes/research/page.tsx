'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getNotes, addNote } from '@/lib/firestore';
import { researchAndCreateNote } from '@/ai/flows/research-note';
import type { Note } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, FlaskConical, ArrowLeft } from 'lucide-react';
import { SplashScreen } from '@/components/splash-screen';

export default function ResearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  useEffect(() => {
    if (user) {
      getNotes(user.uid)
        .then(setNotes)
        .catch(() => {
          toast({
            variant: 'destructive',
            title: 'Failed to load existing notes',
            description: 'The AI may have less context for your request.',
          });
        })
        .finally(() => setIsLoadingNotes(false));
    }
  }, [user, toast]);
  
  const handleGenerate = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    if (!topic.trim()) {
      toast({ variant: 'destructive', title: 'Please enter a topic.' });
      return;
    }
    
    setIsGenerating(true);
    try {
      const result = await researchAndCreateNote({
        topic,
        existingNotes: notes.map(({ id, title, content }) => ({ id, title, content })),
      });
      
      const newNote = await addNote(user.uid, {
        title: result.title,
        content: result.content,
        categories: ['AI Generated'],
      });

      toast({
        title: 'Note Created!',
        description: 'Your new research note is ready for you to edit.',
      });

      router.push(`/notes/edit/${newNote.id}`);

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'AI Research Failed',
        description: 'Could not generate the note. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (isLoadingNotes) {
    return <SplashScreen />;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <Button type="button" variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <div className="flex-grow"></div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
              <FlaskConical className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">AI Research Assistant</CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              Ask a question or provide a topic. The AI will use its knowledge
              and your existing notes to create a new, detailed note for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid w-full gap-2">
                <Label htmlFor="topic" className="text-lg font-semibold">Your Research Topic</Label>
                <Textarea
                    id="topic"
                    placeholder="e.g., 'The history of ancient Rome' or 'Explain quantum computing in simple terms'"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={4}
                    className="text-base"
                    disabled={isGenerating}
                />
             </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <FlaskConical className="mr-2 h-5 w-5" />
              )}
              Generate Note
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
