'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Trash2, Undo2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Payment, Plan } from '@/lib/db';
import {
  createManualPaymentAction,
  deletePaymentAction,
  getPayments,
  issueRefundAction,
} from './actions';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : children}
    </Button>
  );
}

function ClientFormattedDate({ date }: { date: string | Date }) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // This code runs only on the client, after the initial render.
    setFormattedDate(new Date(date).toLocaleString());
  }, [date]);

  // Render a placeholder on the server and during initial client render.
  if (!formattedDate) {
    return null;
  }

  return <>{formattedDate}</>;
}


export default function PaymentsPageClient({
  initialPayments,
  plans,
}: {
  initialPayments: Payment[];
  plans: Plan[];
}) {
  const { toast } = useToast();
  const [payments, setPayments] = useState(initialPayments);

  // State for Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  // Server Action states
  const [createState, createFormAction] = useActionState(
    createManualPaymentAction,
    { success: false, message: '' }
  );

  const createFormRef = useRef<HTMLFormElement>(null);

  const fetchPayments = async () => {
    const updatedPayments = await getPayments();
    setPayments(updatedPayments);
  };

  // Effect to handle feedback from server actions
  useEffect(() => {
    if (createState.message) {
      if (createState.success) {
        toast({ title: 'Success', description: createState.message });
        setIsCreateDialogOpen(false);
        fetchPayments();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: createState.message,
        });
      }
    }
  }, [createState, toast]);

  const handleIssueRefund = async (id: number) => {
    const { success, message } = await issueRefundAction(id);
    if (success) {
      toast({ title: 'Success', description: message });
      fetchPayments();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: message });
    }
  };

  const handleDelete = async () => {
    if (!paymentToDelete) return;

    const { success, message } = await deletePaymentAction(paymentToDelete.id);
    if (success) {
      toast({ title: 'Success', description: message });
      fetchPayments();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: message });
    }
    setPaymentToDelete(null);
  };

  const getStatusVariant = (status: Payment['status']) => {
    switch (status) {
      case 'Completed':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Refunded':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-headline tracking-tight">
              Payment History
            </h1>
            <p className="text-muted-foreground">
              Review all transactions and manage payments.
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Manual Payment
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              A log of all payments made through the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>User (MAC)</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono">{payment.transaction_id}</TableCell>
                    <TableCell className="font-mono">{payment.mac_address}</TableCell>
                    <TableCell>
                      {payment.currency} {payment.amount}
                    </TableCell>
                    <TableCell>{payment.plan_name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.payment_method === 'Manual'
                            ? 'secondary'
                            : 'default'
                        }
                      >
                        {payment.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ClientFormattedDate date={payment.created_at} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onSelect={() => handleIssueRefund(payment.id)}
                            disabled={payment.status === 'Refunded'}
                          >
                            <Undo2 className="mr-2 h-4 w-4" />
                            Issue Refund
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => setPaymentToDelete(payment)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Transaction
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Manual Payment Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) createFormRef.current?.reset();
          setIsCreateDialogOpen(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Manual Payment</DialogTitle>
            <DialogDescription>
              Enter the details for the manual payment.
            </DialogDescription>
          </DialogHeader>
          <form
            ref={createFormRef}
            action={createFormAction}
            className="grid gap-4 py-4"
          >
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mac_address" className="text-right">
                MAC Address
              </Label>
              <Input
                id="mac_address"
                name="mac_address"
                className="col-span-3"
                placeholder="e.g., 00:1A:2B:3C:4D:5E"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan_name" className="text-right">
                Plan
              </Label>
              <Select name="plan_name" required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.filter(p => p.status === 'Active').map(plan => (
                    <SelectItem key={plan.id} value={plan.name}>
                      {plan.name} ({plan.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                className="col-span-3"
                placeholder="e.g., 50"
                required
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton>Add Payment</SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!paymentToDelete} onOpenChange={(isOpen) => !isOpen && setPaymentToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the payment
                      record for transaction ID <span className="font-mono font-bold">{paymentToDelete?.transaction_id}</span>.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                      Yes, delete payment
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
