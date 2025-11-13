'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Session } from '@/types/session';
import { claimPaymentSessionAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import LoginForm from './LoginForm';
import SessionStatus from './SessionStatus';
import Logo from '../common/Logo';
import { WifiOff } from 'lucide-react';

// Generate a random mock MAC address for development
function generateMockMacAddress() {
  return 'XX:XX:XX:XX:XX:XX'.replace(/X/g, () => {
    return '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16));
  });
}

export default function CaptivePortal() {
  const [macAddress, setMacAddress] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      let mac = searchParams.get('mac');
      if (!mac) {
        // For development, use a mock MAC if none is provided.
        // In production, the router would always provide this.
        mac = generateMockMacAddress();
        console.warn(`No MAC address found in URL. Using mock address for development: ${mac}`);
      }
      setMacAddress(mac);

      // 1. Check for RADIUS credentials in local storage
      const storedCredentials = localStorage.getItem('wifly_radius_credentials');
      if (storedCredentials) {
        try {
          const [username, password] = storedCredentials.split(':');
          if (username && password) {
            // Check if session is still active (this would be verified against RADIUS in production)
            setSession({
              token: storedCredentials,
              mac: mac,
              plan: 'Active Session',
              expiresAt: Date.now() / 1000 + 3600, // Mock 1 hour expiry
            });
            setIsLoading(false);
            return;
          } else {
            localStorage.removeItem('wifly_radius_credentials');
          }
        } catch (e) {
          console.error('Invalid credentials found in storage', e);
          localStorage.removeItem('wifly_radius_credentials');
        }
      }

      // 2. Check for payment session redirect
      const paymentRef = searchParams.get('payment_ref');
      if (paymentRef) {
        const result = await claimPaymentSessionAction(paymentRef, mac);
        if (result.success && result.token) {
          // result.token now contains RADIUS credentials (username:password)
          const newSession: Session = {
            token: result.token,
            mac: mac,
            plan: 'Paid Access',
            expiresAt: Date.now() / 1000 + 86400, // Mock 24 hour expiry
          };
          localStorage.setItem('wifly_radius_credentials', result.token);
          setSession(newSession);
          toast({ title: 'Success', description: result.message });
          // clean URL
          window.history.replaceState(null, '', `/?mac=${mac}`);
        } else {
          toast({
            variant: 'destructive',
            title: 'Payment Claim Failed',
            description: result.message,
          });
        }
      }
      
      setIsLoading(false);
    };

    initialize();
  }, [searchParams, toast]);
  
  const handleLoginSuccess = (credentials: string) => {
    try {
      // credentials now contains RADIUS username:password
      const newSession: Session = {
        token: credentials,
        mac: macAddress || '',
        plan: 'Voucher Access',
        expiresAt: Date.now() / 1000 + 3600, // Mock 1 hour expiry
      };
      localStorage.setItem('wifly_radius_credentials', credentials);
      setSession(newSession);
    } catch (e) {
      console.error("Failed to process credentials", e);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Received invalid credentials."
      })
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('wifly_radius_credentials');
    setSession(null);
    toast({ title: 'Logged Out', description: 'Your session has ended.' });
  };
  
  if (errorMessage) {
     return (
       <Card className="w-full max-w-md z-10 shadow-2xl bg-card/90">
         <CardHeader className="items-center text-center">
            <Logo />
         </CardHeader>
         <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <WifiOff className="w-16 h-16 text-destructive mb-4"/>
          <h2 className="text-xl font-bold text-destructive">Connection Error</h2>
          <p className="text-muted-foreground mt-2">{errorMessage}</p>
         </CardContent>
       </Card>
     )
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md z-10 shadow-2xl">
        <CardHeader className="items-center">
          <Logo />
        </CardHeader>
        <CardContent className="p-8 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="z-10">
      {session ? (
        <SessionStatus session={session} onLogout={handleLogout} />
      ) : (
        macAddress && <LoginForm macAddress={macAddress} onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}
