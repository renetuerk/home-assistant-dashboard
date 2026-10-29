import { useEffect, useState } from "react";
import type { HistoryPoint } from "@/lib/ha";

type Load = (id: string, hours: number) => Promise<HistoryPoint[]>;

function useHistory(id: string | undefined, load: Load) {
  const [pts, setPts] = useState<HistoryPoint[]>([]);
  useEffect(() => {
    if (!id) { setPts([]); return; }
    let alive = true;
    const run = () => load(id, 12).then((p) => alive && setPts(p)).catch(() => {});
    run();
    const t = setInterval(run, 5 * 60_000);
    return () => { alive = false; clearInterval(t); };
  }, [id, load]);
  return pts;
}

/** PV production and house consumption over the last 12 hours in one chart. */
export function PvChart({ pvId, powerId, load }: { pvId?: string | undefined; powerId?: string | undefined; load: Load }) {
  const pv = useHistory(pvId, load);
  const use = useHistory(powerId, load);
  const all = [...pv, ...use];
  if (pv.length < 2 && use.length < 2) return null;
  const W = 300, H = 80;
  const t0 = Math.min(...all.map((p) => p.t)), t1 = Math.max(...all.map((p) => p.t));
  const max = Math.max(...all.map((p) => p.v), 1);
  const path = (pts: HistoryPoint[]) => pts
    .map((p, i) => `${i ? "L" : "M"}${(((p.t - t0) / Math.max(t1 - t0, 1)) * W).toFixed(1)},${(H - (Math.max(p.v, 0) / max) * (H - 4)).toFixed(1)}`)
    .join(" ");
  const pvLine = pv.length > 1 ? path(pv) : "";
  const useLine = use.length > 1 ? path(use) : "";
  const fmt = (t: number) => new Date(t).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="tile p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="text-muted-foreground">Leistung · 12 Std.</span>
        <span className="flex gap-3 text-xs">
          {pvLine && <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />PV</span>}
          {useLine && <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-foreground" />Hausverbrauch</span>}
          <span className="tabular-nums text-muted-foreground">max. {Math.round(max)} W</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-24 w-full" preserveAspectRatio="none" role="img" aria-label="Verlauf von PV-Leistung und Hausverbrauch">
        {pvLine && <path d={`${pvLine} L${W},${H} L0,${H} Z`} className="fill-primary" opacity={0.15} />}
        {pvLine && <path d={pvLine} fill="none" className="stroke-primary" strokeWidth={2} vectorEffect="non-scaling-stroke" />}
        {useLine && <path d={useLine} fill="none" className="stroke-foreground" strokeWidth={1.5} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" opacity={0.8} />}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{fmt(t0)}</span><span>{fmt(t1)}</span>
      </div>
    </div>
  );
}
