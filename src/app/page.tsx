'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Feather, BrainCircuit, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SplashScreen } from '@/components/splash-screen';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState<number>();

  useEffect(() => {
    if (!loading && user) {
      router.push('/notes');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Set year on client-side to avoid hydration mismatch
    setCurrentYear(new Date().getFullYear());
  }, []);

  if (loading || (!loading && user)) {
    // Show splash screen while checking auth or redirecting
    return <SplashScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-primary font-headline">Noteify</div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">
              Sign Up <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="secondary" className="px-4 py-1 rounded-full text-sm font-semibold">
              Powered by Generative AI
            </Badge>
            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
              Capture Your Thoughts, <br />
              <span className="text-primary">Supercharge Your Notes.</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
              Noteify is the intelligent note-taking app that helps you organize, find, and connect your ideas like never before.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Why Noteify?</h2>
            <p className="text-muted-foreground mt-2">Everything you need for modern note-taking.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Feather className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Simple & Clean</h3>
              <p className="mt-2 text-muted-foreground">
                A beautiful, distraction-free interface to let your ideas flow.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <BrainCircuit className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">AI-Powered Search</h3>
              <p className="mt-2 text-muted-foreground">
                Describe what you're looking for, and our AI will find it instantly.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.3 }} className="flex flex-col items-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                 <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Secure & Synced</h3>
              <p className="mt-2 text-muted-foreground">
                Your notes are securely stored and available on all your devices.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="container mx-auto px-4 py-6 text-center text-muted-foreground">
        © {currentYear} Noteify. All Rights Reserved.
      </footer>
    </div>
  );
}
