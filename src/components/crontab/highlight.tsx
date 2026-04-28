import type * as React from "react";

// ---------- Tiny syntax highlighter (muted palette) ----------
export function highlightCode(code: string, lang: string): React.ReactNode {
  const KEYWORDS: Record<string, string[]> = {
    Crontab: ["/usr/bin/php"],
    "Go (robfig/cron)": ["func", "fmt", "cron", "Println"],
    "Node.js (node-cron)": ["import", "from", "console", "log"],
    "Python (APScheduler)": ["scheduler", "add_job", "cron"],
    "Java (Spring)": ["public", "void", "Scheduled"],
  };
  const kws = new Set(KEYWORDS[lang] ?? []);
  const tokens: { t: "str" | "kw" | "com" | "num" | "txt"; v: string }[] = [];
  const re = /(\/\/[^\n]*|#[^\n]*|"[^"]*"|'[^']*'|`[^`]*`|\b\d+\b|\b\w+\b|[\s\S])/g;
  for (const match of code.matchAll(re)) {
    const v = match[0];
    if (v.startsWith("//") || v.startsWith("#")) tokens.push({ t: "com", v });
    else if (/^["'`]/.test(v)) tokens.push({ t: "str", v });
    else if (/^\d+$/.test(v)) tokens.push({ t: "num", v });
    else if (kws.has(v)) tokens.push({ t: "kw", v });
    else tokens.push({ t: "txt", v });
  }
  const cls: Record<string, string> = {
    str: "text-orange-300/90",
    kw: "text-blue-300/90",
    com: "text-zinc-500 italic",
    num: "text-zinc-300",
    txt: "text-zinc-200",
  };
  let offset = 0;
  return tokens.map((tk) => {
    const key = `${offset}-${tk.t}`;
    offset += tk.v.length;
    return (
      <span key={key} className={cls[tk.t]}>
        {tk.v}
      </span>
    );
  });
}
