
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [lowDataMode, setLowDataMode] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  
  const handleSaveChanges = () => {
    toast.success("Settings saved successfully");
  };
  
  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your app preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive updates about streams
                  </div>
                </div>
                <Switch 
                  id="notifications" 
                  checked={notifications} 
                  onCheckedChange={setNotifications} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoplay">Autoplay Videos</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically play streams when page loads
                  </div>
                </div>
                <Switch 
                  id="autoplay" 
                  checked={autoplay} 
                  onCheckedChange={setAutoplay} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="lowDataMode">Low Data Mode</Label>
                  <div className="text-sm text-muted-foreground">
                    Reduce data usage and load lower quality streams
                  </div>
                </div>
                <Switch 
                  id="lowDataMode" 
                  checked={lowDataMode} 
                  onCheckedChange={setLowDataMode} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="darkMode">Dark Mode</Label>
                  <div className="text-sm text-muted-foreground">
                    Use dark theme throughout the app
                  </div>
                </div>
                <Switch 
                  id="darkMode" 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode} 
                />
              </div>
              
              <Button onClick={handleSaveChanges} className="w-full mt-6">
                Save Changes
              </Button>
            </TabsContent>
            
            <TabsContent value="account" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <input 
                  id="email" 
                  type="email" 
                  defaultValue="john.doe@example.com"
                  className="w-full p-2 rounded border border-input bg-background" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <input 
                  id="password" 
                  type="password" 
                  defaultValue="********"
                  className="w-full p-2 rounded border border-input bg-background" 
                />
              </div>
              
              <Button onClick={handleSaveChanges} className="w-full mt-6">
                Update Account
              </Button>
              
              <div className="pt-4 border-t mt-6">
                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
