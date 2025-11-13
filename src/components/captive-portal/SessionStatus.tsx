'use client';

import type { Session } from '@/types/session';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, LogOut, ShieldCheck } from 'lucide-react';
import Logo from '../common/Logo';

interface SessionStatusProps {
  session: Session;
  onLogout: () => void;
}

function formatTime(seconds: number) {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function SessionStatus({ session, onLogout }: SessionStatusProps) {
  const [remainingTime, setRemainingTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    const expiresAtMs = session.expiresAt * 1000;
    
    const calculateTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiresAtMs - now);
      setRemainingTime(remaining);

      if(remaining <= 0) {
        onLogout();
      }
    };
    
    // Calculate initial total duration (mock for RADIUS - in production this would come from RADIUS session data)
    try {
        // For RADIUS, we don't have JWT payload, so use a default duration
        const defaultDuration = 3600000; // 1 hour in milliseconds
        setTotalDuration(defaultDuration);
    } catch(e) {
        console.error("Error calculating total duration", e);
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [session, onLogout]);
  
  const progressValue = totalDuration > 0 ? (remainingTime / totalDuration) * 100 : 0;

  return (
    <Card className="w-full max-w-md shadow-2xl bg-card/90 backdrop-blur-sm text-center">
      <CardHeader className="items-center">
        <Logo />
        <CardTitle className="font-headline text-3xl flex items-center gap-2">
            <ShieldCheck className="text-primary w-8 h-8"/> Connected
        </CardTitle>
        <CardDescription>You are online with the {session.plan} plan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-2"><Clock size={16}/> Time Remaining</p>
          <p className="font-mono text-5xl font-bold tracking-tighter">
            {formatTime(remainingTime / 1000)}
          </p>
        </div>
        <Progress value={progressValue} className="w-full h-3" />
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button onClick={onLogout} variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4"/> Disconnect
        </Button>
        <p className="text-xs text-muted-foreground">Your MAC Address: {session.mac}</p>
      </CardFooter>
    </Card>
  );
}
