"use client";

import { useMemo, useState, useTransition } from "react";
import { MenuItem, MenuCategory } from "./types";
import CategoryTabs from "./components/CategoryTabs";
import SearchBar from "@/components/ui/search-bar";
import MenuCard from "./components/MenuCard";
import MenuModal from "./components/MenuModal";
import MenuListItem from "./components/MenuListItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Grid, List, Plus, UtensilsCrossed, EyeOff, CheckCircle2, SearchX } from "lucide-react";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
} from "@/app/actions/menu";
import type { MenuActionResult } from "@/app/actions/menu";

export default function MenuClient({
  initialMenuItems,
  currency,
}: {
  initialMenuItems: MenuItem[];
  currency: string;
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesText =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.description ? item.description.toLowerCase().includes(q) : false);
      return matchesCategory && matchesText;
    });
  }, [menuItems, search, selectedCategory]);

  const stats = useMemo(() => {
    const total = menuItems.length;
    const available = menuItems.filter((i) => i.available).length;
    const hidden = total - available;
    const categoriesUsed = new Set(menuItems.map((i) => i.category)).size;
    return { total, available, hidden, categoriesUsed };
  }, [menuItems]);

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
          nameTranslations: item.nameTranslations ?? {},
          descriptionTranslations: item.descriptionTranslations ?? {},
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
          nameTranslations: item.nameTranslations ?? {},
          descriptionTranslations: item.descriptionTranslations ?? {},
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UtensilsCrossed className="h-4 w-4" />
            Menu
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Menu management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add items, update prices, and hide sold-out dishes in seconds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
          >
            <Grid className="h-4 w-4 mr-2" />
            Grid
          </Button>
          <Button
            variant="outline"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button onClick={handleAdd} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Add item
          </Button>
        </div>
      </div>

      {/* Stats (bento) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total items</div>
            <div className="text-2xl font-semibold mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Visible to customers</div>
            <div className="mt-1 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div className="text-2xl font-semibold">{stats.available}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Hidden / unavailable</div>
            <div className="mt-1 flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-semibold">{stats.hidden}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Categories used</div>
            <div className="text-2xl font-semibold mt-1">{stats.categoriesUsed}</div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Saving…
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or description…"
            className="max-w-xl"
          />
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
            <span className="font-medium text-foreground">{menuItems.length}</span>
          </div>
        </div>

        <CategoryTabs
          categories={categories}
          selected={selectedCategory}
          onSelect={(category) => setSelectedCategory(category as MenuCategory | "All")}
        />
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-10">
            <div className="mx-auto max-w-lg text-center space-y-3">
              <div className="mx-auto h-11 w-11 rounded-xl border bg-muted/30 grid place-items-center">
                <SearchX className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-lg font-semibold">No items match your filters</div>
              <p className="text-sm text-muted-foreground">
                Try clearing the search, switching categories, or add a new menu item.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add item
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("All");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              currency={currency}
              onEdit={handleEdit}
              onToggleAvailability={handleToggleAvailability}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => (
            <MenuListItem
              key={item.id}
              item={item}
              currency={currency}
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
        currency={currency}
      />
    </div>
  );
}
