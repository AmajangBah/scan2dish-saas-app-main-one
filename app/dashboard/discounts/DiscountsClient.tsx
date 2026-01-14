"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatPrice, getCurrency } from "@/lib/utils/currency";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Discount } from "@/types/discounts";
import {
  createDiscount,
  toggleDiscountActive,
  deleteDiscount,
  type CreateDiscountInput,
} from "@/app/actions/discounts";

interface DiscountsClientProps {
  initialDiscounts: Discount[];
  currency: string;
  availableCategories: string[];
  availableItems: Array<{ id: string; name: string }>;
}

export default function DiscountsClient({
  initialDiscounts,
  currency,
  availableCategories,
  availableItems,
}: DiscountsClientProps) {
  const router = useRouter();
  const currencyMeta = getCurrency(currency);
  const [discounts, setDiscounts] = useState<Discount[]>(initialDiscounts);
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateDiscountInput>({
    discount_type: "percentage",
    discount_value: 10,
    apply_to: "all",
    category_id: null,
    item_id: null,
    is_active: true,
  });

  // Debug: Log received props
  console.log("DiscountsClient received:", {
    categoriesCount: availableCategories.length,
    categories: availableCategories,
    itemsCount: availableItems.length,
    items: availableItems,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createDiscount(formData);

      if (result.success && result.id) {
        const created: Discount = {
          id: result.id,
          restaurant_id: "",
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          apply_to: formData.apply_to,
          category_id: formData.category_id ?? null,
          item_id: formData.item_id ?? null,
          start_time: null,
          end_time: null,
          is_active: Boolean(formData.is_active),
        };
        setDiscounts((prev) => [created, ...prev]);
        setCreateOpen(false);
        // Reset form
        setFormData({
          discount_type: "percentage",
          discount_value: 10,
          apply_to: "all",
          category_id: null,
          item_id: null,
          is_active: true,
        });
        toast.success("Discount created");
        router.refresh();
      } else {
        setError(result.error || "Failed to create discount");
        toast.error(result.error || "Failed to create discount");
      }
    });
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setDiscounts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, is_active: !currentStatus } : d))
    );

    startTransition(async () => {
      const result = await toggleDiscountActive(id, !currentStatus);
      if (!result.success) {
        // Rollback on error
        setDiscounts((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, is_active: currentStatus } : d
          )
        );
        setError(result.error || "Failed to toggle discount");
        toast.error(result.error || "Failed to toggle discount");
      } else {
        router.refresh();
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount?")) return;

    // Optimistic delete
    const backup = discounts;
    setDiscounts((prev) => prev.filter((d) => d.id !== id));

    startTransition(async () => {
      const result = await deleteDiscount(id);
      if (!result.success) {
        // Rollback on error
        setDiscounts(backup);
        setError(result.error || "Failed to delete discount");
        toast.error(result.error || "Failed to delete discount");
      } else {
        toast.success("Discount deleted");
        router.refresh();
      }
    });
  };

  // Show empty state if no discounts
  if (discounts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Discounts</h1>
            <p className="text-gray-600 text-sm mt-1">
              Create and manage promotional discounts
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#C84501] hover:bg-orange-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Discount
          </Button>
        </div>

        <div className="bg-white rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">No Discounts Yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first discount to attract more customers and boost
            sales!
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#C84501] hover:bg-orange-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Discount
          </Button>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-xl rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Create Discount
              </DialogTitle>
            </DialogHeader>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Discount Type
                </label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={formData.discount_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_type: e.target
                        .value as CreateDiscountInput["discount_type"],
                    })
                  }
                >
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Discount Value
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  min="0"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_value: parseFloat(e.target.value),
                    })
                  }
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.discount_type === "percentage"
                    ? "Enter percentage (e.g., 10 for 10% off)"
                    : "Enter amount (e.g., 5 for D5 off)"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Apply To
                </label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={formData.apply_to}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      apply_to: e.target
                        .value as CreateDiscountInput["apply_to"],
                    })
                  }
                >
                  <option value="all">All Items</option>
                  <option value="category">Specific Category</option>
                  <option value="item">Specific Item</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                <label htmlFor="is_active" className="text-sm">
                  Activate immediately
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#C84501] hover:bg-orange-700"
                >
                  {isPending ? "Creating..." : "Create Discount"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Discounts</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage your promotional discounts
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[#C84501] hover:bg-orange-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Discount
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isPending && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
          Updating...
        </div>
      )}

      {/* Discounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {discounts.map((discount) => (
          <div
            key={discount.id}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-2xl font-bold text-[#C84501]">
                  {discount.discount_type === "percentage"
                    ? `${discount.discount_value}%`
                    : formatPrice(
                        Number(discount.discount_value || 0),
                        currency
                      )}{" "}
                  OFF
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {discount.apply_to === "all"
                    ? "All Items"
                    : discount.apply_to === "category"
                    ? "Category Discount"
                    : "Item Discount"}
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  discount.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {discount.is_active ? "Active" : "Inactive"}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggle(discount.id, discount.is_active)}
                className="flex-1"
              >
                {discount.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(discount.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Create Discount
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Discount Type
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                value={formData.discount_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount_type: e.target
                      .value as CreateDiscountInput["discount_type"],
                  })
                }
              >
                <option value="percentage">Percentage Off</option>
                <option value="fixed">Fixed Amount Off</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Discount Value
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                min="0"
                step="0.01"
                value={formData.discount_value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount_value: parseFloat(e.target.value),
                  })
                }
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.discount_type === "percentage"
                  ? "Enter percentage (e.g., 10 for 10% off)"
                  : `Enter amount (e.g., ${currencyMeta.symbol}5 off)`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Apply To</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={formData.apply_to}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    apply_to: e.target.value as "all" | "category" | "item",
                    category_id:
                      e.target.value === "category"
                        ? formData.category_id
                        : null,
                    item_id:
                      e.target.value === "item" ? formData.item_id : null,
                  })
                }
              >
                <option value="all">All Items</option>
                <option value="category">Specific Category</option>
                <option value="item">Specific Item</option>
              </select>
            </div>

            {formData.apply_to === "category" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={formData.category_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category_id: e.target.value || null,
                    })
                  }
                  required
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {availableCategories.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No categories found. Add categories to your menu first.
                  </p>
                )}
              </div>
            )}

            {formData.apply_to === "item" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Menu Item
                </label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={formData.item_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      item_id: e.target.value || null,
                    })
                  }
                  required
                >
                  <option value="" disabled>
                    Select an item
                  </option>
                  {availableItems.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ))}
                </select>
                {availableItems.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No menu items found. Add menu items first.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
              />
              <label htmlFor="is_active" className="text-sm">
                Activate immediately
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-[#C84501] hover:bg-orange-700"
              >
                {isPending ? "Creating..." : "Create Discount"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
