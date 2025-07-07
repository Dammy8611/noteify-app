'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import { SplashScreen } from '@/components/splash-screen';
import { useToast } from '@/hooks/use-toast';

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    // Also redirect unverified users for email/password provider
    if (!loading && user && !user.emailVerified && user.providerData.some(p => p.providerId === 'password')) {
        toast({
            variant: "destructive",
            title: "Email not verified",
            description: "Please verify your email to access your notes.",
        });
        auth.signOut();
        router.push('/login');
    }
  }, [user, loading, router, toast]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (loading || !user) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center px-4">
          <div className="text-2xl font-bold text-primary font-headline mr-auto">
            Noteify
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Log Out">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Log Out</span>
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
