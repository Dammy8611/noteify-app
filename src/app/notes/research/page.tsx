'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getNotes, addNote } from '@/lib/firestore';
import { researchAndCreateNote } from '@/ai/flows/research-note';
import { downloadAsTxt, downloadAsPdf, downloadAsDocx } from '@/lib/download';
import type { Note } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, FlaskConical, ArrowLeft, Save, Download, FileText, FileCode, Plus } from 'lucide-react';
import { SplashScreen } from '@/components/splash-screen';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { renderMarkdown } from '@/lib/markdown';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function ResearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [generatedNote, setGeneratedNote] = useState<{ title: string; content: string } | null>(null);
  const [contextSearch, setContextSearch] = useState('');
  
  const [isMentioning, setIsMentioning] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const topicRef = useRef<HTMLTextAreaElement>(null);

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

  const filteredContextNotes = useMemo(() => {
    if (!contextSearch.trim()) {
        return notes;
    }
    return notes.filter(note => 
        note.title.toLowerCase().includes(contextSearch.toLowerCase())
    );
  }, [notes, contextSearch]);

  const mentionFilteredNotes = useMemo(() => {
    if (!mentionQuery) {
      return notes.slice(0, 5); // Show first 5 by default
    }
    return notes.filter(note =>
      note.title.toLowerCase().includes(mentionQuery.toLowerCase())
    ).slice(0, 5);
  }, [notes, mentionQuery]);
  
  const handleTopicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setTopic(text);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPosition);
    
    const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);

    if (atMatch) {
      setIsMentioning(true);
      setMentionQuery(atMatch[1]);
    } else {
      setIsMentioning(false);
    }
  };

  const handleMentionSelect = (noteToMention: Note) => {
    const textarea = topicRef.current;
    if (!textarea) return;

    const currentText = textarea.value;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = currentText.substring(0, cursorPos);
    
    const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);

    if (atMatch && atMatch.index !== undefined) {
      const startIndex = atMatch.index;
      const newText =
        currentText.substring(0, startIndex) +
        `@'${noteToMention.title}' ` +
        currentText.substring(cursorPos);

      setTopic(newText);
      
      setSelectedNoteIds(prev => {
        const newSet = new Set(prev);
        newSet.add(noteToMention.id);
        return newSet;
      });
      setIsMentioning(false);
      
      const newCursorPos = startIndex + `@'${noteToMention.title}' `.length;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

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
    setGeneratedNote(null);
    try {
      const contextNotes = notes.filter(note => selectedNoteIds.has(note.id));

      const result = await researchAndCreateNote({
        topic,
        contextNotes: contextNotes.map(({ id, title, content }) => ({ id, title, content })),
      });
      
      setGeneratedNote(result);

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
  
  const handleSaveNote = async () => {
    if (!user || !generatedNote) return;
    setIsSaving(true);
    try {
        const newNote = await addNote(user.uid, {
            title: generatedNote.title,
            content: generatedNote.content,
            categories: ['AI Generated', 'Research'],
        });
        toast({
            title: 'Note Saved!',
            description: 'Your new research note has been saved.',
        });
        router.push(`/notes/view/${newNote.id}`);
    } catch(error) {
        toast({ variant: 'destructive', title: 'Failed to save note' });
    } finally {
        setIsSaving(false);
    }
  }

  const handleSelectNote = (noteId: string) => {
    setSelectedNoteIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(noteId)) {
            newSet.delete(noteId);
        } else {
            newSet.add(noteId);
        }
        return newSet;
    });
  }

  if (isLoadingNotes) {
    return <SplashScreen />;
  }

  const handleDownload = (format: 'txt' | 'pdf' | 'docx') => {
    if (!generatedNote) return;
    const noteData = { title: generatedNote.title, content: generatedNote.content };
    if (format === 'txt') downloadAsTxt(noteData);
    if (format === 'pdf') downloadAsPdf(noteData);
    if (format === 'docx') downloadAsDocx(noteData);
  }


  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-start items-center mb-6">
            <Button type="button" variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
        </div>

        {generatedNote ? (
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl font-bold">{generatedNote.title}</CardTitle>
                </CardHeader>
                <CardContent>
                     <ScrollArea className="h-[50vh] pr-4">
                        <div 
                            className="text-foreground/90 whitespace-pre-wrap leading-relaxed [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:my-3"
                            dangerouslySetInnerHTML={renderMarkdown(generatedNote.content)}
                        />
                    </ScrollArea>
                </CardContent>
                <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <Button onClick={() => setGeneratedNote(null)} variant="outline" className="w-full sm:w-auto">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        New Research
                    </Button>
                    <div className="flex flex-col gap-2 sm:flex-row w-full sm:w-auto">
                        <Button onClick={handleSaveNote} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save as Note
                        </Button>
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
                    </div>
                </CardFooter>
            </Card>
        ) : (
            <Card>
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
                <FlaskConical className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">AI Research Assistant</CardTitle>
                <CardDescription className="text-lg text-muted-foreground pt-2">
                Ask a question or provide a topic. Use @ to reference your notes, and the AI will create a new, detailed note for you.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid w-full gap-2">
                    <Label htmlFor="topic" className="text-lg font-semibold">Your Research Topic</Label>
                    <Popover open={isMentioning} onOpenChange={setIsMentioning}>
                      <PopoverTrigger asChild>
                        <Textarea
                          id="topic"
                          ref={topicRef}
                          placeholder="e.g., 'Compare the key points from @'Q1 Sales Report' with the projections in @'2024 Market Trends''"
                          value={topic}
                          onChange={handleTopicChange}
                          onKeyDown={(e) => { if (e.key === 'Escape') setIsMentioning(false); }}
                          rows={4}
                          className="text-base"
                          disabled={isGenerating}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-1" side="bottom" align="start">
                        <div className="p-1">
                          <p className="text-xs text-muted-foreground px-2 pb-1">Mention a note</p>
                          <ScrollArea className="h-40">
                              <div className="space-y-1 p-1">
                                  {mentionFilteredNotes.length > 0 ? (
                                      mentionFilteredNotes.map(note => (
                                          <div
                                              key={note.id}
                                              onClick={() => handleMentionSelect(note)}
                                              className="p-2 rounded-md hover:bg-accent cursor-pointer text-sm"
                                          >
                                              {note.title}
                                          </div>
                                      ))
                                  ) : <p className="text-sm text-muted-foreground text-center p-2">No notes match.</p>}
                              </div>
                          </ScrollArea>
                        </div>
                      </PopoverContent>
                    </Popover>
                </div>
                
                <Collapsible>
                    <CollapsibleTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
                            <Plus className="mr-2 h-4 w-4" />
                            Select additional context notes (optional)
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 space-y-4 animate-accordion-down">
                      <div className="grid w-full gap-2">
                          <p className="text-sm text-muted-foreground">The AI will use these notes to better understand your request. Notes you @mention are selected automatically.</p>
                          <Input
                              placeholder="Search your notes to filter them..."
                              value={contextSearch}
                              onChange={(e) => setContextSearch(e.target.value)}
                              disabled={isGenerating}
                              className="my-2"
                          />
                          <ScrollArea className="h-48 rounded-md border p-4">
                              <div className="space-y-2">
                                  {notes.length > 0 ? (
                                      filteredContextNotes.length > 0 ? (
                                          filteredContextNotes.map(note => (
                                              <div key={note.id} className="flex items-center space-x-2">
                                                  <Checkbox
                                                      id={`note-${note.id}`}
                                                      checked={selectedNoteIds.has(note.id)}
                                                      onCheckedChange={() => handleSelectNote(note.id)}
                                                      disabled={isGenerating}
                                                  />
                                                  <Label htmlFor={`note-${note.id}`} className="font-normal cursor-pointer">{note.title}</Label>
                                              </div>
                                          ))
                                      ) : (
                                          <p className="text-sm text-center text-muted-foreground">No notes match your search.</p>
                                      )
                                  ) : (
                                      <p className="text-sm text-center text-muted-foreground">You don't have any notes yet.</p>
                                  )}
                              </div>
                          </ScrollArea>
                      </div>
                    </CollapsibleContent>
                </Collapsible>

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
        )}
      </div>
    </main>
  );
}
