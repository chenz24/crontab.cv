import { formatInTimeZone } from "date-fns-tz";

// ---------- Dual time row ----------
export function DualTimeRow({
  date,
  serverTz,
  localTz,
}: {
  date: Date;
  serverTz: string;
  localTz: string;
}) {
  const serverDate = formatInTimeZone(date, serverTz, "yyyy-MM-dd");
  const serverTime = formatInTimeZone(date, serverTz, "HH:mm:ss");
  const serverDow = formatInTimeZone(date, serverTz, "EEE");
  const localDate = formatInTimeZone(date, localTz, "yyyy-MM-dd");
  const localTime = formatInTimeZone(date, localTz, "HH:mm:ss");
  const sameTz = serverTz === localTz;
  const crossDay = !sameTz && serverDate !== localDate;
  const dayDelta = crossDay
    ? Math.round(
        (new Date(`${localDate}T00:00:00Z`).getTime() -
          new Date(`${serverDate}T00:00:00Z`).getTime()) /
          (24 * 3600 * 1000),
      )
    : 0;

  return (
    <div className="space-y-0.5">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[10px] uppercase text-muted-foreground/70">SRV</span>
        <span className="font-mono text-sm text-foreground">
          {serverDate} {serverTime}
        </span>
        <span className="text-[10px] text-muted-foreground">{serverDow}</span>
      </div>
      {!sameTz && (
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] uppercase text-muted-foreground/70">LOC</span>
          <span
            className="font-mono text-sm"
            style={{
              color: crossDay ? "var(--accent-amber)" : "var(--color-muted-foreground)",
            }}
          >
            {localDate} {localTime}
          </span>
          {crossDay && (
            <span
              className="rounded px-1 font-mono text-[10px]"
              style={{
                color: "var(--accent-amber)",
                background: "color-mix(in oklab, var(--accent-amber) 10%, transparent)",
              }}
            >
              {dayDelta > 0 ? "+" : ""}
              {dayDelta}d
            </span>
          )}
        </div>
      )}
    </div>
  );
}
