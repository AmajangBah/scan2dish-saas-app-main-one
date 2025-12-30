"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  createIngredient,
  updateIngredient,
  deleteIngredient,
  adjustIngredientStock,
  upsertMenuItemRecipe,
} from "@/app/actions/inventory";

type Ingredient = {
  id: string;
  name: string;
  unit: string;
  current_quantity: number;
  min_threshold: number;
  cost_per_unit: number | null;
};

type MenuItem = {
  id: string;
  name: string;
  category: string | null;
  available: boolean;
  inventory_out_of_stock: boolean;
};

type RecipeRow = {
  menu_item_id: string;
  ingredient_id: string;
  quantity_per_item: number;
};

type InventoryTx = {
  id: string;
  ingredient_id: string;
  delta: number;
  reason: string;
  order_id: string | null;
  note: string | null;
  created_at: string;
};

export default function InventoryClient({
  restaurantId,
  ingredients,
  menuItems,
  recipeRows,
  transactions,
}: {
  restaurantId: string;
  ingredients: Ingredient[];
  menuItems: MenuItem[];
  recipeRows: RecipeRow[];
  transactions: InventoryTx[];
}) {
  const [view, setView] = useState<"ingredients" | "recipes" | "logs">("ingredients");
  const [search, setSearch] = useState("");

  const ingredientById = useMemo(() => {
    const map = new Map<string, Ingredient>();
    for (const i of ingredients) map.set(i.id, i);
    return map;
  }, [ingredients]);

  const lowStockCount = useMemo(
    () => ingredients.filter((i) => i.current_quantity <= i.min_threshold).length,
    [ingredients]
  );

  const filteredIngredients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter((i) => i.name.toLowerCase().includes(q));
  }, [ingredients, search]);

  // Create/Edit ingredient modal
  const [ingredientOpen, setIngredientOpen] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const editingIngredient = editingIngredientId
    ? ingredientById.get(editingIngredientId) ?? null
    : null;

  const [formName, setFormName] = useState("");
  const [formUnit, setFormUnit] = useState("pcs");
  const [formQty, setFormQty] = useState<number>(0);
  const [formMin, setFormMin] = useState<number>(0);
  const [formCost, setFormCost] = useState<string>("");
  const [saving, setSaving] = useState(false);

  function openCreateIngredient() {
    setEditingIngredientId(null);
    setFormName("");
    setFormUnit("pcs");
    setFormQty(0);
    setFormMin(0);
    setFormCost("");
    setIngredientOpen(true);
  }

  function openEditIngredient(id: string) {
    const it = ingredientById.get(id);
    if (!it) return;
    setEditingIngredientId(id);
    setFormName(it.name);
    setFormUnit(it.unit);
    setFormQty(it.current_quantity);
    setFormMin(it.min_threshold);
    setFormCost(it.cost_per_unit == null ? "" : String(it.cost_per_unit));
    setIngredientOpen(true);
  }

  async function saveIngredient() {
    setSaving(true);
    try {
      const payload = {
        name: formName,
        unit: formUnit,
        current_quantity: Number(formQty),
        min_threshold: Number(formMin),
        cost_per_unit: formCost.trim() ? Number(formCost) : null,
      };

      const res = editingIngredientId
        ? await updateIngredient(editingIngredientId, payload)
        : await createIngredient(payload);

      if (!res.success) throw new Error(res.error || "Failed to save");
      toast.success(editingIngredientId ? "Ingredient updated" : "Ingredient created");
      setIngredientOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  // Adjust stock modal
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustIngredientId, setAdjustIngredientId] = useState<string | null>(null);
  const [adjustReason, setAdjustReason] = useState<"restock" | "adjustment">("restock");
  const [adjustDelta, setAdjustDelta] = useState<string>("");
  const [adjustNote, setAdjustNote] = useState("");

  function openAdjust(id: string) {
    setAdjustIngredientId(id);
    setAdjustReason("restock");
    setAdjustDelta("");
    setAdjustNote("");
    setAdjustOpen(true);
  }

  async function submitAdjust() {
    if (!adjustIngredientId) return;
    setSaving(true);
    try {
      const delta = Number(adjustDelta);
      if (!Number.isFinite(delta) || delta === 0) throw new Error("Enter a non-zero amount");
      const res = await adjustIngredientStock({
        ingredient_id: adjustIngredientId,
        delta,
        reason: adjustReason,
        note: adjustNote.trim() ? adjustNote.trim() : null,
      });
      if (!res.success) throw new Error(res.error || "Failed to adjust");
      toast.success("Stock adjusted");
      setAdjustOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  // Recipe modal
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipeMenuItemId, setRecipeMenuItemId] = useState<string | null>(null);
  const [recipeRowsLocal, setRecipeRowsLocal] = useState<
    Array<{ ingredient_id: string; quantity_per_item: string }>
  >([]);

  function openRecipe(menuItemId: string) {
    setRecipeMenuItemId(menuItemId);
    const existing = recipeRows.filter((r) => r.menu_item_id === menuItemId);
    setRecipeRowsLocal(
      existing.map((r) => ({
        ingredient_id: r.ingredient_id,
        quantity_per_item: String(r.quantity_per_item),
      }))
    );
    setRecipeOpen(true);
  }

  function addRecipeRow() {
    const first = ingredients[0]?.id;
    setRecipeRowsLocal((prev) => [
      ...prev,
      { ingredient_id: first ?? "", quantity_per_item: "1" },
    ]);
  }

  async function saveRecipe() {
    if (!recipeMenuItemId) return;
    setSaving(true);
    try {
      const rows = recipeRowsLocal
        .filter((r) => r.ingredient_id && Number(r.quantity_per_item) > 0)
        .map((r) => ({
          ingredient_id: r.ingredient_id,
          quantity_per_item: Number(r.quantity_per_item),
        }));

      const res = await upsertMenuItemRecipe({
        menu_item_id: recipeMenuItemId,
        rows,
      });
      if (!res.success) throw new Error(res.error || "Failed to save recipe");
      toast.success("Recipe saved");
      setRecipeOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Inventory
          </h1>
          <p className="text-sm text-muted-foreground">
            Track ingredients, recipes, and stock changes.{" "}
            {lowStockCount > 0 ? (
              <span className="text-destructive font-medium">
                {lowStockCount} low stock
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">All good</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={view === "ingredients" ? "default" : "outline"}
            onClick={() => setView("ingredients")}
          >
            Ingredients
          </Button>
          <Button
            variant={view === "recipes" ? "default" : "outline"}
            onClick={() => setView("recipes")}
          >
            Recipes
          </Button>
          <Button
            variant={view === "logs" ? "default" : "outline"}
            onClick={() => setView("logs")}
          >
            Logs
          </Button>
        </div>
      </div>

      {view === "ingredients" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-sm">
              <Input
                placeholder="Search ingredients…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={openCreateIngredient}>Add ingredient</Button>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Ingredient</th>
                    <th className="px-4 py-3 font-medium">Unit</th>
                    <th className="px-4 py-3 font-medium text-right">In stock</th>
                    <th className="px-4 py-3 font-medium text-right">Min</th>
                    <th className="px-4 py-3 font-medium text-right">Cost</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredIngredients.map((i) => {
                    const low = i.current_quantity <= i.min_threshold;
                    return (
                      <tr key={i.id} className={low ? "bg-destructive/5" : ""}>
                        <td className="px-4 py-3 font-medium">{i.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{i.unit}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {i.current_quantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {i.min_threshold.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {i.cost_per_unit == null ? "—" : i.cost_per_unit.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openAdjust(i.id)}>
                              Adjust
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEditIngredient(i.id)}>
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                              onClick={async () => {
                                if (!confirm("Delete this ingredient? This also removes it from recipes.")) return;
                                const res = await deleteIngredient(i.id);
                                if (res.success) toast.success("Ingredient deleted");
                                else toast.error(res.error || "Failed");
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredIngredients.length === 0 && (
                    <tr>
                      <td className="px-4 py-10 text-center text-muted-foreground" colSpan={6}>
                        No ingredients found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {view === "recipes" && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">
              Recipes connect menu items to ingredients. Out-of-stock items are blocked automatically.
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Menu item</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Recipe</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {menuItems.map((m) => {
                    const rows = recipeRows.filter((r) => r.menu_item_id === m.id);
                    const status = !m.available
                      ? "Manually unavailable"
                      : m.inventory_out_of_stock
                      ? "Out of stock"
                      : "Available";
                    return (
                      <tr key={m.id}>
                        <td className="px-4 py-3 font-medium">{m.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.category ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              status === "Available"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : status === "Out of stock"
                                ? "bg-destructive/10 text-destructive border border-destructive/15"
                                : "bg-muted text-muted-foreground border"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end items-center gap-2">
                            <div className="text-xs text-muted-foreground">
                              {rows.length > 0 ? `${rows.length} ingredient(s)` : "No recipe"}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => openRecipe(m.id)}>
                              Edit recipe
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {view === "logs" && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Ingredient</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 font-medium text-right">Δ</th>
                    <th className="px-4 py-3 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((t) => {
                    const ing = ingredientById.get(t.ingredient_id);
                    return (
                      <tr key={t.id}>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(t.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {ing?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{t.reason}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={t.delta < 0 ? "text-destructive" : "text-emerald-700"}>
                            {t.delta < 0 ? "" : "+"}
                            {t.delta}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{t.note ?? "—"}</td>
                      </tr>
                    );
                  })}
                  {transactions.length === 0 && (
                    <tr>
                      <td className="px-4 py-10 text-center text-muted-foreground" colSpan={5}>
                        No inventory activity yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Ingredient modal */}
      <Dialog open={ingredientOpen} onOpenChange={setIngredientOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingIngredient ? "Edit ingredient" : "Add ingredient"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Unit</Label>
              <Input value={formUnit} onChange={(e) => setFormUnit(e.target.value)} placeholder="e.g., g, kg, pcs, ml" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Current stock</Label>
                <Input
                  inputMode="decimal"
                  value={String(formQty)}
                  onChange={(e) => setFormQty(Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Low-stock threshold</Label>
                <Input
                  inputMode="decimal"
                  value={String(formMin)}
                  onChange={(e) => setFormMin(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Cost per unit (optional)</Label>
              <Input
                inputMode="decimal"
                value={formCost}
                onChange={(e) => setFormCost(e.target.value)}
                placeholder="e.g., 2.50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIngredientOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveIngredient} disabled={saving || !formName.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjust modal */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adjust stock</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="text-sm text-muted-foreground">
              Add stock with a positive number, reduce stock with a negative number.
            </div>

            <div className="grid gap-2">
              <Label>Reason</Label>
              <Select value={adjustReason} onValueChange={(v) => setAdjustReason(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Restock</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Amount (Δ)</Label>
              <Input
                inputMode="decimal"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(e.target.value)}
                placeholder="e.g., 10 or -2"
              />
            </div>

            <div className="grid gap-2">
              <Label>Note (optional)</Label>
              <Textarea value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAdjust} disabled={saving || !adjustIngredientId}>
              {saving ? "Saving…" : "Apply"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipe modal */}
      <Dialog open={recipeOpen} onOpenChange={setRecipeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit recipe</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Define how much of each ingredient is consumed for one menu item.
            </div>

            <div className="space-y-2">
              {recipeRowsLocal.map((r, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-7">
                    <Label className="text-xs">Ingredient</Label>
                    <Select
                      value={r.ingredient_id}
                      onValueChange={(v) =>
                        setRecipeRowsLocal((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, ingredient_id: v } : x))
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name} ({i.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-4">
                    <Label className="text-xs">Qty / item</Label>
                    <Input
                      inputMode="decimal"
                      value={r.quantity_per_item}
                      onChange={(e) =>
                        setRecipeRowsLocal((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, quantity_per_item: e.target.value } : x
                          )
                        )
                      }
                    />
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() =>
                        setRecipeRowsLocal((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={addRecipeRow}>
                Add ingredient
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRecipeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRecipe} disabled={saving || !recipeMenuItemId}>
              {saving ? "Saving…" : "Save recipe"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

