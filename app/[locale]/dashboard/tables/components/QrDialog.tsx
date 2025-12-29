"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Share2, Eye } from "lucide-react";
import { Table } from "../types";

export default function QrDialog({
  open,
  setOpen,
  table,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  table: Table | null;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Table {table?.number} QR Code</DialogTitle>
          <DialogDescription>Scan to access menu.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          <div className="bg-white p-4 rounded-lg">
            <QrCode className="h-48 w-48" />
          </div>

          <p className="text-sm mt-4 text-muted-foreground">
            Scanned {table?.qrScans} times
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>

          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>

          <Button>
            <Eye className="h-4 w-4 mr-2" /> Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
