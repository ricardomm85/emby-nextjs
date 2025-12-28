import {
  AuthResponse,
  MediaItem,
  SearchResponse,
  Episode,
  EpisodesResponse,
} from "./types";

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let deviceId = localStorage.getItem("emby_device_id");
  if (!deviceId) {
    deviceId = `web-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("emby_device_id", deviceId);
  }
  return deviceId;
}

function getAuthHeader(): string {
  return `MediaBrowser Client="EmbyNextJS", Device="Browser", DeviceId="${getDeviceId()}", Version="1.0"`;
}

export async function authenticate(
  host: string,
  username: string,
  password: string
): Promise<{ token: string; userId: string; userName: string }> {
  try {
    // Use proxy API to avoid CORS and mixed content (HTTP/HTTPS) issues
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        host,
        username,
        password,
        deviceId: getDeviceId(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();

    return {
      token: data.token,
      userId: data.userId,
      userName: data.userName,
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("No se pudo conectar al servidor de autenticación");
    }
    throw error;
  }
}

export async function searchItems(
  host: string,
  userId: string,
  token: string,
  query: string,
  type?: "Movie" | "Series" | "Movie,Series"
): Promise<MediaItem[]> {
  const params = new URLSearchParams({
    Recursive: "true",
    searchTerm: query,
    api_key: token,
    Fields: "MediaSources,Overview,Genres",
    Limit: "50",
  });

  if (type) {
    params.set("IncludeItemTypes", type);
  }

  const embyUrl = `${host}/emby/Users/${userId}/Items?${params.toString()}`;

  // Use proxy to avoid mixed content (HTTPS -> HTTP)
  const proxyUrl = `/api/emby-proxy?url=${encodeURIComponent(embyUrl)}`;

  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error("Error al buscar contenido");
  }

  const data: SearchResponse = await response.json();
  return data.Items;
}

export async function getItemDetails(
  host: string,
  userId: string,
  token: string,
  itemId: string
): Promise<MediaItem> {
  const embyUrl = `${host}/emby/Users/${userId}/Items/${itemId}?api_key=${token}`;

  // Use proxy to avoid mixed content (HTTPS -> HTTP)
  const proxyUrl = `/api/emby-proxy?url=${encodeURIComponent(embyUrl)}`;

  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error("Error al obtener detalles");
  }

  return response.json();
}

export async function getEpisodes(
  host: string,
  userId: string,
  token: string,
  seriesId: string
): Promise<Episode[]> {
  const params = new URLSearchParams({
    UserId: userId,
    api_key: token,
    Fields: "MediaSources,Overview",
  });

  const embyUrl = `${host}/emby/Shows/${seriesId}/Episodes?${params.toString()}`;

  // Use proxy to avoid mixed content (HTTPS -> HTTP)
  const proxyUrl = `/api/emby-proxy?url=${encodeURIComponent(embyUrl)}`;

  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error("Error al obtener episodios");
  }

  const data: EpisodesResponse = await response.json();
  return data.Items;
}

export function getDownloadUrl(
  host: string,
  itemId: string,
  token: string
): string {
  return `${host}/emby/Videos/${itemId}/stream?static=true&api_key=${token}`;
}

export function getImageUrl(
  host: string,
  itemId: string,
  type: "Primary" | "Backdrop" = "Primary",
  maxWidth: number = 300
): string {
  const embyUrl = `${host}/emby/Items/${itemId}/Images/${type}?maxWidth=${maxWidth}`;

  // Use proxy to avoid mixed content (HTTPS -> HTTP)
  return `/api/emby-proxy?url=${encodeURIComponent(embyUrl)}`;
}
