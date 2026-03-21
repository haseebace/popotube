import React from 'react';
import WatchClient from '@/components/public/WatchClient';
import CastRow from '@/components/public/CastRow';
import MovieCard from '@/components/public/MovieCard';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, Clock, CalendarDays } from 'lucide-react';

async function getMovieDetails(id: string) {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
    if (!TMDB_API_KEY) return null;
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/movie/${id}?append_to_response=credits,videos,similar&language=en-US&api_key=${TMDB_API_KEY}`,
            { next: { revalidate: 3600 } }
        );
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

function formatRuntime(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
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

    const backdropUrl = movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : '';
    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : '';

    const cast = movie.credits?.cast ?? [];
    const similarMovies: any[] = movie.similar?.results ?? [];

    return (
        <div className="w-full flex flex-col relative min-h-screen">

            {/* ── Cinematic backdrop ── */}
            <div className="absolute top-0 left-0 w-full h-[55vh] -z-10 bg-muted">
                {backdropUrl && (
                    <>
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${backdropUrl})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                    </>
                )}
            </div>

            <div className="container mx-auto px-4 pt-12 md:pt-24 pb-24 space-y-12 flex-1 flex flex-col">

                {/* ── Player ── */}
                <div className="w-full max-w-5xl mx-auto z-10">
                    <WatchClient tmdbId={tmdb_id} movieDetails={movie} />
                </div>

                {/* ── Movie Info ── */}
                <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8">

                    {/* Poster */}
                    {posterUrl && (
                        <div className="w-44 flex-shrink-0 hidden md:block rounded-xl overflow-hidden shadow-xl aspect-[2/3] bg-muted">
                            <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="space-y-5 flex-1 min-w-0">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight">{movie.title}</h1>
                            {movie.tagline && (
                                <p className="text-muted-foreground mt-1 italic text-lg">{movie.tagline}</p>
                            )}
                        </div>

                        {/* Stats row */}
                        <div className="flex flex-wrap items-center gap-3">
                            {movie.vote_average > 0 && (
                                <div className="flex items-center gap-1 text-sm font-semibold text-yellow-500">
                                    <Star className="w-4 h-4 fill-yellow-500" />
                                    {movie.vote_average.toFixed(1)}
                                    <span className="text-muted-foreground font-normal text-xs">/ 10</span>
                                </div>
                            )}
                            {movie.runtime > 0 && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    {formatRuntime(movie.runtime)}
                                </div>
                            )}
                            {movie.release_date && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <CalendarDays className="w-4 h-4" />
                                    {new Date(movie.release_date).getFullYear()}
                                </div>
                            )}
                        </div>

                        {/* Genre badges */}
                        {movie.genres && movie.genres.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {movie.genres.map((g: any) => (
                                    <Badge key={g.id} variant="secondary">{g.name}</Badge>
                                ))}
                            </div>
                        )}

                        {/* Overview */}
                        {movie.overview && (
                            <p className="text-base leading-relaxed text-muted-foreground max-w-2xl">
                                {movie.overview}
                            </p>
                        )}

                        {/* Director */}
                        {(() => {
                            const director = movie.credits?.crew?.find((c: any) => c.job === 'Director');
                            return director ? (
                                <p className="text-sm text-muted-foreground">
                                    <span className="text-foreground font-medium">Director: </span>
                                    {director.name}
                                </p>
                            ) : null;
                        })()}
                    </div>
                </div>

                {/* ── Cast ── */}
                {cast.length > 0 && (
                    <div className="w-full max-w-5xl mx-auto space-y-6">
                        <Separator />
                        <CastRow cast={cast} />
                    </div>
                )}

                {/* ── More Like This ── */}
                {similarMovies.length > 0 && (
                    <div className="w-full max-w-5xl mx-auto space-y-6">
                        <Separator />
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold">More Like This</h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1">
                                {similarMovies.slice(0, 12).map((film: any) => (
                                    <MovieCard
                                        key={film.id}
                                        id={film.id}
                                        title={film.title}
                                        posterPath={film.poster_path}
                                        releaseDate={film.release_date}
                                        voteAverage={film.vote_average}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
