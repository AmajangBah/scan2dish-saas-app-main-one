"use client";

import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Search...",
  className = ""
}: SearchBarProps) {
  return (
    <div className={`flex items-center border rounded-xl p-2 bg-white shadow-sm ${className}`}>
      <span className="text-gray-400 ml-2 text-lg">🔍</span>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-none shadow-none ml-2 w-full focus:outline-none"
      />
    </div>
  );
}
