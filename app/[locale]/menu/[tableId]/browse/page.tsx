"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import CategoryPills from "../../components/CategoryPills";
import ProductCard from "../../components/ProductCard";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function BrowsePage() {
  const { tableId } = useParams();

  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        if (!tableId || typeof tableId !== "string") {
          setItems([]);
          setError("Invalid table ID");
          return;
        }

        const supabase = createBrowserSupabase();

        // 1) Resolve restaurant_id from the table_id (public-read allowed for active tables)
        const { data: tableRow, error: tableError } = await supabase
          .from("restaurant_tables")
          .select("restaurant_id")
          .eq("id", tableId)
          .single();

        if (tableError || !tableRow?.restaurant_id) {
          throw new Error("Table not found or inactive");
        }

        // 2) Fetch menu items for this restaurant
        const { data: menuRows, error: menuError } = await supabase
          .from("menu_items")
          .select("id, name, description, price, category, images, available")
          .eq("restaurant_id", tableRow.restaurant_id)
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

            return {
              id: String(row.id),
              name: String(row.name),
              desc: row.description ? String(row.description) : undefined,
              price: Number(row.price ?? 0),
              image: typeof firstImage === "string" ? firstImage : undefined,
              categoryId,
              categoryLabel,
            };
          }) ?? [];

        if (!cancelled) {
          setItems(mapped);
          // If the active category no longer exists (e.g. after load), reset it
          if (activeCategory && !mapped.some((m) => m.categoryId === activeCategory)) {
            setActiveCategory(undefined);
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      const matchesCategory = !activeCategory || it.categoryId === activeCategory;
      const matchesSearch =
        !q ||
        it.name.toLowerCase().includes(q) ||
        (it.desc ? it.desc.toLowerCase().includes(q) : false);
      return matchesCategory && matchesSearch;
    });
  }, [items, activeCategory, search]);

  return (
    <div className="pb-28 px-4 pt-4">
      <div className="max-w-xl mx-auto">
        {/* Search */}
        <div className="mb-4">
          <input
            placeholder="search"
            className="w-full p-3 rounded-xl bg-gray-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {categories.length > 0 && (
          <CategoryPills
            categories={categories}
            active={activeCategory}
            onChange={(id) => setActiveCategory(id)}
          />
        )}

        <div className="mt-4 space-y-4">
          {loading && (
            <div className="text-center text-gray-500 py-10">Loading menu...</div>
          )}

          {!loading && error && (
            <div className="text-center text-red-600 py-10">{error}</div>
          )}

          {!loading && !error && filteredItems.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              No menu items found.
            </div>
          )}

          {!loading &&
            !error &&
            filteredItems.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  );
}
