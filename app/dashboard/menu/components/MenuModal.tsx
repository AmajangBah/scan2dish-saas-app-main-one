"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Sparkles } from "lucide-react";

import { useState, useEffect } from "react";
import { MenuItem, MenuCategory } from "../types";

const categories: MenuCategory[] = ["Starters", "Mains", "Drinks", "Desserts"];

export default function MenuModal({
  open,
  onClose,
  onSave,
  itemToEdit,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
  itemToEdit?: MenuItem;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameTranslations, setNameTranslations] = useState<Record<string, string>>(
    {}
  );
  const [descriptionTranslations, setDescriptionTranslations] = useState<
    Record<string, string>
  >({});
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState<MenuCategory>("Mains");
  const [available, setAvailable] = useState(true);

  // Images (URLs only). Upload/crop is intentionally disabled until storage is wired.
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Nutrition tags
  const [tags, setTags] = useState({
    spicy: false,
    vegetarian: false,
    glutenFree: false,
  });

  // Variants
  const [variants, setVariants] = useState<{ label: string; price: number }[]>(
    []
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setDescription(itemToEdit.description);
      setNameTranslations(itemToEdit.nameTranslations || {});
      setDescriptionTranslations(itemToEdit.descriptionTranslations || {});
      setPrice(itemToEdit.price);
      setCategory(itemToEdit.category);
      setAvailable(itemToEdit.available);
      setImages((itemToEdit.images || []).filter((u) => typeof u === "string" && !u.startsWith("blob:")));
      setTags(
        itemToEdit.tags || {
          spicy: false,
          vegetarian: false,
          glutenFree: false,
        }
      );
      setVariants(itemToEdit.variants || []);
    } else {
      setName("");
      setDescription("");
      setNameTranslations({});
      setDescriptionTranslations({});
      setPrice(0);
      setCategory("Mains");
      setAvailable(true);
      setImages([]);
      setNewImageUrl("");
      setTags({ spicy: false, vegetarian: false, glutenFree: false });
      setVariants([]);
    }
  }, [itemToEdit, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // --------------------------------------------
  // AI DESCRIPTION GENERATION (stub)
  // --------------------------------------------

  const generateDescription = () => {
    setDescription(
      "A delicious, freshly prepared dish crafted with premium ingredients."
    );
  };

  // --------------------------------------------
  const handleSave = () => {
    onSave({
      id: itemToEdit ? itemToEdit.id : Date.now().toString(),
      name,
      description,
      nameTranslations,
      descriptionTranslations,
      price,
      category,
      available,
      images: images.filter((u) => typeof u === "string" && !u.startsWith("blob:")),
      tags,
      variants,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
    max-w-lg 
    w-full 
    max-h-[90vh] 
    overflow-y-auto 
    rounded-2xl
  "
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-bold">
            {itemToEdit ? "Edit Menu Item" : "Add Menu Item"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 flex flex-col gap-4">
          {/* NAME */}
          <Input
            placeholder="Item Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* DESCRIPTION */}
          <div className="relative">
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
            <Button
              size="sm"
              className="absolute top-2 right-2"
              onClick={generateDescription}
            >
              <Sparkles size={16} className="mr-1" /> AI
            </Button>
          </div>

          {/* TRANSLATIONS (OPTIONAL) */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <div className="text-sm font-semibold">Translations (optional)</div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Français (fr)
                </div>
                <Input
                  placeholder="Name (FR)"
                  value={nameTranslations.fr ?? ""}
                  onChange={(e) =>
                    setNameTranslations((prev) => ({ ...prev, fr: e.target.value }))
                  }
                />
                <Textarea
                  placeholder="Description (FR)"
                  value={descriptionTranslations.fr ?? ""}
                  onChange={(e) =>
                    setDescriptionTranslations((prev) => ({
                      ...prev,
                      fr: e.target.value,
                    }))
                  }
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Español (es)
                </div>
                <Input
                  placeholder="Name (ES)"
                  value={nameTranslations.es ?? ""}
                  onChange={(e) =>
                    setNameTranslations((prev) => ({ ...prev, es: e.target.value }))
                  }
                />
                <Textarea
                  placeholder="Description (ES)"
                  value={descriptionTranslations.es ?? ""}
                  onChange={(e) =>
                    setDescriptionTranslations((prev) => ({
                      ...prev,
                      es: e.target.value,
                    }))
                  }
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* PRICE */}
          <Input
            type="number"
            placeholder="Base Price"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />

          {/* CATEGORY */}
          <select
            className="p-2 border rounded-md"
            value={category}
            onChange={(e) => setCategory(e.target.value as MenuCategory)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          {/* AVAILABILITY */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            <span>Available</span>
          </div>

          {/* TAGS */}
          <div className="flex gap-3">
            {Object.entries({
              spicy: "Spicy 🌶️",
              vegetarian: "Vegetarian 🥗",
              glutenFree: "Gluten Free 🚫🌾",
            }).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-lg cursor-pointer border"
              >
                <input
                  type="checkbox"
                  checked={tags[key as keyof typeof tags]}
                  onChange={() =>
                    setTags((p) => ({
                      ...p,
                      [key]: !p[key as keyof typeof tags],
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>

          {/* DRAG & DROP UPLOAD */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <div className="text-sm font-semibold">Images</div>
            <div className="text-xs text-muted-foreground">
              Paste image URLs (e.g. from your website/CDN). Uploading isn’t enabled yet because Supabase Storage isn’t wired.
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="https://…"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const url = newImageUrl.trim();
                  if (!url) return;
                  if (url.startsWith("blob:")) return;
                  setImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
                  setNewImageUrl("");
                }}
              >
                Add URL
              </Button>
            </div>

            {images.length > 0 && (
              <div className="space-y-2">
                {images.map((img) => (
                  <div key={img} className="flex items-center gap-3 rounded-lg border bg-background p-2">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted border shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt="menu"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground truncate">{img}</div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setImages((prev) => prev.filter((u) => u !== img))}
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* VARIANTS */}
          <div>
            <p className="font-semibold mb-2">Variants</p>

            {variants.map((v, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  placeholder="Label"
                  value={v.label}
                  onChange={(e) =>
                    setVariants((prev) =>
                      prev.map((x, idx) =>
                        idx === i ? { ...x, label: e.target.value } : x
                      )
                    )
                  }
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={v.price}
                  onChange={(e) =>
                    setVariants((prev) =>
                      prev.map((x, idx) =>
                        idx === i ? { ...x, price: Number(e.target.value) } : x
                      )
                    )
                  }
                />
                <Button
                  variant="destructive"
                  onClick={() =>
                    setVariants((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  <X />
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                setVariants((p) => [...p, { label: "", price: 0 }])
              }
            >
              + Add Variant
            </Button>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {itemToEdit ? "Update Item" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
