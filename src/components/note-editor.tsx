'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, X, ArrowLeft, BrainCircuit, Bold, Italic, Code, List } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { Note } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { categorizeNote } from '@/ai/flows/categorize-note';
import { brainstormNote } from '@/ai/flows/brainstorm-note';
import { addNote, updateNote } from '@/lib/firestore';

const noteFormSchema = z.object({
  title: z.string().min(1, { message: 'Title cannot be empty.' }).max(100, { message: 'Title cannot exceed 100 characters.' }),
  content: z.string().min(1, { message: 'Note cannot be empty.' }).max(10000), // Increased limit for detailed notes
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteEditorProps {
  note?: Note | null;
}

export function NoteEditor({ note }: NoteEditorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isBrainstorming, setIsBrainstorming] = useState(false);

  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: note?.title || '',
      content: note?.content || '',
    },
  });

  useEffect(() => {
    if (note) {
      form.reset({
        title: note.title,
        content: note.content,
      });
      setCategories(note.categories || []);
    }
  }, [note, form]);

  const applyFormat = (formatType: 'bold' | 'italic' | 'mono' | 'list') => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let replacement = '';
    
    if (formatType === 'list') {
        const lines = selectedText.split('\n');
        const allAreListItems = lines.every(line => line.trim().startsWith('- '));
        if (allAreListItems) {
            replacement = lines.map(line => line.replace(/^- /, '')).join('\n');
        } else {
            replacement = lines.map(line => line.trim().startsWith('- ') ? line : `- ${line}`).join('\n');
        }
    } else {
        const syntax = { bold: '**', italic: '_', mono: '`' }[formatType];
        if (selectedText.startsWith(syntax) && selectedText.endsWith(syntax)) {
            replacement = selectedText.slice(syntax.length, -syntax.length);
        } else {
            replacement = `${syntax}${selectedText}${syntax}`;
        }
    }

    const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    form.setValue('content', newValue, { shouldValidate: true });
    
    textarea.focus();
    setTimeout(() => {
        textarea.selectionStart = start + replacement.length;
        textarea.selectionEnd = start + replacement.length;
    }, 0);
  };


  const handleCategorize = async () => {
    const values = form.getValues();
    if (!values.content.trim() && !values.title.trim()) {
      toast({ variant: 'destructive', title: 'Cannot categorize empty note' });
      return;
    }
    setIsCategorizing(true);
    try {
      const result = await categorizeNote({ title: values.title, noteContent: values.content });
      setCategories(Array.from(new Set([...categories, ...result.categories])));
      toast({ title: 'AI Suggestions Added!', description: result.reasoning });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Categorization Failed' });
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleBrainstorm = async () => {
    const values = form.getValues();
    if (!values.content.trim() && !values.title.trim()) {
        toast({ variant: 'destructive', title: 'Cannot brainstorm an empty note.' });
        return;
    }
    setIsBrainstorming(true);
    try {
        const result = await brainstormNote({ title: values.title, noteContent: values.content });
        form.setValue('content', result.rewrittenContent, { shouldValidate: true });
        toast({ title: 'Brainstorm Complete!', description: 'The AI has rewritten and expanded your note.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Brainstorm Failed' });
    } finally {
        setIsBrainstorming(false);
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setCategories(categories.filter(category => category !== categoryToRemove));
  };

  const onSubmit = async (data: NoteFormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in to save a note.' });
        return;
    }
    setIsSaving(true);
    
    const noteToSave = {
        title: data.title,
        content: data.content,
        categories,
    };

    try {
      if (note?.id) {
        await updateNote(user.uid, note.id, noteToSave);
        toast({ title: 'Note Updated Successfully' });
      } else {
        await addNote(user.uid, noteToSave);
        toast({ title: 'Note Created Successfully' });
      }
      router.push('/notes');
      router.refresh(); // To ensure the notes list is updated
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save note' });
      setIsSaving(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-center gap-4">
                    <Button type="button" variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <h1 className="text-3xl font-bold text-center flex-grow">{note ? 'Edit Note' : 'Create New Note'}</h1>
                    <div className="w-10"></div> {/* Spacer */}
                </div>

                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-lg">Title</FormLabel>
                        <FormControl>
                            <Input placeholder="My brilliant new idea..." {...field} className="text-lg sm:text-xl p-4 sm:p-6"/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-lg">Content</FormLabel>
                        <div className="rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                            <div className="p-2 border-b border-input flex items-center gap-1">
                                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('bold')} title="Bold"><Bold className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('italic')} title="Italic"><Italic className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('mono')} title="Monospace"><Code className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('list')} title="List"><List className="h-4 w-4" /></Button>
                            </div>
                            <FormControl>
                                <Textarea
                                    placeholder="Start writing your note here..."
                                    className="min-h-[40vh] text-base p-4 sm:p-6 border-0 rounded-t-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                    {...field}
                                    ref={(e) => {
                                      field.ref(e);
                                      contentRef.current = e;
                                    }}
                                />
                            </FormControl>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-3">
                    <FormLabel className="text-lg">Categories</FormLabel>
                    <div className="flex flex-wrap gap-2 p-3 rounded-md min-h-[46px] border border-input items-center">
                        {categories.map((category) => (
                        <Badge key={category} variant="secondary" className="group/badge text-sm py-1 px-3">
                            {category}
                            <button type="button" onClick={() => removeCategory(category)} className="ml-2 rounded-full opacity-50 group-hover/badge:opacity-100 transition-opacity">
                                <X className="h-3 w-3"/>
                            </button>
                        </Badge>
                        ))}
                         {categories.length === 0 && <p className="text-sm text-muted-foreground px-1">No categories. Use AI to suggest some!</p>}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-between items-center p-4 border-t border-border sticky bottom-0 bg-background/80 backdrop-blur-sm -mx-6 px-6">
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button type="button" variant="outline" onClick={handleBrainstorm} disabled={isBrainstorming || isCategorizing || isSaving}>
                            {isBrainstorming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                            Brainstorm with AI
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCategorize} disabled={isCategorizing || isBrainstorming || isSaving}>
                            {isCategorizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-primary" />}
                            Suggest Categories
                        </Button>
                    </div>
                    <div className="w-full sm:w-auto">
                      <Button type="submit" disabled={isSaving || isBrainstorming || isCategorizing} className="w-full">
                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {note ? 'Save Changes' : 'Create Note'}
                      </Button>
                    </div>
                </div>
            </form>
        </Form>
    </main>
  );
}
