'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CircleUser, LogOut, Settings, LifeBuoy } from 'lucide-react';
import { SidebarTrigger } from '../ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import Logo from '../common/Logo';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function AdminHeader() {
    const isMobile = useIsMobile();
    const { toast } = useToast();
    const router = useRouter();

    const handleLogout = () => {
        toast({
            title: "Logged Out",
            description: "You have been successfully logged out."
        });
        router.push('/');
    };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {isMobile && (
          <>
            <SidebarTrigger />
            <div className="md:hidden">
                <Logo />
            </div>
          </>
      )}
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Can add search here if needed */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <CircleUser className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="mailto:odhiambo3felix@gmail.com">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Support
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
