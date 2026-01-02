"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import CategoryPills from "../../components/CategoryPills";
import ProductCard from "../../components/ProductCard";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import CartBar from "../../components/CartBar";
import { useMenuRestaurant } from "../../context/MenuRestaurantContext";
import MenuTypeTabs, { type MenuType } from "../../components/MenuTypeTabs";
import { classifyMenuType } from "../../utils/menuType";

function pickTranslatedText({
  locale,
  base,
  translations,
}: {
  locale: string | null;
  base: string;
  translations: unknown;
}) {
  if (!locale || locale === "en") return base;
  if (!translations || typeof translations !== "object" || Array.isArray(translations)) {
    return base;
  }
  const v = (translations as Record<string, unknown>)[locale];
  return typeof v === "string" && v.trim() ? v : base;
}

export default function BrowsePage() {
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : null;
  const { restaurantId } = useMenuRestaurant();

  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [activeType, setActiveType] = useState<MenuType>("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<
    {
      id: string;
      name: string;
      desc?: string;
      price: number;
      image?: string;
      categoryId?: string;
      categoryLabel?: string;
      outOfStock?: boolean;
      tags?: unknown;
    }[]
  >([]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of items) {
      if (it.categoryId && it.categoryLabel) {
        map.set(it.categoryId, it.categoryLabel);
      }
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [items]);

  const categoriesForType = useMemo(() => {
    if (activeType === "all") return categories;
    const allowed = new Set<string>();
    for (const it of items) {
      if (!it.categoryId) continue;
      const t = classifyMenuType(it.categoryLabel);
      if (t === activeType) allowed.add(it.categoryId);
    }
    return categories.filter((c) => allowed.has(c.id));
  }, [activeType, categories, items]);

  useEffect(() => {
    // When switching the top-level filter, reset the category pill to avoid “empty state” confusion.
    setActiveCategory(undefined);
  }, [activeType]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        if (!restaurantId) throw new Error("Missing restaurant context");

        const supabase = createBrowserSupabase();

        // Fetch menu items for this restaurant
        const { data: menuRows, error: menuError } = await supabase
          .from("menu_items")
          .select(
            "id, name, description, name_translations, description_translations, price, category, images, available, inventory_out_of_stock, tags"
          )
          .eq("restaurant_id", restaurantId)
          .eq("available", true)
          .order("name", { ascending: true });

        if (menuError) {
          throw menuError;
        }

        const mapped =
          menuRows?.map((row) => {
            const categoryLabel = row.category ? String(row.category) : undefined;
            const categoryId = categoryLabel
              ? categoryLabel.toLowerCase().replace(/\s+/g, "-")
              : undefined;

            const images = Array.isArray(row.images) ? row.images : [];
            const firstImage = images[0];

            const name = pickTranslatedText({
              locale,
              base: String(row.name),
              translations: (row as unknown as { name_translations?: unknown })
                .name_translations,
            });
            const desc = row.description
              ? pickTranslatedText({
                  locale,
                  base: String(row.description),
                  translations: (row as unknown as { description_translations?: unknown })
                    .description_translations,
                })
              : undefined;

            return {
              id: String(row.id),
              name,
              desc,
              price: Number(row.price ?? 0),
              image:
                typeof firstImage === "string" && !firstImage.startsWith("blob:")
                  ? firstImage
                  : undefined,
              categoryId,
              categoryLabel,
              outOfStock: Boolean((row as unknown as { inventory_out_of_stock?: boolean }).inventory_out_of_stock),
              tags: (row as unknown as { tags?: unknown }).tags,
            };
          }) ?? [];

        if (!cancelled) {
          setItems(mapped);
          // If the active category no longer exists (e.g. after load), reset it
          setActiveCategory((prev) =>
            prev && !mapped.some((m) => m.categoryId === prev) ? undefined : prev
          );
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Failed to load menu";
          setError(message);
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, locale]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      const matchesType =
        activeType === "all" ? true : classifyMenuType(it.categoryLabel) === activeType;
      const matchesCategory = !activeCategory || it.categoryId === activeCategory;
      const matchesSearch =
        !q ||
        it.name.toLowerCase().includes(q) ||
        (it.desc ? it.desc.toLowerCase().includes(q) : false);
      return matchesType && matchesCategory && matchesSearch;
    });
  }, [items, activeType, activeCategory, search]);

  return (
    <>
      <div className="px-4 pt-4 pb-24 bg-gradient-to-b from-[var(--menu-brand)]/10 via-background to-background">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu…"
              className="pl-9 h-11 rounded-2xl bg-card/80 backdrop-blur border shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Quick filters */}
          <div className="rounded-2xl border bg-card/80 backdrop-blur p-3 shadow-sm">
            <div className="text-xs font-medium text-muted-foreground px-1 pb-2">
              Filter
            </div>
            <MenuTypeTabs value={activeType} onChange={setActiveType} />
          </div>

          {/* Categories */}
          {categoriesForType.length > 0 && (
            <CategoryPills
              categories={categoriesForType}
              active={activeCategory}
              onChange={(id) => setActiveCategory(id || undefined)}
              allLabel="All"
            />
          )}

          {/* Items */}
          <div className="space-y-3">
            {loading && (
              <div className="text-center text-muted-foreground py-10">
                Loading menu…
              </div>
            )}

            {!loading && error && (
              <div className="text-center text-destructive py-10">{error}</div>
            )}

            {!loading && !error && filteredItems.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                No items match your search.
              </div>
            )}

            {!loading &&
              !error &&
              filteredItems.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </div>

      <CartBar />
    </>
  );
}
