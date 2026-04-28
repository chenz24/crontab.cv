import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocaleAndNavigate, useLocale, useT } from "@/lib/i18n";
import type { Locale } from "@/paraglide/runtime";

type LocaleLabelKey =
  | "language_chinese"
  | "language_english"
  | "language_japanese"
  | "language_french"
  | "language_german"
  | "language_spanish";

const LOCALES: Array<{ code: Locale; labelKey: LocaleLabelKey }> = [
  { code: "zh", labelKey: "language_chinese" },
  { code: "en", labelKey: "language_english" },
  { code: "ja", labelKey: "language_japanese" },
  { code: "fr", labelKey: "language_french" },
  { code: "de", labelKey: "language_german" },
  { code: "es", labelKey: "language_spanish" },
];

export function LanguageSwitcher() {
  const t = useT();
  const current = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t.language_switch_label()}
          className="h-8 w-8"
        >
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        {LOCALES.map(({ code, labelKey }) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => {
              if (code !== current) setLocaleAndNavigate(code);
            }}
            className={code === current ? "font-semibold" : undefined}
          >
            {t[labelKey]()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
