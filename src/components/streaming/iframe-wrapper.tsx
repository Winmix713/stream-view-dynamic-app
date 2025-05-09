
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff } from "lucide-react";

interface IframeWrapperProps {
  id: string;
  src: string;
  title: string;
  isLoading: boolean;
  isOnline: boolean;
  onLoad: () => void;
}

export function IframeWrapper({ id, src, title, isLoading, isOnline, onLoad }: IframeWrapperProps) {
  if (!isOnline) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-lg">
        <Alert variant="destructive" className="w-auto">
          <WifiOff className="h-4 w-4 mr-2" />
          <AlertDescription>
            No internet connection. Unable to load stream.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
          <Spinner size="lg" />
        </div>
      )}
      <iframe
        id={id}
        src={src}
        title={title}
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts allow-forms"
        onLoad={onLoad}
      />
    </>
  );
}
