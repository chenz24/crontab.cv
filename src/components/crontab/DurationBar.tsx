import { useT } from "@/lib/i18n";
import { formatDuration } from "./utils";

export function DurationBar({ dur, interval }: { dur: number; interval: number }) {
  const t = useT();
  const ratio = dur / interval;
  const pct = Math.min(100, Math.round(ratio * 100));
  let color: string;
  let label: string;
  if (ratio < 0.8) {
    color = "var(--accent-emerald)";
    label = `${formatDuration(dur)} · ${t.dur_bar_ok()}`;
  } else if (ratio < 1) {
    color = "var(--accent-amber)";
    label = `${formatDuration(dur)} · ${t.dur_bar_close()}`;
  } else {
    color = "var(--accent-rose)";
    const overrun = dur - interval;
    label = `${formatDuration(dur)} · ${t.dur_bar_overlap({ value: formatDuration(overrun) })}`;
  }
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted/40">
        <div
          className="h-full"
          style={{
            width: `${pct}%`,
            background: `color-mix(in oklab, ${color} 70%, transparent)`,
          }}
        />
        {ratio >= 1 && (
          <div className="absolute right-0 top-0 h-full w-[2px]" style={{ background: color }} />
        )}
      </div>
      <span className="font-mono text-[10px] tabular-nums" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
