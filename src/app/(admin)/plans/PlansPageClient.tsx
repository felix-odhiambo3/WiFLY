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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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
import { Plan } from '@/lib/db';
import {
  createPlanAction,
  deletePlanAction,
  getPlans,
  updatePlanAction,
} from './actions';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

const newPlanDefaultState: Omit<Plan, 'id' | 'status'> = {
  name: '',
  price: '',
  duration: '',
  speedLimit: '',
};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : children}
    </Button>
  );
}

export default function PlansPageClient({
  initialPlans,
}: {
  initialPlans: Plan[];
}) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>(initialPlans);

  // State for Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Server Action states
  const [createState, createFormAction] = useActionState(createPlanAction, {
    success: false,
    message: '',
  });
  const [updateState, updateFormAction] = useActionState(updatePlanAction, {
    success: false,
    message: '',
  });

  const createFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  const fetchPlans = async () => {
    const updatedPlans = await getPlans();
    setPlans(updatedPlans);
  };

  // Effect to handle feedback from server actions
  useEffect(() => {
    if (createState.message) {
      if (createState.success) {
        toast({ title: 'Success', description: createState.message });
        setIsCreateDialogOpen(false);
        fetchPlans();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: createState.message,
        });
      }
    }
  }, [createState, toast]);

  useEffect(() => {
    if (updateState.message) {
      if (updateState.success) {
        toast({ title: 'Success', description: updateState.message });
        setIsEditDialogOpen(false);
        setEditingPlan(null);
        fetchPlans();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: updateState.message,
        });
      }
    }
  }, [updateState, toast]);

  const handleDeletePlan = async (planId: string) => {
    const { success, message } = await deletePlanAction(planId);
    if (success) {
      toast({
        title: 'Plan Deleted',
        description: message,
      });
      fetchPlans();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    }
  };

  const handleEditPlanClick = (plan: Plan) => {
    setEditingPlan({ ...plan });
    setIsEditDialogOpen(true);
  };
  
    const handleCloseCreateDialog = () => {
        setIsCreateDialogOpen(false);
        createFormRef.current?.reset();
    };

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-headline tracking-tight">
              Plan Management
            </h1>
            <p className="text-muted-foreground">
              Create, edit, and manage internet access plans.
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Plan
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Internet Plans</CardTitle>
            <CardDescription>
              A list of all available internet access plans for users and
              vouchers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Speed Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-semibold">{plan.name}</TableCell>
                    <TableCell>{plan.price}</TableCell>
                    <TableCell>{plan.duration}</TableCell>
                    <TableCell>{plan.speedLimit}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          plan.status === 'Active' ? 'default' : 'secondary'
                        }
                      >
                        {plan.status}
                      </Badge>
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
                            onSelect={() => handleEditPlanClick(plan)}
                          >
                            Edit Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => handleDeletePlan(plan.id)}
                          >
                            Delete Plan
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

      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription>
              Fill in the details for the new internet plan.
            </DialogDescription>
          </DialogHeader>
          <form
            ref={createFormRef}
            action={createFormAction}
            className="grid gap-4 py-4"
          >
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Plan Name
              </Label>
              <Input
                id="name"
                name="name"
                className="col-span-3"
                placeholder="e.g., 24 Hour Access"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                name="price"
                className="col-span-3"
                placeholder="e.g., Ksh 500"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration
              </Label>
              <Input
                id="duration"
                name="duration"
                className="col-span-3"
                placeholder="e.g., 1440 minutes"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="speedLimit" className="text-right">
                Speed Limit
              </Label>
              <Input
                id="speedLimit"
                name="speedLimit"
                className="col-span-3"
                placeholder="e.g., 10 Mbps"
                required
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={handleCloseCreateDialog}
              >
                Cancel
              </Button>
              <SubmitButton>Create Plan</SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Make changes to the plan details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form ref={editFormRef} action={updateFormAction}>
            {editingPlan && (
              <div className="grid gap-4 py-4">
                <input type="hidden" name="id" value={editingPlan.id} />
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Plan Name
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingPlan.name}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-price" className="text-right">
                    Price
                  </Label>
                  <Input
                    id="edit-price"
                    name="price"
                    defaultValue={editingPlan.price}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-duration" className="text-right">
                    Duration
                  </Label>
                  <Input
                    id="edit-duration"
                    name="duration"
                    defaultValue={editingPlan.duration}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-speedLimit" className="text-right">
                    Speed Limit
                  </Label>
                  <Input
                    id="edit-speedLimit"
                    name="speedLimit"
                    defaultValue={editingPlan.speedLimit}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton>Save Changes</SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
