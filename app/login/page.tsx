"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { authenticate } from "@/lib/emby-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

const LAST_HOST_KEY = "emby_last_host";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    host: "",
    username: "",
    password: "",
  });

  useEffect(() => {
    const lastHost = localStorage.getItem(LAST_HOST_KEY);
    if (lastHost) {
      setFormData((prev) => ({ ...prev, host: lastHost }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let host = formData.host.trim();
      if (!host.startsWith("http://") && !host.startsWith("https://")) {
        host = `http://${host}`;
      }
      if (host.endsWith("/")) {
        host = host.slice(0, -1);
      }

      const result = await authenticate(
        host,
        formData.username,
        formData.password
      );

      localStorage.setItem(LAST_HOST_KEY, formData.host.trim());
      login(host, result.token, result.userId);
      toast.success(`Bienvenido, ${result.userName}`);
      router.push("/search");
    } catch {
      toast.error("Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Emby Downloader</CardTitle>
          <CardDescription>
            Inicia sesión con tu cuenta de Emby
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="host" className="text-sm font-medium">
                Servidor Emby
              </label>
              <Input
                id="host"
                type="text"
                placeholder="ejemplo.com:8096"
                value={formData.host}
                onChange={(e) =>
                  setFormData({ ...formData, host: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Usuario / Email
              </label>
              <Input
                id="username"
                type="text"
                placeholder="tu@email.com"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Conectando..." : "Iniciar sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
