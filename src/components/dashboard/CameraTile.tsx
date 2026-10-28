import { useEffect, useRef, useState } from "react";
import { RefreshCw, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HassEntity } from "@/lib/ha";

export function CameraTile({ e, src }: { e: HassEntity; src: string | null }) {
  const [picture, setPicture] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const latest = useRef<string | null>(null);
  useEffect(() => {
    if (latest.current !== src) {
      setPicture(null);
      latest.current = src;
    }
    if (!src) { setLoading(false); setFailed(false); return; }
    let stopped = false;
    let pending = false;
    let image: HTMLImageElement | null = null;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const fetchPicture = () => {
      if (stopped || pending || document.visibilityState === "hidden") return;
      pending = true;
      setLoading(true);
      const url = new URL(src);
      url.searchParams.set("_dashboard", String(Date.now()));
      const next = url.toString();
      image = new Image();
      const finish = (ok: boolean) => {
        clearTimeout(timeout);
        if (stopped) return;
        pending = false;
        setLoading(false);
        setFailed(!ok);
        if (ok) setPicture(next);
      };
      image.onload = () => finish(true);
      image.onerror = () => finish(false);
      timeout = setTimeout(() => {
        if (image) { image.onload = null; image.onerror = null; image.src = ""; }
        finish(false);
      }, 12_000);
      image.src = next;
    };
    fetchPicture();
    const timer = setInterval(fetchPicture, 10_000);
    document.addEventListener("visibilitychange", fetchPicture);
    return () => {
      stopped = true;
      clearInterval(timer);
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", fetchPicture);
      if (image) { image.onload = null; image.onerror = null; image.src = ""; }
    };
  }, [src, refresh]);
  const name = e.attributes.friendly_name ?? e.entity_id;
  return <div className="tile relative aspect-video overflow-hidden" aria-label={`Kamera ${name}`}>
    {picture ? <img src={picture} alt={name} className="size-full object-cover" /> : <div className="flex size-full flex-col items-center justify-center gap-2 bg-secondary px-4 text-center"><Video className="size-8 text-muted-foreground" /><span className="text-xs text-muted-foreground">{!src ? "Kein Kamerabild verfügbar" : failed ? "Kamerabild nicht erreichbar" : "Bild wird geladen …"}</span></div>}
    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-background/80 px-3 py-2 backdrop-blur">
      <span className="min-w-0 truncate text-xs">{name}{picture && failed ? " · Letztes Bild" : ""}</span>
      {src && <Button size="icon" variant="ghost" className="size-8 shrink-0" title="Kamerabild aktualisieren" aria-label={`${name} aktualisieren`} disabled={loading} onClick={() => setRefresh(n => n + 1)}><RefreshCw className={loading ? "animate-spin" : ""} /></Button>}
    </div>
  </div>;
}