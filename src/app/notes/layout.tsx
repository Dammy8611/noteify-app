'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, FlaskConical } from 'lucide-react';
import { SplashScreen } from '@/components/splash-screen';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getUserProfile, createUserProfile } from '@/lib/firestore';

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [onboardingStatus, setOnboardingStatus] = useState<'checking' | 'complete' | 'incomplete'>('checking');

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    // Redirect unverified users for email/password provider
    if (!user.emailVerified && user.providerData.some(p => p.providerId === 'password')) {
        toast({
            variant: "destructive",
            title: "Email not verified",
            description: "Please verify your email to access your notes.",
        });
        auth.signOut();
        router.push('/login');
        return;
    }
    
    const performOnboardingCheck = async () => {
      let profile = await getUserProfile(user.uid);
      if (!profile) {
        await createUserProfile(user.uid, user.email);
        profile = await getUserProfile(user.uid); // Re-fetch to get the created profile
      }
      
      if (profile?.onboardingComplete) {
        setOnboardingStatus('complete');
      } else {
        setOnboardingStatus('incomplete');
        router.push('/onboarding');
      }
    };
    
    performOnboardingCheck();

  }, [user, loading, router, toast]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (loading || !user || onboardingStatus !== 'complete') {
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
            <Button variant="outline" asChild>
              <Link href="/notes/research">
                <FlaskConical className="mr-2 h-4 w-4" />
                Research Assistant
              </Link>
            </Button>
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
