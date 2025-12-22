"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function Home() {
  const router = useRouter();
  const { credentials, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (credentials) {
        router.replace("/search");
      } else {
        router.replace("/login");
      }
    }
  }, [credentials, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Cargando...</div>
    </div>
  );
}
