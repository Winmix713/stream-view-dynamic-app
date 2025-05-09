
import { useState, useCallback } from "react";

export interface IframeData {
  id: string;
  title: string;
  src: string;
  viewers?: string;
}

export interface IframesMap {
  [key: string]: IframeData;
}

export const useStreamingData = () => {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("scheduler");

  // Iframes configuration
  const iframes: IframesMap = {
    scheduler: {
      id: "retail_scheduler",
      title: "Scheduler Stream",
      src: "https://placehold.co/1280x720?text=Scheduler+Stream",
      viewers: "2.5K",
    },
    winmix: {
      id: "winmix-iframe",
      title: "Winmix Stream",
      src: "https://placehold.co/1280x720?text=Winmix+Stream",
      viewers: "1.8K",
    },
    tippmix: {
      id: "tippmix-iframe",
      title: "Tippmix V-Sport",
      src: "https://placehold.co/1280x720?text=Tippmix+Stream",
      viewers: "3.2K",
    },
    sportradar: {
      id: "sportradar-iframe",
      title: "Sportradar Archive",
      src: "https://placehold.co/1280x720?text=Sportradar+Stream",
      viewers: "1.4K",
    },
  };

  const handleReloadIframe = useCallback(
    (iframeId: string, isOnline: boolean) => {
      if (!isOnline) return;
      setIsLoading((prev) => ({ ...prev, [iframeId]: true }));
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
      if (iframe) {
        const currentSrc = iframe.src;
        iframe.src = "about:blank";
        setTimeout(() => {
          iframe.src = currentSrc;
        }, 100);
      }
    },
    []
  );

  const handleIframeLoad = useCallback((iframeId: string) => {
    setIsLoading((prev) => ({ ...prev, [iframeId]: false }));
  }, []);

  return {
    iframes,
    isLoading,
    activeTab,
    setActiveTab,
    handleReloadIframe,
    handleIframeLoad,
  };
};
