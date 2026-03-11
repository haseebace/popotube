import React from 'react';
import WatchClient from '@/components/public/WatchClient';

async function getMovieDetails(id: string) {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
    
    // We do the fetch server-side directly to TMDb since this is the page component
    if (!TMDB_API_KEY) return null;

    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/${id}?append_to_response=credits,videos&language=en-US&api_key=${TMDB_API_KEY}`, 
            { next: { revalidate: 3600 } }
        );
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        return null; // Handle smoothly in UI
    }
}

export default async function WatchPage({ params }: { params: Promise<{ tmdb_id: string }> }) {
    const { tmdb_id } = await params;
    const movie = await getMovieDetails(tmdb_id);

    if (!movie) {
        return (
            <div className="w-full h-full flex items-center justify-center p-12">
                <h1 className="text-2xl font-bold">Movie not found</h1>
            </div>
        );
    }

    const backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : '';
    const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '';

    return (
        <div className="w-full flex flex-col relative min-h-screen">
             {/* Header Cinematic Background */}
             <div className="absolute top-0 left-0 w-full h-[50vh] -z-10 bg-muted">
                 {backdropUrl && (
                     <>
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backdropUrl})` }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                     </>
                 )}
             </div>

             <div className="container mx-auto px-4 pt-12 md:pt-24 space-y-8 flex-1 flex flex-col pb-16">
                  {/* Player area */}
                  <div className="w-full max-w-5xl mx-auto z-10 transition-transform zoom-in duration-500">
                       <WatchClient tmdbId={tmdb_id} movieDetails={movie} />
                  </div>

                  {/* Movie Info Area */}
                  <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
                       {/* Left Poster block */}
                       {posterUrl && (
                           <div className="w-48 flex-shrink-0 hidden md:block rounded-xl overflow-hidden shadow-lg aspect-[2/3] bg-muted">
                               <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                           </div>
                       )}

                       {/* Right Metadata block */}
                       <div className="space-y-4 flex-1">
                            <h1 className="text-4xl font-bold">{movie.title}</h1>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                 {movie.release_date && <span>{new Date(movie.release_date).getFullYear()}</span>}
                                 {movie.runtime > 0 && <span>{movie.runtime} min</span>}
                                 {movie.vote_average > 0 && <span>★ {movie.vote_average.toFixed(1)}</span>}
                                 {movie.genres && (
                                     <span>{movie.genres.map((g: any) => g.name).join(', ')}</span>
                                 )}
                            </div>

                            <p className="text-lg leading-relaxed text-muted-foreground">
                                {movie.overview}
                            </p>

                            {/* Cast Sample */}
                            {movie.credits && movie.credits.cast && movie.credits.cast.length > 0 && (
                                 <div className="space-y-2 pt-4 border-t border-border">
                                      <h3 className="font-semibold text-lg">Starring</h3>
                                      <div className="flex flex-wrap gap-2">
                                          {movie.credits.cast.slice(0, 5).map((actor: any) => (
                                              <span key={actor.id} className="text-sm bg-muted px-2 py-1 rounded-md text-muted-foreground">
                                                  {actor.name}
                                              </span>
                                          ))}
                                      </div>
                                 </div>
                            )}
                       </div>
                  </div>
             </div>
        </div>
    );
}
