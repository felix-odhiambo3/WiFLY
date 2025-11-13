'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import Logo from '../common/Logo';
import {
  LayoutDashboard,
  Users,
  Wallet,
  ScrollText,
  Ticket,
  BookText,
  Settings,
  Sun,
  Moon,
  BarChart,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/payments', label: 'Payments', icon: Wallet },
  { href: '/plans', label: 'Plans', icon: ScrollText },
  { href: '/vouchers', label: 'Vouchers', icon: Ticket },
  { href: '/monitoring', label: 'Monitoring', icon: BarChart },
  { href: '/logs', label: 'Logs', icon: BookText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <Skeleton className="h-9 w-full" />;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant={theme === 'light' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTheme('light')}
      >
        <Sun className="h-4 w-4 mr-2" />
        Light
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTheme('dark')}
      >
        <Moon className="h-4 w-4 mr-2" />
        Dark
      </Button>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map(({ href, label, icon: Icon }) => (
            <SidebarMenuItem key={href}>
              <Link href={href}>
                <SidebarMenuButton
                  as="a"
                  isActive={isActive(href)}
                  tooltip={label}
                  className="justify-start"
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
