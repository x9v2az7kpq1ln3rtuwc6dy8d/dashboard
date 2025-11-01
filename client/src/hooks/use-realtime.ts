import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";

type RealtimeEventHandler = (type: string, data: any) => void;

export function useRealtime(eventHandler?: RealtimeEventHandler) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/realtime-ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        
        // Handle different event types
        switch (type) {
          case "chat_message":
            queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
            break;
          
          case "file_uploaded":
          case "file_deleted":
            queryClient.invalidateQueries({ queryKey: ["/api/files"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/files"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            break;
          
          case "user_updated":
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            break;
        }

        // Call custom event handler if provided
        if (eventHandler) {
          eventHandler(type, data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [eventHandler]);

  return wsRef;
}
