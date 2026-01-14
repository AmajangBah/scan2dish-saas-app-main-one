"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMenuRestaurant } from "../context/MenuRestaurantContext";

export default function QuantitySelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const { restaurantId } = useMenuRestaurant();

  const handleDecrease = () => {
    const newValue = Math.max(1, value - 1);
    onChange(newValue);
  };

  const handleIncrease = () => {
    const newValue = value + 1;
    onChange(newValue);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={handleDecrease}
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
        onClick={handleIncrease}
      >
        +
      </Button>
    </div>
  );
}
