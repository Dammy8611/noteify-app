'use client';

import { useState, useEffect, use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import type { Note } from '@/types';
import { NoteEditor } from '@/components/note-editor';
import { SplashScreen } from '@/components/splash-screen';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
  };
};

export default function EditNotePage({ params }: { params: { id: string } }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <SplashScreen />;
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.14))] text-center">
            <p className="text-2xl text-destructive mb-4">{error}</p>
            <Button asChild>
                <Link href="/notes">Back to Notes</Link>
            </Button>
        </div>
    );
  }

  return (
    <NoteEditor note={note} />
  );
}
