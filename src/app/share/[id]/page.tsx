import { getPublicNote } from '@/lib/firestore';
import type { Note } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

// Simple markdown to HTML renderer
const renderMarkdown = (text: string) => {
  if (!text) return { __html: '' };
  let html = text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
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

  return { __html: html };
};

export default async function SharePage({ params }: { params: { id: string } }) {
    const note: Note | null = await getPublicNote(params.id);

    if (!note) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center bg-background p-4">
                <h1 className="text-4xl font-bold text-destructive mb-4">Note Not Found</h1>
                <p className="text-lg text-muted-foreground mb-8">This note either doesn't exist or is not public.</p>
                <Button asChild>
                    <Link href="/">Back to Home</Link>
                </Button>
            </div>
        );
    }
    
    return (
        <div className="dark bg-background min-h-screen">
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
                <div className="container mx-auto flex h-14 items-center px-4">
                <div className="text-2xl font-bold text-primary font-headline mr-auto">
                    Noteify
                </div>
                <Button asChild>
                    <Link href="/signup">
                        Try Noteify
                    </Link>
                </Button>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-3xl md:text-4xl font-bold">{note.title}</CardTitle>
                            <p className="text-sm text-muted-foreground pt-2">
                                Shared on {new Date(note.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div 
                                className="text-foreground/90 whitespace-pre-wrap leading-relaxed [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1"
                                dangerouslySetInnerHTML={renderMarkdown(note.content)}
                            />
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
