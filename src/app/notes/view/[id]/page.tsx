'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import type { Note } from '@/types';
import { SplashScreen } from '@/components/splash-screen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Share2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { deleteNoteFirestore, shareNote, unshareNote } from '@/lib/firestore';

const getNote = async (userId: string, noteId: string): Promise<Note | null> => {
  if (!userId || !noteId) return null;
  const noteRef = doc(db, 'users', userId, 'notes', noteId);
  const noteSnap = await getDoc(noteRef);

  if (!noteSnap.exists()) {
    return null;
  }

  const data = noteSnap.data();
  return {
    id: noteSnap.id,
    title: data.title,
    content: data.content,
    categories: data.categories,
    createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
    isPublic: data.isPublic || false,
  };
};

// Simple markdown to HTML renderer
const renderMarkdown = (text: string) => {
  if (!text) return { __html: '' };
  let html = text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // Heading: # text
  html = html.replace(/^# (.*$)/gim, '<h2>$1</h2>');
  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic: _text_
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
   // Monospace: `text`
  html = html.replace(/`(.*?)`/g, '<code class="bg-muted text-muted-foreground rounded-sm px-1.5 py-1 font-mono">$1</code>');
  // Lists: - item
  html = html.replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>');
  html = html.replace(/<\/ul>\n<ul>/g, '');
  // Newlines
  html = html.replace(/\n/g, '<br />');

  // Clean up extra <br />s around h2 tags
  html = html.replace(/(<\/h2>)<br \/>/g, '$1');
  html = html.replace(/<br \/>(<h2>)/g, '$1');

  return { __html: html };
};

export default function ViewNotePage({ params }: { params: { id:string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (user) {
      getNote(user.uid, params.id)
        .then(noteData => {
          if (noteData) {
            setNote(noteData);
          } else {
            setError('Note not found or you do not have permission to view it.');
          }
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load the note.');
          setLoading(false);
        });
    }
  }, [user, params.id]);

  const handleDelete = async () => {
    if (!user || !note) return;
    if (window.confirm('Are you sure you want to delete this note?')) {
        try {
            await deleteNoteFirestore(user.uid, note.id);
            toast({ title: 'Note deleted successfully.' });
            router.push('/notes');
            router.refresh();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Failed to delete note.' });
        }
    }
  };

  const handleShare = async () => {
    if (!user || !note) return;
    setIsSharing(true);
    try {
        if (note.isPublic) {
            await unshareNote(user.uid, note.id);
            setNote(prev => prev ? { ...prev, isPublic: false } : null);
            toast({ title: "Sharing stopped", description: "This note is no longer public." });
        } else {
            await shareNote(user.uid, note.id);
            setNote(prev => prev ? { ...prev, isPublic: true } : null);
            const shareUrl = `${window.location.origin}/share/${note.id}`;
            navigator.clipboard.writeText(shareUrl);
            toast({
                title: "Note is now public!",
                description: "The shareable link has been copied to your clipboard.",
            });
        }
    } catch (err) {
        toast({ variant: 'destructive', title: 'Failed to update sharing settings.' });
    } finally {
        setIsSharing(false);
    }
  };


  if (loading) {
    return <SplashScreen />;
  }

  if (error || !note) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.14))] text-center">
            <p className="text-2xl text-destructive mb-4">{error || "Note not found."}</p>
            <Button asChild>
                <Link href="/notes">Back to Notes</Link>
            </Button>
        </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
             <div className="flex justify-between items-center mb-6">
                <Button variant="outline" size="icon" onClick={() => router.push('/notes')}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Notes</span>
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handleShare} variant="outline" disabled={isSharing}>
                        {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                        {note.isPublic ? 'Unshare' : 'Share'}
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={`/notes/edit/${note.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl md:text-4xl font-bold">{note.title}</CardTitle>
                    <p className="text-sm text-muted-foreground pt-2">
                        Last updated on {new Date(note.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </CardHeader>
                <CardContent>
                    <div 
                        className="text-foreground/90 whitespace-pre-wrap leading-relaxed [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-4"
                        dangerouslySetInnerHTML={renderMarkdown(note.content)}
                    />
                </CardContent>
            </Card>
        </div>
    </main>
  );
}
