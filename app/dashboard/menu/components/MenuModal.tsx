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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { getCurrency } from "@/lib/utils/currency";
import { X, Sparkles, Info, ImageIcon, Flame, Leaf, WheatOff, Plus } from "lucide-react";

import { useState, useEffect } from "react";
import { MenuItem, MenuCategory } from "../types";

const categories: MenuCategory[] = ["Starters", "Mains", "Drinks", "Desserts"];

export default function MenuModal({
  open,
  onClose,
  onSave,
  itemToEdit,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
  itemToEdit?: MenuItem;
  currency: string;
}) {
  const currencyMeta = getCurrency(currency);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameTranslations, setNameTranslations] = useState<Record<string, string>>(
    {}
  );
  const [descriptionTranslations, setDescriptionTranslations] = useState<
    Record<string, string>
  >({});
  const [price, setPrice] = useState("0");
  const [category, setCategory] = useState<MenuCategory>("Mains");
  const [available, setAvailable] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

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
      setPrice(String(itemToEdit.price ?? 0));
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
      setPrice("0");
      setCategory("Mains");
      setAvailable(true);
      setImages([]);
      setNewImageUrl("");
      setTags({ spicy: false, vegetarian: false, glutenFree: false });
      setVariants([]);
    }
    setFormError(null);
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
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Item name is required.");
      return;
    }

    const cleaned = price.trim().replace(",", ".");
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setFormError("Price must be a valid number (0 or higher).");
      return;
    }
    // Keep prices sane (and avoid accidental 1000000).
    if (parsed > 100_000) {
      setFormError("Price looks too high. Please double-check.");
      return;
    }

    onSave({
      id: itemToEdit ? itemToEdit.id : Date.now().toString(),
      name: trimmedName,
      description: description.trim(),
      nameTranslations,
      descriptionTranslations,
      price: Math.round(parsed * 100) / 100,
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
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-0"
      >
        <DialogHeader className="px-6 py-5 border-b">
          <DialogTitle className="text-xl sm:text-2xl font-semibold tracking-tight">
            {itemToEdit ? "Edit menu item" : "Add menu item"}
          </DialogTitle>
          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <Info className="h-4 w-4" />
            The first image (if provided) is what customers see in the menu.
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {/* Core fields */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-1">
              <Label>Item name *</Label>
              <Input
                placeholder="e.g., Chicken Shawarma Wrap"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Keep it short and recognizable. This is the main text customers scan.
              </p>
            </div>

            <div className="space-y-2 md:col-span-1">
              <Label>Category *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as MenuCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Categories help customers browse faster.
              </p>
            </div>

            <div className="space-y-2 md:col-span-1">
              <Label>Price *</Label>
              <div className="flex">
                <div className="px-3 rounded-l-md border border-r-0 bg-muted text-sm flex items-center gap-2">
                  <Badge variant="secondary">{currencyMeta.code}</Badge>
                  <span className="text-muted-foreground">{currencyMeta.symbol}</span>
                </div>
                <Input
                  inputMode="decimal"
                  placeholder="0.00"
                  className="rounded-l-none"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the base price customers pay (e.g. “12.50”). Discounts apply automatically.
              </p>
            </div>

            <div className="space-y-2 md:col-span-1">
              <Label>Visible to customers</Label>
              <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
                <div className="min-w-0">
                  <div className="font-medium">{available ? "Visible" : "Hidden"}</div>
                  <div className="text-xs text-muted-foreground">
                    Hide items that are sold out or not ready to serve.
                  </div>
                </div>
                <Switch checked={available} onCheckedChange={setAvailable} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Description</Label>
              <Button type="button" variant="outline" size="sm" onClick={generateDescription}>
                <Sparkles className="h-4 w-4 mr-2" />
                Example
              </Button>
            </div>
            <Textarea
              placeholder="Example: Toasted wrap with chicken, garlic sauce, pickles, and fries."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[110px]"
            />
            <p className="text-xs text-muted-foreground">
              Good descriptions reduce questions and wrong orders (mention allergens, spice level, key ingredients).
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Quick tags</Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTags((t) => ({ ...t, spicy: !t.spicy }))}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  tags.spicy ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted/40"
                )}
              >
                <Flame className="h-4 w-4" /> Spicy
              </button>
              <button
                type="button"
                onClick={() => setTags((t) => ({ ...t, vegetarian: !t.vegetarian }))}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  tags.vegetarian
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted/40"
                )}
              >
                <Leaf className="h-4 w-4" /> Vegetarian
              </button>
              <button
                type="button"
                onClick={() => setTags((t) => ({ ...t, glutenFree: !t.glutenFree }))}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  tags.glutenFree
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted/40"
                )}
              >
                <WheatOff className="h-4 w-4" /> Gluten‑free
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              These badges help customers decide quickly.
            </p>
          </div>

          {/* Images */}
          <div className="rounded-2xl border bg-muted/10 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <div className="font-semibold">Images</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste public image URLs. Recommended: a clear photo, 1200px wide, 16:9 or square.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="https://example.com/photos/shawarma.jpg"
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

            {images.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No images yet. You can add one later.
              </div>
            ) : (
              <div className="space-y-2">
                {images.map((img, idx) => (
                  <div
                    key={img}
                    className="flex items-center gap-3 rounded-xl border bg-background p-2"
                  >
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted border shrink-0 grid place-items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt="menu"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground truncate">{img}</div>
                      {idx === 0 && (
                        <div className="text-[11px] text-emerald-700 mt-1">Shown to customers</div>
                      )}
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

          {/* Variants */}
          <div className="space-y-3">
            <div>
              <Label>Variants (optional)</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Use variants for sizes or add-ons (e.g., “Small”, “Large”). Variant price replaces the base price.
              </p>
            </div>

            {variants.length > 0 && (
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_200px_auto] gap-2">
                    <Input
                      placeholder="Label (e.g., Large)"
                      value={v.label}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x))
                        )
                      }
                    />
                    <div className="flex">
                      <div className="px-3 rounded-l-md border border-r-0 bg-muted text-sm flex items-center">
                        {currencyMeta.symbol}
                      </div>
                      <Input
                        inputMode="decimal"
                        placeholder="0.00"
                        className="rounded-l-none"
                        value={String(v.price)}
                        onChange={(e) => {
                          const n = Number(e.target.value.replace(",", "."));
                          setVariants((prev) =>
                            prev.map((x, idx) => (idx === i ? { ...x, price: Number.isFinite(n) ? n : 0 } : x))
                          );
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => setVariants((p) => [...p, { label: "", price: 0 }])}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add variant
            </Button>
          </div>

          {/* Translations */}
          <Accordion type="single" collapsible>
            <AccordionItem value="translations">
              <AccordionTrigger>Translations (optional)</AccordionTrigger>
              <AccordionContent>
                <div className="rounded-xl border bg-muted/10 p-4 space-y-4">
                  <p className="text-xs text-muted-foreground">
                    These override what customers see when they switch languages.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Français (fr)</div>
                      <Input
                        placeholder="Name in French"
                        value={nameTranslations.fr ?? ""}
                        onChange={(e) => setNameTranslations((prev) => ({ ...prev, fr: e.target.value }))}
                      />
                      <Textarea
                        placeholder="Description in French"
                        value={descriptionTranslations.fr ?? ""}
                        onChange={(e) =>
                          setDescriptionTranslations((prev) => ({ ...prev, fr: e.target.value }))
                        }
                        className="min-h-[80px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Español (es)</div>
                      <Input
                        placeholder="Name in Spanish"
                        value={nameTranslations.es ?? ""}
                        onChange={(e) => setNameTranslations((prev) => ({ ...prev, es: e.target.value }))}
                      />
                      <Textarea
                        placeholder="Description in Spanish"
                        value={descriptionTranslations.es ?? ""}
                        onChange={(e) =>
                          setDescriptionTranslations((prev) => ({ ...prev, es: e.target.value }))
                        }
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-background">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {itemToEdit ? "Save changes" : "Create item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
