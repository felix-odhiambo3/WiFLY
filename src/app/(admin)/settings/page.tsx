'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Note: Metadata export is removed as this is now a client component.
// You can manage metadata using the `metadata` object in a parent layout or page if needed.

export default function SettingsPage() {
  const { toast } = useToast();

  const handleSave = (settingName: string) => {
    toast({
      title: 'Settings Saved',
      description: `${settingName} have been successfully updated.`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          System Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your Wi-Fi hotspot's configuration.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic information about your hotspot service.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hotspot-name">Hotspot Name</Label>
                <Input
                  id="hotspot-name"
                  defaultValue="WiFly Hotspot"
                  placeholder="e.g., My Cafe Wi-Fi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  defaultValue="admin@wifly.com"
                  placeholder="Your contact email for alerts"
                />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={() => handleSave('General Settings')}>
                <Save className="mr-2 h-4 w-4" /> Save General Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>API &amp; Service Integrations</CardTitle>
              <CardDescription>
                Connect to third-party services like your payment gateway and
                RADIUS server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <h3 className="font-medium">IntaSend Payment Gateway</h3>
                    <div className="space-y-2">
                        <Label htmlFor="intasend-key">IntaSend API Key</Label>
                        <Input
                        id="intasend-key"
                        type="password"
                        placeholder="**********"
                        />
                    </div>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-medium">FreeRADIUS Server</h3>
                    <div className="space-y-2">
                        <Label htmlFor="radius-ip">Server IP Address</Label>
                        <Input
                        id="radius-ip"
                        defaultValue="192.168.1.100"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="radius-secret">Shared Secret</Label>
                        <Input
                        id="radius-secret"
                        type="password"
                        placeholder="**********"
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={() => handleSave('Integration Settings')}>
                <Save className="mr-2 h-4 w-4" /> Save Integration Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
            <Card>
                <CardHeader>
                    <CardTitle>Appearance & Theme</CardTitle>
                    <CardDescription>Customize the look and feel of the captive portal and admin dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Theme settings (Light/Dark mode) are available in the sidebar footer.</p>
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
