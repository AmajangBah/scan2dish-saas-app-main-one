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
import { QrCode, Download, Share2, Eye, Copy } from "lucide-react";
import { Table } from "../types";
import { useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";

export default function QrDialog({
  open,
  setOpen,
  table,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  table: Table | null;
}) {
  const pathname = usePathname();
  const qrWrapRef = useRef<HTMLDivElement | null>(null);

  const locale = useMemo(() => {
    const seg = pathname.split("/").filter(Boolean)[0];
    return seg || "en";
  }, [pathname]);

  const tableId = table?.id ?? "";
  const menuPath = tableId ? `/${locale}/menu/${tableId}/browse` : "";
  const menuUrl =
    typeof window !== "undefined" && menuPath
      ? new URL(menuPath, window.location.origin).toString()
      : menuPath;

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
    const canvas = qrWrapRef.current?.querySelector("canvas");
    if (!canvas) {
      toast.error("QR not ready yet. Try again in a moment.");
      return;
    }
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `scan2dish-table-${table.number}.png`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Table {table?.number} QR Code</DialogTitle>
          <DialogDescription>
            Customers scan this to open the live menu for this table.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          <div
            ref={qrWrapRef}
            className="rounded-xl border bg-background p-4 shadow-sm"
          >
            {menuUrl ? (
              <QRCodeCanvas
                value={menuUrl}
                size={240}
                includeMargin
                level="M"
              />
            ) : (
              <div className="h-[240px] w-[240px] grid place-items-center text-muted-foreground">
                <QrCode className="h-12 w-12" />
              </div>
            )}
          </div>

          {menuUrl && (
            <button
              type="button"
              onClick={handleCopy}
              className="mt-3 max-w-full text-xs text-muted-foreground hover:text-foreground truncate"
              title={menuUrl}
            >
              {menuUrl}
            </button>
          )}

          <p className="text-sm mt-3 text-muted-foreground">
            Scanned {table?.qrScans} times
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={!menuUrl}>
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>

          <Button variant="outline" onClick={handleShare} disabled={!menuUrl}>
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>

          <Button variant="outline" onClick={handleCopy} disabled={!menuUrl}>
            <Copy className="h-4 w-4 mr-2" /> Copy link
          </Button>

          <Button onClick={handlePreview} disabled={!menuUrl}>
            <Eye className="h-4 w-4 mr-2" /> Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
