import { Check, Cloud, Code as CodeIcon, Copy, FileText } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLATFORMS, type Platform } from "@/lib/cron-platforms";
import { type Messages, useT } from "@/lib/i18n";
import type { CrontabFileConfig, K8sConcurrency } from "@/stores/cron-store";
import { highlightCode } from "./highlight";
import { copyText } from "./utils";

type TabId = "crontab" | "snippets" | "platforms";

const SHELL_OPTIONS = ["/bin/bash", "/bin/sh", "/bin/zsh", "/usr/bin/env bash"] as const;

function logModeLabel(t: Messages, mode: CrontabFileConfig["logMode"]): string {
  switch (mode) {
    case "append":
      return t.log_mode_append();
    case "overwrite":
      return t.log_mode_overwrite();
    case "discard-err":
      return t.log_mode_discard_err();
    case "none":
      return t.log_mode_none();
  }
}

export interface Snippet {
  lang: string;
  file: string;
  code: string;
}

interface OutputPanelProps {
  // crontab file tab
  crontabFile: string;
  fileConfig: CrontabFileConfig;
  onFileConfigChange: (next: Partial<CrontabFileConfig>) => void;
  // snippets tab
  snippets: Snippet[];
  // platforms tab
  platformSnippets: Record<Platform, string>;
  k8sConcurrency: K8sConcurrency;
  onK8sConcurrencyChange: (v: K8sConcurrency) => void;
}

export function OutputPanel({
  crontabFile,
  fileConfig,
  onFileConfigChange,
  snippets,
  platformSnippets,
  k8sConcurrency,
  onK8sConcurrencyChange,
}: OutputPanelProps) {
  const t = useT();
  const tabsBaseId = React.useId();
  const [tab, setTab] = React.useState<TabId>("crontab");
  const [activeLang, setActiveLang] = React.useState(snippets[0]?.lang ?? "");
  const [activePlatform, setActivePlatform] = React.useState<Platform>("k8s");

  const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "crontab", label: t.output_tab_crontab(), icon: FileText },
    { id: "snippets", label: t.output_tab_snippets(), icon: CodeIcon },
    { id: "platforms", label: t.output_tab_platforms(), icon: Cloud },
  ];

  const activeSnippet = snippets.find((s) => s.lang === activeLang) ?? snippets[0] ?? null;
  const activePlatformMeta = PLATFORMS.find((p) => p.id === activePlatform) ?? PLATFORMS[0];

  return (
    <section className="surface-card animate-fade-in rounded-lg">
      {/* Header: title + tabs */}
      <div className="border-b border-border">
        <div className="flex items-center gap-2 px-4 pt-3.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-violet" />
          <h2 className="text-sm font-semibold text-foreground">{t.output_section()}</h2>
          <span className="font-mono text-[10px] lowercase text-muted-foreground">
            {t.output_subtitle()}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap" role="tablist" aria-label={t.output_section()}>
          {TABS.map((tabItem) => {
            const Icon = tabItem.icon;
            const isActive = tab === tabItem.id;
            const tabId = `${tabsBaseId}-tab-${tabItem.id}`;
            const panelId = `${tabsBaseId}-panel-${tabItem.id}`;
            return (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => setTab(tabItem.id)}
                role="tab"
                id={tabId}
                aria-selected={isActive}
                aria-controls={panelId}
                className={`relative flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tabItem.label}
                {isActive && (
                  <span className="absolute -bottom-px left-2 right-2 h-0.5 bg-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        {tab === "crontab" && (
          <div
            role="tabpanel"
            id={`${tabsBaseId}-panel-crontab`}
            aria-labelledby={`${tabsBaseId}-tab-crontab`}
          >
            <CrontabTab crontabFile={crontabFile} config={fileConfig} onChange={onFileConfigChange} />
          </div>
        )}

        {tab === "snippets" && (
          <div
            role="tabpanel"
            id={`${tabsBaseId}-panel-snippets`}
            aria-labelledby={`${tabsBaseId}-tab-snippets`}
          >
            {activeSnippet ? (
              <div className="space-y-3">
                <ChipRow
                  items={snippets.map((s) => ({ id: s.lang, label: s.lang }))}
                  active={activeSnippet.lang}
                  onChange={setActiveLang}
                />
                <CodeBlock
                  file={activeSnippet.file}
                  language={activeSnippet.lang}
                  code={activeSnippet.code}
                  highlightAs={activeSnippet.lang}
                  copyLabel={activeSnippet.lang}
                />
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
                {t.output_tab_snippets()}
              </div>
            )}
          </div>
        )}

        {tab === "platforms" && (
          <div
            className="space-y-3"
            role="tabpanel"
            id={`${tabsBaseId}-panel-platforms`}
            aria-labelledby={`${tabsBaseId}-tab-platforms`}
          >
            <ChipRow
              items={PLATFORMS.map((p) => ({ id: p.id, label: p.label }))}
              active={activePlatform}
              onChange={(id) => setActivePlatform(id as Platform)}
            />

            {activePlatform === "k8s" && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                <Label htmlFor="k8s-concurrency" className="text-xs text-muted-foreground">
                  {t.k8s_concurrency_hint()}
                </Label>
                <Select
                  value={k8sConcurrency}
                  onValueChange={(v) => onK8sConcurrencyChange(v as K8sConcurrency)}
                >
                  <SelectTrigger id="k8s-concurrency" className="h-7 w-28 font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Allow" className="font-mono text-xs">
                      Allow
                    </SelectItem>
                    <SelectItem value="Forbid" className="font-mono text-xs">
                      Forbid
                    </SelectItem>
                    <SelectItem value="Replace" className="font-mono text-xs">
                      Replace
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <CodeBlock
              file={activePlatformMeta.file}
              language={activePlatformMeta.language}
              code={platformSnippets[activePlatform]}
              highlightAs={activePlatformMeta.language}
              copyLabel={activePlatformMeta.label}
            />
          </div>
        )}
      </div>
    </section>
  );
}

// ---------- Internal: Chip row ----------

function ChipRow({
  items,
  active,
  onChange,
}: {
  items: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => {
        const isActive = it.id === active;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
              isActive
                ? "border-foreground/40 bg-foreground/5 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground"
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Internal: Code block ----------

function CodeBlock({
  file,
  language,
  code,
  highlightAs,
  copyLabel,
}: {
  file: string;
  language: string;
  code: string;
  highlightAs: string;
  copyLabel: string;
}) {
  const t = useT();
  const [copied, setCopied] = React.useState(false);
  const copiedTimerRef = React.useRef<number | null>(null);
  const prevCodeRef = React.useRef(code);

  const clearCopiedTimer = React.useCallback(() => {
    if (copiedTimerRef.current !== null) {
      window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (prevCodeRef.current !== code) {
      prevCodeRef.current = code;
      setCopied(false);
      clearCopiedTimer();
    }
  }, [code, clearCopiedTimer]);

  React.useEffect(() => {
    return () => clearCopiedTimer();
  }, [clearCopiedTimer]);

  const handleCopy = async () => {
    const ok = await copyText(code);
    if (!ok) {
      toast.error(t.error_title());
      return;
    }

    setCopied(true);
    toast.success(t.toast_copied_named({ name: copyLabel }));
    clearCopiedTimer();
    copiedTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copiedTimerRef.current = null;
    }, 1500);
  };

  const canCopy = code.trim().length > 0;

  return (
    <div
      className="overflow-hidden rounded-md border border-border"
      style={{ background: "oklch(0.18 0.02 260)" }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-mono text-xs text-zinc-400">{file}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            {language}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!canCopy}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
          aria-label={t.toast_copied_named({ name: copyLabel })}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" />
              {t.btn_copied()}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              {t.btn_copy()}
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 text-xs leading-relaxed">
        <code className="font-mono text-zinc-200">{highlightCode(code, highlightAs)}</code>
      </pre>
    </div>
  );
}

// ---------- Internal: Crontab tab ----------

function CrontabTab({
  crontabFile,
  config,
  onChange,
}: {
  crontabFile: string;
  config: CrontabFileConfig;
  onChange: (next: Partial<CrontabFileConfig>) => void;
}) {
  const t = useT();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cf-shell" className="text-xs text-muted-foreground">
            SHELL
          </Label>
          <Select value={config.shell} onValueChange={(v) => onChange({ shell: v })}>
            <SelectTrigger id="cf-shell" className="h-8 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHELL_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="font-mono text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cf-mailto" className="text-xs text-muted-foreground">
            {t.output_label_mailto()}
          </Label>
          <Input
            id="cf-mailto"
            value={config.mailto}
            onChange={(e) => onChange({ mailto: e.target.value })}
            placeholder="admin@example.com"
            className="h-8 font-mono text-xs"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="cf-cmd" className="text-xs text-muted-foreground">
            {t.output_label_cmd()}
          </Label>
          <Input
            id="cf-cmd"
            value={config.cmd}
            onChange={(e) => onChange({ cmd: e.target.value })}
            placeholder="/path/to/script.sh"
            className="h-8 font-mono text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cf-log" className="text-xs text-muted-foreground">
            {t.output_label_log()}
          </Label>
          <Input
            id="cf-log"
            value={config.log}
            onChange={(e) => onChange({ log: e.target.value })}
            placeholder="/var/log/task.log"
            disabled={config.logMode === "none"}
            className="h-8 font-mono text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cf-logmode" className="text-xs text-muted-foreground">
            {t.output_label_logmode()}
          </Label>
          <Select
            value={config.logMode}
            onValueChange={(v) => onChange({ logMode: v as CrontabFileConfig["logMode"] })}
          >
            <SelectTrigger id="cf-logmode" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["append", "overwrite", "discard-err", "none"] as const).map((m) => (
                <SelectItem key={m} value={m} className="text-xs">
                  {logModeLabel(t, m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="cf-comment" className="text-xs text-muted-foreground">
            {t.output_label_comment()}
          </Label>
          <Input
            id="cf-comment"
            value={config.comment}
            onChange={(e) => onChange({ comment: e.target.value })}
            placeholder="My Backup Task"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <CodeBlock
        file="crontab"
        language="crontab"
        code={crontabFile}
        highlightAs="Crontab"
        copyLabel={t.output_copy_label_crontab()}
      />

      <p className="text-[11px] text-muted-foreground">
        {t.output_hint_prefix()}{" "}
        <span className="rounded bg-muted px-1 py-0.5 font-mono">crontab -e</span>{" "}
        {t.output_hint_open()}
        <span className="rounded bg-muted px-1 py-0.5 font-mono">chmod +x</span>
        {t.output_hint_chmod()}
      </p>
    </div>
  );
}
