'use client';

import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Bot, Search, Filter, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { NoteCard } from '@/components/note-card';
import { NoteForm } from '@/components/note-form';
import { SplashScreen } from '@/components/splash-screen';
import type { Note } from '@/types';
import { findNotes } from '@/ai/flows/find-notes';
import { useToast } from '@/hooks/use-toast';

const initialNotes: Note[] = [
  {
    id: '1',
    title: 'Design Team Meeting',
    content: 'Meeting with the design team to review the new mockups. Key points to discuss: color palette, typography, and layout for the new dashboard. Also, need to finalize the user flow for the checkout process.',
    categories: ['Work', 'Design', 'Meeting'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Grocery List',
    content: 'Grocery list: Milk, Bread, Eggs, Cheese, Apples, Bananas, Chicken breast, Spinach. Don\'t forget to buy coffee beans.',
    categories: ['Personal', 'Shopping'],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Side Project Idea',
    content: 'Idea for a new side project: A mobile app that tracks water intake and reminds you to drink water throughout the day. Features: customizable reminders, progress tracking, and achievements.',
    categories: ['Ideas', 'AppDev'],
    createdAt: new Date().toISOString(),
  },
];

export default function Home() {
  const { toast } = useToast();
  const [showSplash, setShowSplash] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'text' | 'ai'>('text');
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [aiFoundNoteIds, setAiFoundNoteIds] = useState<string[] | null>(null);

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

  useEffect(() => {
    if (searchMode === 'text') {
        setAiFoundNoteIds(null);
    }
  }, [searchMode]);


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
          n.id === noteData.id ? { ...n, ...noteData, title: noteData.title || n.title, content: noteData.content || n.content, categories } : n
        )
      );
    } else {
      const newNote: Note = {
        id: new Date().getTime().toString(),
        title: noteData.title || 'Untitled Note',
        content: noteData.content || '',
        categories,
        createdAt: new Date().toISOString(),
      };
      setNotes([newNote, ...notes]);
    }
  };
  
  const handleSearch = async () => {
    if (searchMode !== 'ai' || !searchQuery.trim()) return;

    setIsSearching(true);
    setAiFoundNoteIds(null);
    try {
        const result = await findNotes({
            description: searchQuery,
            notes: notes.map(({ id, title, content }) => ({ id, title, content })),
        });
        setAiFoundNoteIds(result.noteIds);
        if (result.noteIds.length === 0) {
          toast({
            title: "No notes found",
            description: "AI search couldn't find any matching notes.",
          })
        }
    } catch (error) {
        console.error("AI search failed:", error);
        toast({
            variant: "destructive",
            title: "AI Search Failed",
            description: "Could not perform AI search. Please try again.",
        });
        setAiFoundNoteIds([]);
    } finally {
        setIsSearching(false);
    }
  };

  const allCategories = useMemo(() => [...new Set(notes.flatMap(note => note.categories))].sort(), [notes]);

  const filteredNotes = useMemo(() => {
    let notesToShow = notes;

    if (searchMode === 'ai' && aiFoundNoteIds !== null) {
        const idSet = new Set(aiFoundNoteIds);
        notesToShow = notesToShow.filter(note => idSet.has(note.id));
    }

    if (activeCategories.length > 0) {
        notesToShow = notesToShow.filter(note => 
            activeCategories.every(cat => note.categories.includes(cat))
        );
    }

    if (searchMode === 'text' && searchQuery.trim() !== '') {
        notesToShow = notesToShow.filter(note => 
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    if (searchMode === 'ai' && searchQuery.trim() === '' && aiFoundNoteIds !== null) {
        setAiFoundNoteIds(null);
    }
    
    return notesToShow;
  }, [notes, activeCategories, searchQuery, searchMode, aiFoundNoteIds]);

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
            className="w-full space-y-8"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-grow flex items-center gap-2">
                <Input 
                  placeholder={searchMode === 'text' ? 'Search notes by keyword...' : 'Describe the notes you\'re looking for...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchMode === 'ai' && !isSearching) {
                          handleSearch();
                      }
                  }}
                  className="h-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchMode(searchMode === 'text' ? 'ai' : 'text')}
                  title={`Switch to ${searchMode === 'text' ? 'AI' : 'Text'} Search`}
                >
                  {searchMode === 'text' ? <Bot className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                </Button>
                {searchMode === 'ai' && (
                  <Button onClick={handleSearch} disabled={isSearching} className="hidden sm:inline-flex">
                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    AI Search
                  </Button>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10">
                    <Filter className="mr-2 h-4 w-4" />
                    Categories
                    {activeCategories.length > 0 && <span className="ml-2 rounded-full bg-primary px-2 text-xs text-primary-foreground">{activeCategories.length}</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Filter by categories</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allCategories.map(category => (
                    <DropdownMenuCheckboxItem
                        key={category}
                        checked={activeCategories.includes(category)}
                        onCheckedChange={(checked) => {
                            if (checked) {
                                setActiveCategories([...activeCategories, category]);
                            } else {
                                setActiveCategories(activeCategories.filter(c => c !== category));
                            }
                        }}
                    >
                        {category}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {filteredNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredNotes.map((note) => (
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
                  <h2 className="text-2xl font-semibold">No notes found</h2>
                  <p className="text-muted-foreground mt-2">Try adjusting your search or filters, or add a new note!</p>
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
