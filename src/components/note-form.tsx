'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Note } from '@/types';
import { categorizeNote } from '@/ai/flows/categorize-note';
import { useToast } from '@/hooks/use-toast';

const noteFormSchema = z.object({
  content: z.string().min(1, { message: 'Note cannot be empty.' }).max(5000),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (noteData: Partial<Note>, categories: string[]) => void;
  note: Note | null;
}

export function NoteForm({ isOpen, onOpenChange, onSave, note }: NoteFormProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategorizing, setIsCategorizing] = useState(false);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ content: note?.content || '' });
      setCategories(note?.categories || []);
    }
  }, [isOpen, note, form]);

  const handleCategorize = async () => {
    const content = form.getValues('content');
    if (!content.trim()) {
      toast({
        variant: 'destructive',
        title: 'Cannot categorize empty note',
        description: 'Please write something before using AI categorization.',
      });
      return;
    }
    setIsCategorizing(true);
    try {
      const result = await categorizeNote({ noteContent: content });
      setCategories(Array.from(new Set([...categories, ...result.categories])));
      toast({
        title: 'AI Suggestions Added!',
        description: `Categories suggested based on: ${result.reasoning}`,
      });
    } catch (error) {
      console.error('Categorization failed:', error);
      toast({
        variant: 'destructive',
        title: 'Categorization Failed',
        description: 'Could not get AI suggestions. Please try again.',
      });
    } finally {
      setIsCategorizing(false);
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setCategories(categories.filter(category => category !== categoryToRemove));
  };

  const onSubmit = (data: NoteFormValues) => {
    onSave({ ...note, content: data.content }, categories);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] bg-card">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit Note' : 'Add New Note'}</DialogTitle>
          <DialogDescription>
            {note ? 'Update your thoughts below.' : 'Jot down what\'s on your mind. Use AI to help you organize.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. My great idea for a new app..."
                      className="resize-y min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-3">
              <FormLabel>Categories</FormLabel>
              <div className="flex flex-wrap gap-2 p-2 rounded-md min-h-[40px] border border-input items-center">
                {categories.length > 0 ? categories.map((category) => (
                  <Badge key={category} variant="secondary" className="group/badge">
                    {category}
                    <button type="button" onClick={() => removeCategory(category)} className="ml-2 rounded-full opacity-50 group-hover/badge:opacity-100 transition-opacity">
                      <X className="h-3 w-3"/>
                    </button>
                  </Badge>
                )) : <p className="text-sm text-muted-foreground px-1">No categories yet. Try the AI suggestions!</p>}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-between flex-col-reverse sm:flex-row">
              <Button type="button" variant="outline" onClick={handleCategorize} disabled={isCategorizing}>
                {isCategorizing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4 text-primary" />
                )}
                Suggest with AI
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">Save Note</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
