"use client";

import { Button } from "@/components/ui/button";

export default function QuantitySelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        −
      </Button>
      <div className="min-w-10 h-8 rounded-md bg-background border flex items-center justify-center text-sm font-medium px-2">
        {value}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => onChange(value + 1)}
      >
        +
      </Button>
    </div>
  );
}
