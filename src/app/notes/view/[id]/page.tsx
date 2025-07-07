'use client';

import { useState, useEffect, use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import type { Note } from '@/types';
import { SplashScreen } from '@/components/splash-screen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Share2, Loader2, Copy, Download, FileText, FileCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { deleteNoteFirestore, shareNote, unshareNote } from '@/lib/firestore';
import { downloadAsTxt, downloadAsPdf, downloadAsDocx } from '@/lib/download';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { renderMarkdown } from '@/lib/markdown';

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

export default function ViewNotePage({ params }: { params: { id:string } }) {
  const { id } = params;
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/share/${id}` : '';

  useEffect(() => {
    if (user) {
      getNote(user.uid, id)
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
  }, [user, id]);

  const handleDelete = async () => {
    if (!user || !note) return;
    setIsDeleting(true);
    try {
        await deleteNoteFirestore(user.uid, note.id);
        toast({ title: 'Note deleted successfully.' });
        router.push('/notes');
        router.refresh();
    } catch (err) {
        toast({ variant: 'destructive', title: 'Failed to delete note.' });
        setIsDeleting(false);
    }
  };

  const handleEnableSharing = async () => {
    if (!user || !note) return;
    setIsSharing(true);
    try {
        await shareNote(user.uid, note.id);
        setNote(prev => prev ? { ...prev, isPublic: true } : null);
        navigator.clipboard.writeText(shareUrl);
        toast({
            title: "Note is now public!",
            description: "The shareable link has been copied to your clipboard.",
        });
    } catch (err) {
        toast({ variant: 'destructive', title: 'Failed to enable sharing.' });
    } finally {
        setIsSharing(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
        title: "Link Copied!",
        description: "The shareable link is now on your clipboard.",
    });
  };

  const handleUnshare = async () => {
    if (!user || !note) return;
    setIsSharing(true);
    try {
        await unshareNote(user.uid, note.id);
        setNote(prev => prev ? { ...prev, isPublic: false } : null);
        toast({ title: "Sharing stopped", description: "This note is no longer public." });
    } catch (err) {
        toast({ variant: 'destructive', title: 'Failed to stop sharing.' });
    } finally {
        setIsSharing(false);
    }
  };

  const handleDownload = (format: 'txt' | 'pdf' | 'docx') => {
    if (!note) return;
    if (format === 'txt') downloadAsTxt(note);
    if (format === 'pdf') downloadAsPdf(note);
    if (format === 'docx') downloadAsDocx(note);
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleDownload('txt')}><FileText className="mr-2 h-4 w-4" /> TXT</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload('pdf')}><FileCode className="mr-2 h-4 w-4" /> PDF</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload('docx')}><FileCode className="mr-2 h-4 w-4" /> DOCX</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {note.isPublic ? (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" disabled={isSharing}>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Shared
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Share Note</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Anyone with this link can view this note.
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Input id="share-link" value={shareUrl} readOnly className="flex-1" />
                                        <Button variant="outline" size="icon" onClick={handleCopyLink}>
                                            <Copy className="h-4 w-4" />
                                            <span className="sr-only">Copy Link</span>
                                        </Button>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="w-full">
                                                Stop Sharing
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure you want to stop sharing?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will make the note private, and the public share link will no longer work.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    disabled={isSharing}
                                                    onClick={handleUnshare}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    {isSharing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Unshare
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <Button onClick={handleEnableSharing} variant="outline" disabled={isSharing}>
                            {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                            Share
                        </Button>
                    )}
                    <Button asChild variant="outline">
                        <Link href={`/notes/edit/${note.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isDeleting}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            note and any associated public share links.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            disabled={isDeleting}
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                        className="text-foreground/90 whitespace-pre-wrap leading-relaxed [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:my-3"
                        dangerouslySetInnerHTML={renderMarkdown(note.content)}
                    />
                </CardContent>
            </Card>
        </div>
    </main>
  );
}
