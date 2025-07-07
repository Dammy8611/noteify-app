'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Bot, Search, Filter, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { NoteCard } from '@/components/note-card';
import type { Note } from '@/types';
import { findNotes } from '@/ai/flows/find-notes';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { getNotes, deleteNoteFirestore } from '@/lib/firestore';

export default function NotesPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'text' | 'ai'>('text');
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [aiFoundNoteIds, setAiFoundNoteIds] = useState<string[] | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setIsLoadingNotes(true);
    try {
      const userNotes = await getNotes(user.uid);
      setNotes(userNotes);
    } catch (error: any) {
      console.error("Failed to fetch notes:", error);
      let description = 'Could not fetch your notes from the database. Please try again later.';
      if (error.code === 'permission-denied') {
        description = "Permission denied. Please check your Firestore security rules in the Firebase console.";
      }
      toast({
        variant: 'destructive',
        title: 'Failed to load notes',
        description,
      });
    } finally {
      setIsLoadingNotes(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (searchMode === 'text') {
      setAiFoundNoteIds(null);
    }
  }, [searchMode]);

  const handleDeleteNote = useCallback(async (id: string) => {
    if (!user) return;
    const originalNotes = [...notes];
    setNotes(notes => notes.filter((note) => note.id !== id)); // Optimistic update
    try {
      await deleteNoteFirestore(user.uid, id);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete note',
        description: 'Could not delete the note. Please try again.',
      });
      setNotes(originalNotes); // Revert on failure
    }
  }, [user, toast]);
  
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

  return (
    <>
      <main className="container mx-auto px-4 py-8">
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
            
            {isLoadingNotes ? (
              <div className="text-center py-20">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading your notes...</p>
              </div>
            ) : filteredNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onDelete={handleDeleteNote}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-lg animate-fade-in-up">
                  <h2 className="text-2xl font-semibold">No notes yet</h2>
                  <p className="text-muted-foreground mt-2">Click the '+' button to create your first note!</p>
                </div>
              )}
          </motion.div>

          <Button
            asChild
            aria-label="Add Note"
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 focus:ring-accent transition-transform duration-300 ease-in-out hover:scale-110"
            size="icon"
          >
            <Link href="/notes/new">
                <Plus className="h-8 w-8" />
            </Link>
          </Button>

      </main>
    </>
  );
}
