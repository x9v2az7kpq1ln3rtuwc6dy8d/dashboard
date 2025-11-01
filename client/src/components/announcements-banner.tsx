import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Announcement } from "@shared/schema";

export function AnnouncementsBanner() {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const activeAnnouncements = announcements.filter(
    (a) => a.isActive && !dismissedIds.includes(a.id)
  );

  if (activeAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {activeAnnouncements.map((announcement) => (
        <Alert key={announcement.id} data-testid={`announcement-${announcement.id}`}>
          <Megaphone className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between gap-4">
            {announcement.title}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-2"
              onClick={() => setDismissedIds([...dismissedIds, announcement.id])}
              data-testid={`button-dismiss-${announcement.id}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">
            {announcement.content}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
