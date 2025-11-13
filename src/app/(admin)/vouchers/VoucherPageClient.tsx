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
import { MoreHorizontal, PlusCircle, Trash2, Edit, UserPlus, Undo2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActionState } from 'react';
import { deleteVoucherAction, generateVouchersAction, getVouchers } from './actions';
import { Voucher } from '@/lib/db';
import { useFormStatus } from 'react-dom';


function GenerateVouchersButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Generating...' : 'Generate'}
    </Button>
  );
}

export default function VouchersPageClient({ initialVouchers }: { initialVouchers: Voucher[] }) {
  const { toast } = useToast();
  const [vouchers, setVouchers] = React.useState(initialVouchers);

  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = React.useState(false);

  const [generateState, generateFormAction] = useActionState(generateVouchersAction, { success: false, message: '' });

  const generateFormRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    async function fetchVouchers() {
        const updatedVouchers = await getVouchers();
        setVouchers(updatedVouchers);
    }
    if (generateState.success) {
      fetchVouchers();
    }
  }, [generateState]);


  React.useEffect(() => {
    if (generateState.message) {
      if (generateState.success) {
        toast({
          title: 'Vouchers Generated',
          description: `${generateState.count} new vouchers have been created.`,
        });
        setIsGenerateDialogOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: generateState.message,
        });
      }
    }
  }, [generateState, toast]);

  const handleDelete = async (id: number) => {
    const { success, message } = await deleteVoucherAction(id);
    if (success) {
      setVouchers(vouchers.filter(v => v.id !== id));
      toast({
        title: 'Voucher Deleted',
        description: message,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    }
  };


  const getStatus = (voucher: Voucher) => {
    if (voucher.is_used) return 'Used';
    // Add logic for 'Expired' and 'Refunded' if those fields exist
    return 'Unused';
  }

  const getStatusVariant = (status: string) => {
    switch(status) {
      case 'Used': return 'secondary';
      case 'Expired': return 'destructive';
      case 'Refunded': return 'outline';
      default: return 'default';
    }
  }


  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-headline tracking-tight">
              Voucher Management
            </h1>
            <p className="text-muted-foreground">
              Create, view, and manage access vouchers.
            </p>
          </div>
          <Button onClick={() => setIsGenerateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Generate Vouchers
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Vouchers</CardTitle>
            <CardDescription>A list of all generated vouchers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher Code</TableHead>
                  <TableHead>Plan/Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-semibold font-mono">
                      {voucher.code}
                    </TableCell>
                    <TableCell>{voucher.duration_minutes} minutes</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(getStatus(voucher))}
                      >
                        {getStatus(voucher)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {voucher.used_by_mac || 'N/A'}
                    </TableCell>
                    <TableCell>{new Date(voucher.created_at).toLocaleDateString()}</TableCell>
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
                          <DropdownMenuItem disabled>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Voucher
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Assign to User
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            <Undo2 className="mr-2 h-4 w-4" />
                            Mark as Refunded
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onSelect={() => handleDelete(voucher.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Voucher
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

      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate Vouchers</DialogTitle>
            <DialogDescription>
              Create a batch of new vouchers for a specific plan.
            </DialogDescription>
          </DialogHeader>
          <form
            ref={generateFormRef}
            action={generateFormAction}
            className="grid gap-4 py-4"
          >
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                defaultValue={10}
                className="col-span-3"
                min="1"
                max="100"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan-select" className="text-right">
                Plan
              </Label>
              <Select
                name="plan"
                defaultValue="60"
                required
              >
                <SelectTrigger id="plan-select" className="col-span-3">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="720">12 hours</SelectItem>
                  <SelectItem value="1440">24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsGenerateDialogOpen(false)}>Cancel</Button>
                <GenerateVouchersButton />
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
