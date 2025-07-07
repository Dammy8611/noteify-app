'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { SplashScreen } from '@/components/splash-screen';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Diagnostic check for auth domain mismatch
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '';
    if (typeof window !== 'undefined') {
      const currentHostname = window.location.hostname;
      const isDefaultFirebaseDomain = authDomain.includes('firebaseapp.com');
      const isLocal = currentHostname.includes('localhost') || currentHostname.includes('127.0.0.1');

      if (!isLocal && isDefaultFirebaseDomain && !currentHostname.includes('firebaseapp.com')) {
        toast({
          variant: 'destructive',
          title: 'Configuration Mismatch Detected',
          description: `Your app is on "${currentHostname}" but Firebase is configured for "${authDomain}". Please update NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN in your hosting environment to "${currentHostname}" to fix Google Sign-In.`,
          duration: Infinity, // This toast will not auto-dismiss
        });
      }
    }


    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
