export type MenuType = "all" | "food" | "dessert" | "drink";

export function classifyMenuType(categoryLabel?: string): Exclude<MenuType, "all"> {
  const s = (categoryLabel ?? "").toLowerCase();
  if (
    /(drink|beverage|juice|soda|soft|cocktail|mocktail|wine|beer|coffee|tea)/.test(s)
  ) {
    return "drink";
  }
  if (/(dessert|sweet|cake|ice cream|pastry|pudding|chocolate)/.test(s)) {
    return "dessert";
  }
  return "food";
}

/**
 * Supabase `.or()` filter for a best-effort category match.
 * Keep this conservative: it’s only for UI recommendations, not pricing/ordering logic.
 */
export function supabaseCategoryOrForMenuType(type: Exclude<MenuType, "all">) {
  if (type === "drink") {
    return [
      "category.ilike.%drink%",
      "category.ilike.%beverage%",
      "category.ilike.%juice%",
      "category.ilike.%soda%",
      "category.ilike.%soft%",
      "category.ilike.%cocktail%",
      "category.ilike.%mocktail%",
      "category.ilike.%wine%",
      "category.ilike.%beer%",
      "category.ilike.%coffee%",
      "category.ilike.%tea%",
    ].join(",");
  }
  if (type === "dessert") {
    return [
      "category.ilike.%dessert%",
      "category.ilike.%sweet%",
      "category.ilike.%cake%",
      "category.ilike.%ice cream%",
      "category.ilike.%pastry%",
      "category.ilike.%pudding%",
      "category.ilike.%chocolate%",
    ].join(",");
  }

  // Food is too broad to match well using category text; we intentionally avoid it here.
  return "category.is.not.null";
}

