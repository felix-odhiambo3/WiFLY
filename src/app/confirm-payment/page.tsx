'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';

function ConfirmPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'stk-success' | 'stk-failed' | 'redirecting'>('loading');

  useEffect(() => {
    const paymentRef = searchParams.get('payment_ref');
    const macAddress = searchParams.get('mac');
    const stkStatus = searchParams.get('stk');
    const baseUrl = window.location.origin;

    if (stkStatus === 'success') {
      setStatus('stk-success');
    } else if (stkStatus === 'failed') {
      setStatus('stk-failed');
    }

    if (paymentRef && macAddress) {
      // This timeout simulates the payment provider processing and redirecting.
      const timer = setTimeout(() => {
        setStatus('redirecting');
        const homeUrl = `${baseUrl}/?mac=${macAddress}&payment_ref=${paymentRef}`;
        router.push(homeUrl);
      }, 5000); // 5-second delay for STK Push

      return () => clearTimeout(timer);
    } else {
      // If params are missing, redirect home after a short delay
      const timer = setTimeout(() => {
        setStatus('redirecting');
        const homeUrl = `${baseUrl}/`;
        router.push(homeUrl);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  const renderContent = () => {
    switch (status) {
      case 'stk-success':
        return (
          <>
            <CardHeader className="text-center items-center">
              <Logo />
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Smartphone className="w-6 h-6" />
                STK Push Sent!
              </CardTitle>
              <CardDescription>Check your phone for the M-Pesa payment prompt.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <p className="text-muted-foreground">
                A payment request has been sent to your phone. Complete the transaction to activate your internet access.
              </p>
            </CardContent>
          </>
        );

      case 'stk-failed':
        return (
          <>
            <CardHeader className="text-center items-center">
              <Logo />
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Payment Instructions Sent
              </CardTitle>
              <CardDescription>STK Push failed, but we've sent payment details via SMS.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
              <Smartphone className="w-16 h-16 text-blue-500" />
              <p className="text-muted-foreground">
                Check your SMS for manual payment instructions. Once payment is received, you'll get a voucher code to redeem.
              </p>
            </CardContent>
          </>
        );

      case 'redirecting':
        return (
          <>
            <CardHeader className="text-center items-center">
              <Logo />
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Loader2 className="animate-spin" />
                Redirecting...
              </CardTitle>
              <CardDescription>Taking you back to the login page.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <p className="text-muted-foreground">
                Redirecting you back to complete your login...
              </p>
            </CardContent>
          </>
        );

      default:
        return (
          <>
            <CardHeader className="text-center items-center">
              <Logo />
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Loader2 className="animate-spin" />
                Processing Payment...
              </CardTitle>
              <CardDescription>Please wait while we confirm your transaction.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <p className="text-muted-foreground">
                Your payment is being securely processed. You will be redirected back to the login page automatically.
              </p>
            </CardContent>
          </>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        {renderContent()}
      </Card>
    </div>
  );
}

export default function ConfirmPaymentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ConfirmPaymentContent />
        </Suspense>
    )
}
