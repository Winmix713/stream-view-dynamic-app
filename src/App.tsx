
import { useState, useCallback, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { X, Star, StarOff, RefreshCw, Maximize2, Users, Signal, Clock } from "lucide-react";
import { StatusBar } from "@/components/streaming/status-bar";
import { IframeWrapper } from "@/components/streaming/iframe-wrapper";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { BottomNavigation } from "@/components/streaming/bottom-navigation";
import { ProfilePage } from "@/components/pages/profile";
import { SettingsPage } from "@/components/pages/settings";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { toast } from "sonner";
import { useStreamingData } from "@/hooks/use-streaming-data";

const queryClient = new QueryClient();

function StreamView() {
  const { iframes, isLoading, activeTab, setActiveTab, handleReloadIframe, handleIframeLoad } = useStreamingData();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenIframeId, setFullscreenIframeId] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState("streaming");
  const isOnline = useOnlineStatus();

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("stream-favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem("stream-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const handleReloadWrapper = useCallback(
    (iframeId: string) => {
      if (!isOnline) {
        toast.error("Cannot reload while offline");
        return;
      }
      handleReloadIframe(iframeId, isOnline);
      toast.success("Reloading stream...");
    },
    [isOnline, handleReloadIframe]
  );

  const toggleFullscreen = useCallback(
    (iframeId: string) => {
      if (isFullscreen && fullscreenIframeId === iframeId) {
        setIsFullscreen(false);
        setFullscreenIframeId(null);
      } else {
        setIsFullscreen(true);
        setFullscreenIframeId(iframeId);
      }
    },
    [isFullscreen, fullscreenIframeId]
  );

  const toggleFavorite = useCallback((tabKey: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(tabKey) 
        ? prev.filter((key) => key !== tabKey) 
        : [...prev, tabKey];
      
      toast.success(
        prev.includes(tabKey)
          ? `Removed ${iframes[tabKey].title} from favorites`
          : `Added ${iframes[tabKey].title} to favorites`
      );
      
      return newFavorites;
    });
  }, [iframes]);

  const renderRoute = () => {
    switch (currentRoute) {
      case "profile":
        return <ProfilePage />;
      case "settings":
        return <SettingsPage />;
      default:
        return (
          <main className="container mx-auto px-4 pb-20">
            <div className="flex justify-between items-center my-4">
              <h1 className="text-xl font-medium">Live Streams</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Favorites
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                >
                  Filters
                </Button>
              </div>
            </div>

            <Tabs 
              defaultValue={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 mb-4">
                {Object.entries(iframes).map(([key, { title }]) => (
                  <TabsTrigger key={key} value={key} className="text-xs sm:text-sm">
                    {title.split(' ')[0]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(iframes).map(([key, { id, title, src, viewers }]) => (
                <TabsContent key={key} value={key} className="mt-0">
                  <Card>
                    <CardHeader className="p-4 pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-stream-online animate-pulse" />
                          <h2 className="text-lg font-medium">{title}</h2>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleFavorite(key)}
                          >
                            {favorites.includes(key) ? (
                              <Star className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleReloadWrapper(id)}
                            disabled={!isOnline}
                          >
                            <RefreshCw
                              className={`h-4 w-4 ${isLoading[id] ? "animate-spin" : ""}`}
                            />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleFullscreen(id)}
                          >
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
                        <IframeWrapper
                          id={id}
                          src={src}
                          title={title}
                          isLoading={isLoading[id] || false}
                          isOnline={isOnline}
                          onLoad={() => handleIframeLoad(id)}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Users className="h-4 w-4" />
                          <span>{viewers} viewers</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Signal className="h-4 w-4" />
                            <span>HD</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <div className="h-2 w-2 rounded-full bg-stream-live animate-pulse" />
                            <Clock className="h-4 w-4" />
                            <span>Live</span>
                          </div>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="font-bold text-lg">StreamView</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              Language
            </Button>
            <Button variant="outline" size="sm">
              Login
            </Button>
          </div>
        </div>
      </header>

      {renderRoute()}

      <BottomNavigation 
        activeItem={currentRoute} 
        onItemSelect={setCurrentRoute}
      />
      
      {!isOnline && (
        <div className="fixed bottom-16 inset-x-0 bg-destructive text-destructive-foreground p-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <span>No internet connection. Content will not update.</span>
          </div>
        </div>
      )}

      {isFullscreen && fullscreenIframeId && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
          <div className="p-4 flex justify-between items-center">
            <h2 className="text-lg font-bold">
              {Object.values(iframes).find((iframe) => iframe.id === fullscreenIframeId)?.title}
            </h2>
            <Button size="icon" variant="ghost" onClick={() => setIsFullscreen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 p-4">
            {isOnline && fullscreenIframeId && (
              <div className="relative h-full">
                <iframe
                  src={
                    Object.values(iframes).find((iframe) => iframe.id === fullscreenIframeId)?.src
                  }
                  className="w-full h-full border-0 rounded-md"
                  title="Fullscreen content"
                  sandbox="allow-same-origin allow-scripts allow-forms"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<StreamView />} />
            <Route path="*" element={<StreamView />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner position="top-right" closeButton theme="light" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
