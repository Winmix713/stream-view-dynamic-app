
import { useOnlineStatus } from "@/hooks/use-online-status";

export function StatusBar() {
  const isOnline = useOnlineStatus();
  
  return (
    <div className={`w-full h-1 ${isOnline ? "bg-stream-online" : "bg-stream-offline"}`} />
  );
}
