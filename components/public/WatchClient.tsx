"use client";

import React, { useEffect, useState } from 'react';
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function WatchClient({ tmdbId, movieDetails }: { tmdbId: string, movieDetails: any }) {
    const [status, setStatus] = useState<any>(null); // video status in our db
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('Checking availability...');

    useEffect(() => {
        let pollInterval: NodeJS.Timeout;

        async function checkStatus() {
            try {
                const checkRes = await fetch(`/api/public/movie-status?tmdb_id=${tmdbId}`);
                if (!checkRes.ok) throw new Error('Failed to check status');
                const checkData = await checkRes.json();

                if (!checkData.exists) {
                     // Cache Miss: Trigger Ingestion
                     setMessage('Movie not prepared. Triggering secure ingestion...');
                     const triggerRes = await fetch('/api/public/trigger-ingestion', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({
                             tmdb_id: tmdbId,
                             title: movieDetails.title,
                             year: movieDetails.release_date ? movieDetails.release_date.substring(0,4) : ''
                         })
                     });

                     if (!triggerRes.ok) {
                         const err = await triggerRes.json();
                         setMessage(`Failed to ingest: ${err.error}`);
                         return; // Stop polling
                     }

                     // Ingestion started, begin polling
                     setMessage('Setting up stream... (0%)');
                } else if (checkData.exists && checkData.video) {
                     // Record exists
                     const vid = checkData.video;
                     setStatus(vid);

                     if (vid.status === 'completed' && vid.stream_url) {
                        setLoading(false); // Stop polling and show player
                        clearInterval(pollInterval);
                     } else if (vid.status === 'failed') {
                        setMessage(`Ingestion failed: ${vid.error_message || 'Unknown error'}`);
                        clearInterval(pollInterval);
                     } else {
                        // Still processing
                        setMessage(`Processing: ${vid.status.replace(/_/g, ' ')}... (${vid.progress || 0}%)`);
                     }
                }
            } catch (error) {
                console.error('Error during watch intercept:', error);
                setMessage('An error occurred during status check.');
            }
        }

        // Run instantly
        checkStatus();

        // Then poll every 5 seconds if still loading
        if (loading) {
             pollInterval = setInterval(checkStatus, 5000);
        }

        return () => clearInterval(pollInterval);
    }, [tmdbId, loading, movieDetails]);


    if (!loading && status?.stream_url) {
         return (
             <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl relative">
                 <iframe 
                      src={status.stream_url}
                      className="absolute top-0 left-0 w-full h-full border-0"
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" 
                      allowFullScreen
                 />
             </div>
         )
    }

    return (
         <div className="w-full aspect-video bg-muted rounded-lg flex flex-col items-center justify-center p-8 text-center space-y-6">
             <div className="space-y-2">
                 <h2 className="text-2xl font-semibold">Preparing your stream</h2>
                 <p className="text-muted-foreground">{message}</p>
             </div>
             <div className="w-full max-w-md">
                 <Progress value={status?.progress || 0} className="w-full" />
             </div>
         </div>
    );
}
