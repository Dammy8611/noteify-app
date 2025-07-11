'use client';

import * as React from 'react';
import type { Note } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
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

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

const NoteCardComponent = ({ note, onDelete }: NoteCardProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="w-full"
    >
      <Card className="flex flex-col h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/10 group">
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-xl font-bold flex-1 group-hover:text-primary transition-colors line-clamp-2">
              <Link href={`/notes/view/${note.id}`}>
                {note.title}
              </Link>
            </CardTitle>
            <div className="flex gap-1 shrink-0">
              <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                <Link href={`/notes/view/${note.id}`}>
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View Note</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                <Link href={`/notes/edit/${note.id}`}>
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit Note</span>
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Note</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your note.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => onDelete(note.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow pb-4 space-y-4">
            <p className="text-muted-foreground whitespace-pre-wrap line-clamp-4">{note.content}</p>
            <div className="flex flex-wrap gap-2">
                {note.categories.length > 0 ? note.categories.map((category) => (
                    <Badge key={category} variant="secondary">{category}</Badge>
                )) : (
                    <Badge variant="outline">Uncategorized</Badge>
                )}
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {new Date(note.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export const NoteCard = React.memo(NoteCardComponent);
NoteCard.displayName = 'NoteCard';
