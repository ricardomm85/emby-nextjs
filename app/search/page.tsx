"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { searchItems } from "@/lib/emby-api";
import { MediaItem } from "@/lib/types";
import { MediaCard } from "@/components/media-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type FilterType = "Movie,Series" | "Movie" | "Series";

export default function SearchPage() {
  const router = useRouter();
  const { credentials, isLoading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("Movie,Series");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!authLoading && !credentials) {
      router.replace("/login");
    }
  }, [authLoading, credentials, router]);

  const handleSearch = useCallback(async () => {
    if (!credentials || !query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const items = await searchItems(
        credentials.host,
        credentials.userId,
        credentials.token,
        query.trim(),
        filter
      );
      setResults(items);
    } catch {
      toast.error("Error al buscar. Intenta de nuevo.");
    } finally {
      setIsSearching(false);
    }
  }, [credentials, query, filter]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (authLoading || !credentials) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="search"
              placeholder="Buscar películas o series..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
              {isSearching ? "Buscando..." : "Buscar"}
            </Button>
          </div>
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as FilterType)}
          >
            <TabsList>
              <TabsTrigger value="Movie,Series">Todo</TabsTrigger>
              <TabsTrigger value="Movie">Películas</TabsTrigger>
              <TabsTrigger value="Series">Series</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <main>
        {isSearching ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map((item) => (
              <MediaCard key={item.Id} item={item} host={credentials.host} />
            ))}
          </div>
        ) : hasSearched ? (
          <div className="text-center py-12 text-muted-foreground">
            No se encontraron resultados para "{query}"
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Escribe un término de búsqueda para comenzar
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
