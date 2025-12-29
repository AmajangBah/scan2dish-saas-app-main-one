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
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-8 h-8 rounded-md bg-gray-100"
      >
        −
      </button>
      <div className="w-10 h-8 rounded-md bg-white border flex items-center justify-center">
        {value}
      </div>
      <Button
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-md bg-gray-100"
      >
        +
      </Button>
    </div>
  );
}
