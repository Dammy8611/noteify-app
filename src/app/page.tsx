'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { NoteCard } from '@/components/note-card';
import { NoteForm } from '@/components/note-form';
import { SplashScreen } from '@/components/splash-screen';
import type { Note } from '@/types';

const initialNotes: Note[] = [
  {
    id: '1',
    content: 'Meeting with the design team to review the new mockups. Key points to discuss: color palette, typography, and layout for the new dashboard. Also, need to finalize the user flow for the checkout process.',
    categories: ['Work', 'Design', 'Meeting'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    content: 'Grocery list: Milk, Bread, Eggs, Cheese, Apples, Bananas, Chicken breast, Spinach. Don\'t forget to buy coffee beans.',
    categories: ['Personal', 'Shopping'],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    content: 'Idea for a new side project: A mobile app that tracks water intake and reminds you to drink water throughout the day. Features: customizable reminders, progress tracking, and achievements.',
    categories: ['Ideas', 'AppDev'],
    createdAt: new Date().toISOString(),
  },
];


export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    const splashTimer = setTimeout(() => setShowSplash(false), 2500);
    setIsClient(true);
    try {
        const storedNotes = localStorage.getItem('notes');
        if (storedNotes) {
            setNotes(JSON.parse(storedNotes));
        } else {
            setNotes(initialNotes);
        }
    } catch (e) {
        setNotes(initialNotes);
    }

    return () => clearTimeout(splashTimer);
  }, []);
  
  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem('notes', JSON.stringify(notes));
      } catch (e) {
        console.error("Failed to save notes to localStorage", e);
      }
    }
  }, [notes, isClient]);


  const handleAddNoteClick = () => {
    setEditingNote(null);
    setIsDialogOpen(true);
  };

  const handleEditNoteClick = (note: Note) => {
    setEditingNote(note);
    setIsDialogOpen(true);
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const handleSaveNote = (noteData: Partial<Note>, categories: string[]) => {
    if (noteData.id) {
      setNotes(
        notes.map((n) =>
          n.id === noteData.id ? { ...n, ...noteData, content: noteData.content || n.content, categories } : n
        )
      );
    } else {
      const newNote: Note = {
        id: new Date().getTime().toString(),
        content: noteData.content || '',
        categories,
        createdAt: new Date().toISOString(),
      };
      setNotes([newNote, ...notes]);
    }
  };

  if (!isClient) {
    return <SplashScreen />;
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>
      <div className="min-h-screen w-full">
        <main className="container mx-auto px-4 py-8">
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-between items-center mb-8"
          >
            <h1 className="text-4xl font-bold text-primary font-headline">Noteify</h1>
            <p className="text-muted-foreground hidden sm:block">Your simple & smart notes app.</p>
          </motion.header>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full"
          >
            {notes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {notes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={handleEditNoteClick}
                        onDelete={handleDeleteNote}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-lg animate-fade-in-up">
                  <h2 className="text-2xl font-semibold">No notes yet</h2>
                  <p className="text-muted-foreground mt-2">Click the '+' button to add your first note.</p>
                </div>
              )}
          </motion.div>

          <Button
            aria-label="Add Note"
            onClick={handleAddNoteClick}
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 focus:ring-accent transition-transform duration-300 ease-in-out hover:scale-110"
            size="icon"
          >
            <Plus className="h-8 w-8" />
          </Button>

          <NoteForm
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSave={handleSaveNote}
            note={editingNote}
          />
        </main>
      </div>
    </>
  );
}
