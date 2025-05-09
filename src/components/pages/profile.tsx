
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <Card className="max-w-md mx-auto">
        <CardHeader className="flex flex-col items-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src="" alt="Profile" />
            <AvatarFallback className="text-2xl">JD</AvatarFallback>
          </Avatar>
          <CardTitle className="mt-4">John Doe</CardTitle>
          <CardDescription>Joined April 2023</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-muted-foreground">Email</span>
            <span>john.doe@example.com</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-muted-foreground">Favorite Streams</span>
            <span>3</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-muted-foreground">Watch Time</span>
            <span>47 hours</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Edit Profile</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
