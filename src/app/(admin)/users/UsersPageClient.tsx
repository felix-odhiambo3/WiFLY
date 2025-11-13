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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plan, UserSession } from '@/lib/db';
import {
  addUserAction,
  extendUserSessionAction,
  getUserSessions,
  revokeUserAccessAction,
  updateUserPlanAction,
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

export default function UsersPageClient({
  initialUsers,
  plans,
}: {
  initialUsers: UserSession[];
  plans: Plan[];
}) {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);

  // Dialog states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [isExtendSessionOpen, setIsExtendSessionOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSession | null>(null);

  // Form states and actions
  const [addState, addFormAction] = useActionState(addUserAction, {
    success: false,
    message: '',
  });

  const addFormRef = useRef<HTMLFormElement>(null);
  const changePlanFormRef = useRef<HTMLFormElement>(null);
  const extendSessionFormRef = useRef<HTMLFormElement>(null);

  const fetchUsers = async () => {
    const updatedUsers = await getUserSessions();
    setUsers(updatedUsers);
  };

  useEffect(() => {
    if (addState.message) {
      if (addState.success) {
        toast({ title: 'Success', description: addState.message });
        setIsAddUserOpen(false);
        fetchUsers();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: addState.message,
        });
      }
    }
  }, [addState, toast]);

  const handleAction = async (
    action: Promise<{ success: boolean; message: string }>
  ) => {
    const { success, message } = await action;
    if (success) {
      toast({ title: 'Success', description: message });
      fetchUsers();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: message });
    }
    // Close all dialogs
    setIsChangePlanOpen(false);
    setIsExtendSessionOpen(false);
    setSelectedUser(null);
  };

  const handleRevokeAccess = (id: number) => {
    handleAction(revokeUserAccessAction(id));
  };
  
  const handleChangePlan = (formData: FormData) => {
    if (!selectedUser) return;
    const planName = formData.get('plan') as string;
    const selectedPlan = plans.find(p => p.name === planName);
    const durationString = selectedPlan?.duration.split(' ')[0] ?? '0';
    const duration = parseInt(durationString, 10);
    
    handleAction(updateUserPlanAction(selectedUser.id, planName, duration));
  };

  const handleExtendSession = (formData: FormData) => {
    if (!selectedUser) return;
    const minutes = parseInt(formData.get('minutes') as string, 10);
    handleAction(extendUserSessionAction(selectedUser.id, minutes));
  };

  const getStatusVariant = (status: UserSession['status']) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Expired':
        return 'secondary';
      case 'Blocked':
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
              User Management
            </h1>
            <p className="text-muted-foreground">
              View, edit, and manage all user sessions.
            </p>
          </div>
          <Button onClick={() => setIsAddUserOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active & Recent Users</CardTitle>
            <CardDescription>
              A list of all users who have connected to the hotspot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MAC Address</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Expiry Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono">{user.mac}</TableCell>
                    <TableCell>{user.plan}</TableCell>
                    <TableCell><ClientFormattedDate date={user.startTime} /></TableCell>
                    <TableCell><ClientFormattedDate date={user.expiryTime} /></TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(user.status)}>
                        {user.status}
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
                            onSelect={() => {
                              setSelectedUser(user);
                              setIsExtendSessionOpen(true);
                            }}
                          >
                            Extend Session
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setSelectedUser(user);
                              setIsChangePlanOpen(true);
                            }}
                          >
                            Change Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => handleRevokeAccess(user.id)}
                          >
                            Revoke Access
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

      {/* Add User Dialog */}
      <Dialog
        open={isAddUserOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) addFormRef.current?.reset();
          setIsAddUserOpen(isOpen);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user session manually.
            </DialogDescription>
          </DialogHeader>
          <form ref={addFormRef} action={addFormAction} className="space-y-4">
            <div>
              <Label htmlFor="mac">MAC Address</Label>
              <Input
                id="mac"
                name="mac"
                placeholder="00:1A:2B:3C:4D:5E"
                required
              />
            </div>
            <div>
              <Label htmlFor="plan">Plan</Label>
              <Select name="plan" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans
                    .filter((p) => p.status === 'Active')
                    .map((plan) => (
                      <SelectItem key={plan.id} value={plan.name}>
                        {plan.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                placeholder="e.g., 60"
                required
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsAddUserOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton>Add User</SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
       {/* Change Plan Dialog */}
      <Dialog open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Plan for {selectedUser?.mac}</DialogTitle>
            <DialogDescription>Select a new plan for the user. The session will be reset.</DialogDescription>
          </DialogHeader>
          <form ref={changePlanFormRef} action={handleChangePlan} className="space-y-4">
             <div>
              <Label htmlFor="plan-change">New Plan</Label>
              <Select name="plan" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a new plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.filter(p => p.status === 'Active').map(plan => (
                    <SelectItem key={plan.id} value={plan.name}>
                      {plan.name} ({plan.duration})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
               <Button variant="outline" type="button" onClick={() => setIsChangePlanOpen(false)}>Cancel</Button>
               <SubmitButton>Change Plan</SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Extend Session Dialog */}
      <Dialog open={isExtendSessionOpen} onOpenChange={setIsExtendSessionOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Extend Session for {selectedUser?.mac}</DialogTitle>
                <DialogDescription>Add more time to the user's current session.</DialogDescription>
            </DialogHeader>
            <form ref={extendSessionFormRef} action={handleExtendSession} className="space-y-4">
                <div>
                    <Label htmlFor="minutes">Minutes to Add</Label>
                    <Input id="minutes" name="minutes" type="number" placeholder="e.g., 60" required />
                </div>
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsExtendSessionOpen(false)}>Cancel</Button>
                    <SubmitButton>Extend</SubmitButton>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

    </>
  );
}
