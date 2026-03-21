import React from 'react';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export default function CastRow({ cast }: { cast: CastMember[] }) {
  if (!cast || cast.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Cast</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {cast.slice(0, 15).map((actor) => (
          <div
            key={actor.id}
            className="flex-shrink-0 w-28 group cursor-default"
          >
            {/* Photo */}
            <div className="w-28 h-28 rounded-full overflow-hidden bg-muted mb-2 ring-2 ring-border group-hover:ring-primary transition-all duration-200">
              {actor.profile_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                  alt={actor.name}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-3xl text-muted-foreground select-none">
                    {actor.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Text */}
            <div className="text-center space-y-0.5">
              <p className="text-sm font-semibold leading-tight line-clamp-2">{actor.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{actor.character}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
