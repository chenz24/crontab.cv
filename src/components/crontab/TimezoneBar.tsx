import { ArrowLeftRight, Globe } from "lucide-react";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/lib/i18n";

// ---------- Timezone bar ----------
export function TimezoneBar({
  tz,
  localTz,
  browserTz,
  tzDiffLabel,
  tzOptions,
  onTzChange,
  onLocalTzChange,
}: {
  tz: string;
  localTz: string;
  browserTz: string;
  tzDiffLabel: string;
  tzOptions: [string, string][];
  onTzChange: (v: string) => void;
  onLocalTzChange: (v: string) => void;
}) {
  const t = useT();
  const sameTz = tz === localTz;
  const localIsBrowser = localTz === browserTz;
  // Expand local selector only when user explicitly opens it, or when local
  // differs from both server and the default browser tz (meaning they've
  // already customized it and should see the current value plainly).
  const [localOpen, setLocalOpen] = React.useState(!sameTz && !localIsBrowser);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {localOpen ? (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t.tz_local_label()}
          </span>
          <Select value={localTz} onValueChange={onLocalTzChange}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tzOptions.map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sameTz && (
            <button
              type="button"
              onClick={() => setLocalOpen(false)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
              title={t.tz_collapse_title()}
            >
              {t.tz_collapse()}
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setLocalOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 font-mono text-[10px] text-muted-foreground hover:border-border hover:text-foreground"
          title={t.tz_local_button_title()}
        >
          <span className="uppercase tracking-wider">{t.tz_local_label()}</span>
          <span className="text-foreground/80">{localTz}</span>
          {localIsBrowser && <span className="text-muted-foreground">{t.tz_local_browser()}</span>}
        </button>
      )}
      {!sameTz && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <ArrowLeftRight className="h-3.5 w-3.5" />
          <span className="font-mono text-[10px]">{tzDiffLabel}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {t.tz_server_label()}
        </span>
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={tz} onValueChange={onTzChange}>
          <SelectTrigger className="h-8 w-[200px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tzOptions.map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
