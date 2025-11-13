'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { redeemVoucherAction, createCheckoutSessionAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';
import { CreditCard, Loader2, Ticket } from 'lucide-react';
import Logo from '../common/Logo';

interface LoginFormProps {
  macAddress: string;
  onLoginSuccess: (credentials: string) => void;
}

function SubmitButton({ children, icon, ...props }: { children: React.ReactNode; icon: React.ReactNode; [key: string]: any }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? <Loader2 className="animate-spin" /> : icon}
      {children}
    </Button>
  );
}

export default function LoginForm({ macAddress, onLoginSuccess }: LoginFormProps) {
  const { toast } = useToast();

  const [voucherState, voucherFormAction] = useActionState(redeemVoucherAction, {
    success: false,
    message: '',
  });

  const [paymentState, paymentFormAction] = useActionState(createCheckoutSessionAction, {
    success: false,
    message: '',
  });

  const voucherFormRef = useRef<HTMLFormElement>(null);
  const paymentFormRef = useRef<HTMLFormElement>(null);
  const voucherToastShown = useRef(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('plan_3'); // Default to 24 hours

  useEffect(() => {
    if (voucherState.success && voucherState.token) {
      toast({ title: 'Success!', description: voucherState.message });
      // voucherState.token now contains RADIUS credentials (username:password)
      onLoginSuccess(voucherState.token);
      voucherFormRef.current?.reset();
      voucherToastShown.current = false; // Reset for next attempt
    } else if (!voucherState.success && voucherState.message) {
      if (!voucherToastShown.current) {
        toast({ variant: 'destructive', title: 'Error', description: voucherState.message });
        voucherToastShown.current = true;
      }
    }
  }, [voucherState, onLoginSuccess, toast]);

  useEffect(() => {
    if (paymentState.success && paymentState.redirectUrl) {
      window.location.href = paymentState.redirectUrl;
    } else if (!paymentState.success && paymentState.message) {
      toast({ variant: 'destructive', title: 'Error', description: paymentState.message });
    }
  }, [paymentState, toast]);

  const handleVoucherSubmit = (formData: FormData) => {
    voucherToastShown.current = false;
    voucherFormAction(formData);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl bg-card/90 backdrop-blur-sm">
      <CardHeader className="text-center items-center">
        <Logo />
        <CardTitle className="font-headline text-3xl">Welcome to WiFly</CardTitle>
        <CardDescription>Get connected in seconds.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <form action={handleVoucherSubmit} ref={voucherFormRef} className="space-y-4">
          <input type="hidden" name="macAddress" value={macAddress} />
          <div>
            <label htmlFor="code" className="sr-only">Voucher Code</label>
            <Input id="code" name="code" type="text" placeholder="Enter Voucher Code" required className="text-center text-lg h-12"/>
          </div>
          <SubmitButton icon={<Ticket/>} className="w-full h-12 text-lg font-semibold">Redeem Voucher</SubmitButton>
        </form>
        
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
        </div>

        <form action={paymentFormAction} ref={paymentFormRef}>
          <input type="hidden" name="macAddress" value={macAddress} />
          <input type="hidden" name="planId" value={selectedPlan} />
          <div className="space-y-3 mb-4">
            <label className="text-sm font-medium">Select Plan</label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plan_1">1 Hour - Ksh 50</SelectItem>
                <SelectItem value="plan_2">12 Hours - Ksh 250</SelectItem>
                <SelectItem value="plan_3">24 Hours - Ksh 500</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3 mb-4">
            <label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              placeholder="+254712345678"
              required
              className="text-center text-lg h-12"
            />
          </div>
          <SubmitButton variant="secondary" icon={<CreditCard/>} className="w-full h-12 text-lg bg-accent text-accent-foreground hover:bg-accent/90">
            Buy Access
          </SubmitButton>
        </form>
        <a href="tel:0748809701" className="text-center text-sm text-muted-foreground mt-4 block">
          Need help? Call 0748809701
        </a>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground justify-center">
        <p>Your MAC Address: {macAddress}</p>
      </CardFooter>
    </Card>
  );
}
