
import { Home, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeItem: string;
  onItemSelect: (item: string) => void;
}

export function BottomNavigation({ activeItem, onItemSelect }: BottomNavigationProps) {
  const items = [
    { id: "streaming", label: "Home", icon: Home },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-10">
      <div className="container mx-auto flex justify-around items-center py-2">
        {items.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 flex flex-col items-center gap-1 h-auto py-2 px-1",
              activeItem === item.id && "text-primary border-t-2 border-primary rounded-none"
            )}
            onClick={() => onItemSelect(item.id)}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
