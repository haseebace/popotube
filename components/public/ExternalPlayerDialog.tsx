"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ExternalLink, PlayCircle } from "lucide-react";

interface ExternalPlayerDialogProps {
  children: React.ReactNode;
  url: string;
  filename?: string;
  playerName: "VLC" | "IINA";
  onLaunch?: () => Promise<void> | void;
}

export function ExternalPlayerDialog({ 
  children, 
  url, 
  filename, 
  playerName,
  onLaunch
}: ExternalPlayerDialogProps) {
  const protocol = playerName === "IINA" ? `iina://weblink?url=` : `vlc://`;
  const finalUrl = `${protocol}${encodeURIComponent(url)}`;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[400px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${playerName === 'VLC' ? 'bg-orange-500/10 text-orange-500' : 'bg-zinc-500/10 text-zinc-400'}`}>
              <PlayCircle className="size-5" />
            </div>
            <AlertDialogTitle>Open in {playerName}?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm leading-relaxed">
            {filename ? (
              <>
                You're about to stream <span className="font-semibold text-foreground">{filename}</span> in {playerName}. This will launch the external application on your device.
              </>
            ) : (
              `This action will launch the ${playerName} media player on your device to stream the content.`
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel className="border-none hover:bg-muted">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            className={`${playerName === 'VLC' ? 'bg-[#FF8800] hover:bg-[#FF8800]/90' : 'bg-primary hover:bg-primary/90'} text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]`}
            onClick={async () => {
              if (onLaunch) {
                await onLaunch();
              } else {
                window.location.assign(finalUrl);
              }
            }}
          >
            Launch {playerName}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
