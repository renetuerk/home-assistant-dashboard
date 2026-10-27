import { useEffect, useState } from "react";
import type { HistoryPoint } from "@/lib/ha";

export function PvChart({ entityId, load }: { entityId: string; load: (id: string, hours: number) => Promise<HistoryPoint[]> }) {
  const [pts, setPts] = useState<HistoryPoint[]>([]);
  useEffect(() => {
    let alive = true;
    const run = () => load(entityId, 12).then((p) => alive && setPts(p)).catch(() => {});
    run();
    const t = setInterval(run, 5 * 60_000);
    return () => { alive = false; clearInterval(t); };
  }, [entityId, load]);
  if (pts.length < 2) return null;
  const W = 300, H = 80;
  const t0 = pts[0]!.t, t1 = pts[pts.length - 1]!.t;
  const max = Math.max(...pts.map((p) => p.v), 1);
  const xy = pts.map((p) => [((p.t - t0) / Math.max(t1 - t0, 1)) * W, H - (p.v / max) * (H - 4)] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fmt = (t: number) => new Date(t).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="tile p-5">
      <div className="mb-3 flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">PV-Leistung · 12 Std.</span>
        <span className="tabular-nums">max. {Math.round(max)} W</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-24 w-full text-primary" preserveAspectRatio="none" role="img" aria-label="Verlauf der PV-Leistung">
        <path d={`${line} L${W},${H} L0,${H} Z`} fill="currentColor" opacity={0.15} />
        <path d={line} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{fmt(t0)}</span><span>{fmt(t1)}</span>
      </div>
    </div>
  );
}
