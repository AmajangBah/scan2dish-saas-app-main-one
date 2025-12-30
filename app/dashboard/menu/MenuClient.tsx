"use client";

import { useState, useTransition } from "react";
import { MenuItem, MenuCategory } from "./types";
import CategoryTabs from "./components/CategoryTabs";
import SearchBar from "@/components/ui/search-bar";
import AddMenuButton from "./components/AddMenuButton";
import MenuCard from "./components/MenuCard";
import MenuModal from "./components/MenuModal";
import MenuListItem from "./components/MenuListItem";
import { Button } from "@/components/ui/button";
import { Grid, List } from "lucide-react";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
} from "@/app/actions/menu";
import type { MenuActionResult } from "@/app/actions/menu";

export default function MenuClient({
  initialMenuItems,
}: {
  initialMenuItems: MenuItem[];
}) {
  const categories: MenuCategory[] = [
    "Starters",
    "Mains",
    "Drinks",
    "Desserts",
  ];

  const [selectedCategory, setSelectedCategory] = useState<
    MenuCategory | "All"
  >("All");

  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<MenuItem | undefined>();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = menuItems.filter(
    (item) =>
      (selectedCategory === "All" || item.category === selectedCategory) &&
      item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setItemToEdit(undefined);
    setModalOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setItemToEdit(item);
    setModalOpen(true);
  };

  const handleToggleAvailability = async (id: string) => {
    const item = menuItems.find((i) => i.id === id);
    if (!item) return;

    // Optimistic update
    setMenuItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, available: !i.available } : i
      )
    );

    startTransition(async () => {
      const result = await toggleMenuItemAvailability(id, !item.available);
      if (!result.success) {
        // Rollback on error
        setMenuItems((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, available: item.available } : i
          )
        );
        setError(result.error || "Failed to update availability");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    // Optimistic delete
    const backup = menuItems;
    setMenuItems((prev) => prev.filter((item) => item.id !== id));

    startTransition(async () => {
      const result = await deleteMenuItem(id);
      if (!result.success) {
        // Rollback on error
        setMenuItems(backup);
        setError(result.error || "Failed to delete item");
      }
    });
  };

  const handleSave = async (item: MenuItem) => {
    const exists = menuItems.find((i) => i.id === item.id);

    // Optimistic update
    if (exists) {
      setMenuItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    } else {
      setMenuItems((prev) => [...prev, item]);
    }

    startTransition(async () => {
      let result: MenuActionResult;
      if (exists) {
        // Update existing
        result = await updateMenuItem(item.id, {
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          images: item.images,
          available: item.available,
          tags: item.tags,
          variants: item.variants,
        });
      } else {
        // Create new
        result = await createMenuItem({
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          images: item.images,
          available: item.available,
          tags: item.tags,
          variants: item.variants,
        });

        // Update with real ID from server
        if (result.success && result.id) {
          setMenuItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, id: result.id! } : i))
          );
        }
      }

      if (!result.success) {
        // Rollback on error
        if (exists) {
          const original = initialMenuItems.find((i) => i.id === item.id);
          if (original) {
            setMenuItems((prev) =>
              prev.map((i) => (i.id === item.id ? original : i))
            );
          }
        } else {
          setMenuItems((prev) => prev.filter((i) => i.id !== item.id));
        }
        setError(result.error || "Failed to save item");
      }
    });
  };

  return (
    <div className="p-6 min-h-screen space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Menu Management</h1>

        <div className="flex gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            onClick={() => setView("grid")}
          >
            <Grid size={18} />
          </Button>

          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
          >
            <List size={18} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-900 font-semibold"
          >
            ×
          </button>
        </div>
      )}

      {isPending && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
          Saving changes...
        </div>
      )}

      <AddMenuButton onClick={handleAdd} />

      <CategoryTabs
        categories={categories}
        selected={selectedCategory}
        onSelect={(category) =>
          setSelectedCategory(category as MenuCategory | "All")
        }
      />

      <SearchBar 
        value={search} 
        onChange={setSearch} 
        placeholder="Search menu items..."
        className="max-w-md mx-auto"
      />

      {/* 🔥 SWITCH BETWEEN GRID AND LIST */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {filtered.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onToggleAvailability={handleToggleAvailability}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-4">
          {filtered.map((item) => (
            <MenuListItem
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onToggleAvailability={handleToggleAvailability}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <MenuModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        itemToEdit={itemToEdit}
      />
    </div>
  );
}
