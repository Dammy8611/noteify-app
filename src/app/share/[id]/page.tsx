import { getPublicNote } from '@/lib/firestore';
import type { Note } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { renderMarkdown } from '@/lib/markdown';
import Image from 'next/image';

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
                <Link href="/" className="flex items-center gap-2 mr-auto">
                    <Image src="/logo.png" alt="Noteify Logo" width={32} height={32} />
                    <div className="text-2xl font-bold text-primary font-headline">
                        Noteify
                    </div>
                </Link>
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
                                className="text-foreground/90 whitespace-pre-wrap leading-relaxed [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:my-3"
                                dangerouslySetInnerHTML={renderMarkdown(note.content)}
                            />
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
