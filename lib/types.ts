export interface AuthResponse {
  AccessToken: string;
  User: {
    Id: string;
    Name: string;
  };
}

export interface AuthCredentials {
  host: string;
  token: string;
  userId: string;
}

export type MediaType = "Movie" | "Series";

export interface MediaItem {
  Id: string;
  Name: string;
  Type: MediaType;
  ProductionYear?: number;
  RunTimeTicks?: number;
  Size?: number;
  Overview?: string;
  Container?: string;
  Genres?: string[];
  OfficialRating?: string;
}

export interface SearchResponse {
  TotalRecordCount: number;
  Items: MediaItem[];
}

export interface Episode {
  Id: string;
  Name: string;
  ParentIndexNumber: number; // Season number
  IndexNumber: number; // Episode number
  Type: "Episode";
  RunTimeTicks?: number;
  Size?: number;
  Overview?: string;
  Container?: string;
}

export interface EpisodesResponse {
  TotalRecordCount: number;
  Items: Episode[];
}

export interface Season {
  number: number;
  episodes: Episode[];
}

export function formatDuration(runTimeTicks?: number): string {
  if (!runTimeTicks) return "";
  const minutes = Math.floor(runTimeTicks / 600000000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
}

export function formatSize(bytes?: number): string {
  if (!bytes) return "";
  const gb = bytes / 1073741824;
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  }
  const mb = bytes / 1048576;
  return `${mb.toFixed(0)} MB`;
}

export function groupEpisodesBySeason(episodes: Episode[]): Season[] {
  const seasonMap = new Map<number, Episode[]>();

  for (const episode of episodes) {
    const seasonNum = episode.ParentIndexNumber;
    if (!seasonMap.has(seasonNum)) {
      seasonMap.set(seasonNum, []);
    }
    seasonMap.get(seasonNum)!.push(episode);
  }

  const seasons: Season[] = [];
  for (const [number, eps] of seasonMap) {
    seasons.push({
      number,
      episodes: eps.sort((a, b) => a.IndexNumber - b.IndexNumber),
    });
  }

  return seasons.sort((a, b) => a.number - b.number);
}
