"use client";

import { Button } from "@/components/ui/button";

interface AddMenuButtonProps {
  onClick: () => void;
}

export default function AddMenuButton({ onClick }: AddMenuButtonProps) {
  return (
    <div className="flex justify-end mb-4">
      <Button
        onClick={onClick}
        className="bg-green-600 text-white hover:bg-green-700"
      >
        ➕ Add Menu Item
      </Button>
    </div>
  );
}
