"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { QrCode, Download, Share2, Eye, Copy, Sparkles } from "lucide-react";
import { Table } from "../types";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";

function isHexColor(value: string) {
  return /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(value.trim());
}

export default function QrDialog({
  open,
  setOpen,
  table,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  table: Table | null;
}) {
  const qrCardRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<"branded" | "classic">("branded");
  const [highContrast, setHighContrast] = useState(false);
  const [showLogo, setShowLogo] = useState(true);
  const [brandColor] = useState<string>(() => {
    if (typeof window === "undefined") return "#C84501";
    try {
      // `--primary` is set at the dashboard layout wrapper; reading from body is usually enough.
      const candidates = [document.body, document.documentElement] as HTMLElement[];
      for (const el of candidates) {
        const c = getComputedStyle(el).getPropertyValue("--primary").trim();
        if (c) return c;
      }
      return "#C84501";
    } catch {
      return "#C84501";
    }
  });

  const [useCustomColor, setUseCustomColor] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem("s2d_qr_use_custom_color") === "true";
    } catch {
      return false;
    }
  });

  const [customColor, setCustomColor] = useState<string>(() => {
    if (typeof window === "undefined") return "#C84501";
    try {
      const stored = window.localStorage.getItem("s2d_qr_custom_color");
      if (stored && isHexColor(stored)) return stored;
    } catch {
      // ignore
    }
    return "#C84501";
  });

  // Use clean customer URLs (table number) and let middleware add locale prefix.
  const tableNumber = table?.number ?? "";
  const menuPath = tableNumber ? `/menu/${encodeURIComponent(tableNumber)}` : "";
  const menuUrl =
    typeof window !== "undefined" && menuPath
      ? new URL(menuPath, window.location.origin).toString()
      : menuPath;

  const effectiveMode: "branded" | "classic" = highContrast ? "classic" : mode;
  const effectiveShowLogo = highContrast ? false : showLogo;

  const qrFg = highContrast
    ? "#000000"
    : useCustomColor && isHexColor(customColor)
      ? customColor
      : effectiveMode === "branded"
        ? brandColor || "#C84501"
        : "#111827";
  const qrBg = "#ffffff";
  const qrLevel = effectiveShowLogo && !highContrast ? "H" : "M";

  const handlePreview = () => {
    if (!menuUrl) return;
    window.open(menuUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    if (!menuUrl) return;
    try {
      await navigator.clipboard.writeText(menuUrl);
      toast.success("Menu link copied");
    } catch {
      toast.error("Couldn’t copy link. Please try again.");
    }
  };

  const handleShare = async () => {
    if (!menuUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Table ${table?.number} Menu`,
          text: `Scan2Dish menu for Table ${table?.number}`,
          url: menuUrl,
        });
        return;
      }
      await handleCopy();
    } catch {
      // User canceled share or share failed — fall back to copy
      await handleCopy();
    }
  };

  const handleDownload = () => {
    if (!table?.number) return;
    const node = qrCardRef.current;
    if (!node) return;
    toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    })
      .then((dataUrl) => {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `scan2dish-table-${table.number}-${mode}${highContrast ? "-high-contrast" : ""}.png`;
        a.click();
      })
      .catch(() => {
        toast.error("Couldn’t generate the QR image. Try again.");
      });
  };

  const presetColors = [
    { name: "Brand", value: brandColor || "#C84501" },
    { name: "Orange", value: "#C84501" },
    { name: "Emerald", value: "#059669" },
    { name: "Indigo", value: "#4F46E5" },
    { name: "Slate", value: "#111827" },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Table {table?.number} QR Code</DialogTitle>
          <DialogDescription>
            Customers scan this to open the live menu for this table.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[1fr_380px]">
          {/* Controls */}
          <div className="space-y-4">
            <div className="rounded-2xl border bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">QR style</div>
                <Badge variant="outline" className="gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-sm border"
                    style={{ background: qrFg }}
                    aria-hidden
                  />
                  {highContrast
                    ? "High contrast"
                    : `${mode === "branded" ? "Branded" : "Classic"}${
                        useCustomColor ? " • Custom color" : ""
                      }`}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={
                    effectiveMode === "branded" && !highContrast ? "default" : "outline"
                  }
                  onClick={() => setMode("branded")}
                  disabled={highContrast}
                  className="rounded-xl w-full justify-center"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Branded
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={effectiveMode === "classic" ? "default" : "outline"}
                  onClick={() => setMode("classic")}
                  className="rounded-xl w-full justify-center"
                >
                  Classic
                </Button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">High contrast mode</div>
                    <div className="text-xs text-muted-foreground">
                      Best for scan reliability on any printer.
                    </div>
                  </div>
                  <Switch checked={highContrast} onCheckedChange={setHighContrast} />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Show Scan2Dish logo</div>
                    <div className="text-xs text-muted-foreground">
                      Uses higher error correction. Disable if scans fail.
                    </div>
                  </div>
                  <Switch
                    checked={effectiveShowLogo}
                    onCheckedChange={setShowLogo}
                    disabled={highContrast}
                  />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Custom QR color</div>
                    <div className="text-xs text-muted-foreground">
                      Pick a color for the QR. Disabled in high contrast mode.
                    </div>
                  </div>
                  <Switch
                    checked={useCustomColor}
                    onCheckedChange={(v) => {
                      setUseCustomColor(v);
                      try {
                        window.localStorage.setItem(
                          "s2d_qr_use_custom_color",
                          v ? "true" : "false"
                        );
                      } catch {
                        // ignore
                      }
                    }}
                    disabled={highContrast}
                  />
                </div>

                {!highContrast && useCustomColor && (
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                      {presetColors.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => {
                            setCustomColor(c.value);
                            try {
                              window.localStorage.setItem("s2d_qr_custom_color", c.value);
                            } catch {
                              // ignore
                            }
                          }}
                          className={cn(
                            "h-8 rounded-xl border px-2 text-xs flex items-center gap-2 bg-background hover:bg-muted/40",
                            customColor.toLowerCase() === c.value.toLowerCase()
                              ? "border-foreground/30"
                              : "border-border"
                          )}
                          title={c.value}
                        >
                          <span
                            className="h-3 w-3 rounded-sm border"
                            style={{ background: c.value }}
                            aria-hidden
                          />
                          {c.name}
                        </button>
                      ))}
                    </div>

                    <label className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2">
                      <span className="text-xs text-muted-foreground">Pick</span>
                      <input
                        aria-label="Pick QR color"
                        type="color"
                        value={isHexColor(customColor) ? customColor : "#C84501"}
                        onChange={(e) => {
                          const v = e.target.value;
                          setCustomColor(v);
                          try {
                            window.localStorage.setItem("s2d_qr_custom_color", v);
                          } catch {
                            // ignore
                          }
                        }}
                        className="h-7 w-10 rounded-md border bg-transparent p-0"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {menuUrl && (
              <div className="rounded-2xl border bg-muted/10 p-4">
                <div className="text-sm font-semibold">Menu link</div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="mt-2 w-full rounded-xl border bg-background px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground break-all"
                  title="Click to copy"
                >
                  {menuUrl}
                </button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Tip: Click the link above to copy.
                </p>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              Scanned <span className="font-medium text-foreground">{table?.qrScans ?? 0}</span>{" "}
              times
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center md:items-end">
            <div
              ref={qrCardRef}
              className={cn(
                "w-full max-w-[380px] rounded-2xl border bg-white p-4 shadow-sm",
                highContrast ? "border-neutral-300" : "border-neutral-200"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] text-neutral-500">Scan to order</div>
                  <div className="text-lg font-extrabold leading-tight text-neutral-900">
                    Table {table?.number || "—"}
                  </div>
                  <div className="text-xs text-neutral-600 truncate">{table?.location || ""}</div>
                </div>
                {!highContrast && effectiveMode === "branded" && (
                  <div
                    className="h-8 w-8 rounded-xl border grid place-items-center"
                    style={{ borderColor: `${brandColor}33`, background: `${brandColor}14`, color: brandColor }}
                    aria-hidden
                  >
                    <QrCode className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="mt-3 rounded-xl border bg-white p-3 flex items-center justify-center">
                {menuUrl ? (
                  <div className="relative">
                    <QRCodeCanvas
                      value={menuUrl}
                      size={220}
                      includeMargin
                      level={qrLevel}
                      bgColor={qrBg}
                      fgColor={qrFg}
                    />
                    {effectiveShowLogo && !highContrast && (
                      <div className="absolute inset-0 grid place-items-center pointer-events-none">
                        <div className="h-14 w-14 rounded-2xl bg-white border shadow-sm grid place-items-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/Logo.png" alt="Scan2Dish" className="h-10 w-10 object-contain" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-[220px] w-[220px] grid place-items-center text-neutral-400">
                    <QrCode className="h-12 w-12" />
                  </div>
                )}
              </div>

              <div className="mt-3 text-center">
                <div className="text-xs font-semibold text-neutral-900">
                  Open menu on your phone
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  Powered by <span className="font-semibold">Scan2Dish</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
            <Button
              className="w-full"
              variant="outline"
              onClick={handleDownload}
              disabled={!menuUrl}
            >
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>

            <Button className="w-full" variant="outline" onClick={handleShare} disabled={!menuUrl}>
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>

            <Button className="w-full" variant="outline" onClick={handleCopy} disabled={!menuUrl}>
              <Copy className="h-4 w-4 mr-2" /> Copy link
            </Button>

            <Button className="w-full" onClick={handlePreview} disabled={!menuUrl}>
              <Eye className="h-4 w-4 mr-2" /> Preview
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
