'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { completeOnboarding } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { SplashScreen } from '@/components/splash-screen';

export default function OnboardingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [wantsUpdates, setWantsUpdates] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in.' });
            return;
        }
        setIsSubmitting(true);
        try {
            await completeOnboarding(user.uid, wantsUpdates);
            toast({ title: 'Welcome to Noteify!' });
            router.push('/notes');
        } catch (error) {
            console.error("Failed to complete onboarding:", error);
            toast({ variant: 'destructive', title: 'Could not save preferences.' });
            setIsSubmitting(false);
        }
    };

    if (loading || !user) {
        return <SplashScreen />;
    }

    const termsAndConditions = `Welcome to Noteify! These terms and conditions outline the rules and regulations for the use of Noteify's Website.

By accessing this website we assume you accept these terms and conditions. Do not continue to use Noteify if you do not agree to take all of the terms and conditions stated on this page.

1. License
Unless otherwise stated, Noteify and/or its licensors own the intellectual property rights for all material on Noteify. All intellectual property rights are reserved. You may access this from Noteify for your own personal use subjected to restrictions set in these terms and conditions.

You must not:
- Republish material from Noteify
- Sell, rent or sub-license material from Noteify
- Reproduce, duplicate or copy material from Noteify
- Redistribute content from Noteify

2. User Content
In these Terms and Conditions, “Your Content” shall mean any text, images or other material you choose to store in Noteify. Your content remains yours. By storing Your Content, you grant Noteify a non-exclusive, worldwide irrevocable license solely for the purpose of providing and improving the service to you.

Your Content must be your own and must not be invading any third-party's rights. Noteify reserves the right to remove any of Your Content from this service at any time without notice if it violates these terms.

3. No Warranties
This Website is provided “as is,” with all faults, and Noteify expresses no representations or warranties, of any kind related to this Website or the materials contained on this Website.

4. Limitation of Liability
In no event shall Noteify, nor any of its officers, directors and employees, be held liable for anything arising out of or in any way connected with your use of this Website.`;

    const cookiePolicy = `We use cookies to enhance your experience. By using Noteify, you consent to the use of cookies for essential functionalities such as authentication and session management. We do not use cookies for tracking or advertising purposes. This is necessary for the site to function.`;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Welcome to Noteify!</CardTitle>
                    <CardDescription>Just a few things before you get started.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label className="text-lg font-semibold">Terms and Conditions</Label>
                        <ScrollArea className="h-48 mt-2 rounded-md border p-4 text-sm text-muted-foreground whitespace-pre-wrap">
                            {termsAndConditions}
                        </ScrollArea>
                        <div className="flex items-center space-x-2 mt-4">
                            <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(Boolean(checked))} />
                            <Label htmlFor="terms" className="font-normal cursor-pointer">I have read and agree to the Terms and Conditions</Label>
                        </div>
                    </div>
                    <div>
                        <Label className="text-lg font-semibold">Stay Updated</Label>
                        <div className="flex items-center space-x-2 mt-2">
                             <Checkbox id="updates" checked={wantsUpdates} onCheckedChange={(checked) => setWantsUpdates(Boolean(checked))} />
                             <Label htmlFor="updates" className="font-normal cursor-pointer">Receive emails about new features and updates.</Label>
                        </div>
                    </div>
                    <div>
                         <Label className="text-lg font-semibold">Cookie Policy</Label>
                         <p className="text-sm text-muted-foreground mt-2">{cookiePolicy}</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSubmit} disabled={!agreedToTerms || isSubmitting} className="w-full">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue to App
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
