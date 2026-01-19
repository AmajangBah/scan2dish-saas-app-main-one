"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  UtensilsCrossed,
  ShoppingBag,
  Info,
  Sparkles,
  Clock,
} from "lucide-react";
import { useMenuRestaurant } from "../context/MenuRestaurantContext";
import type { Locale } from "@/i18n";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "customer.welcome": "Welcome to",
    "customer.quickTip": "Quick tip",
    "customer.useFilters": "Use filters like Food 🍽️, Desserts 🍰, Drinks 🥤",
    "customer.wrongTable":
      "If this doesn't match your table, please ask staff for the correct QR.",
    "customer.addItems": "Add items",
    "customer.browseCategories": 'Browse categories and tap "Add".',
    "customer.reviewCart": "Review cart",
    "customer.checkQuantities": "Check quantities anytime.",
    "customer.sendToKitchen": "Send to kitchen",
    "customer.placeOrderReady": "Place your order when ready.",
    "customer.letsEat": "Let's eat",
  },
  fr: {
    "customer.welcome": "Bienvenue à",
    "customer.quickTip": "Conseil rapide",
    "customer.useFilters":
      "Utilisez les filtres comme Nourriture 🍽️, Desserts 🍰, Boissons 🥤",
    "customer.wrongTable":
      "Si cela ne correspond pas à votre table, veuillez demander au personnel le code QR correct.",
    "customer.addItems": "Ajouter des articles",
    "customer.browseCategories":
      'Parcourez les catégories et appuyez sur "Ajouter".',
    "customer.reviewCart": "Examiner le panier",
    "customer.checkQuantities": "Vérifiez les quantités à tout moment.",
    "customer.sendToKitchen": "Envoyer à la cuisine",
    "customer.placeOrderReady": "Passez votre commande quand vous êtes prêt.",
    "customer.letsEat": "Allons manger",
  },
  es: {
    "customer.welcome": "Bienvenido a",
    "customer.quickTip": "Consejo rápido",
    "customer.useFilters":
      "Utiliza filtros como Comida 🍽️, Postres 🍰, Bebidas 🥤",
    "customer.wrongTable":
      "Si esto no coincide con tu mesa, pide al personal el código QR correcto.",
    "customer.addItems": "Agregar artículos",
    "customer.browseCategories": 'Explora las categorías y presiona "Agregar".',
    "customer.reviewCart": "Revisar carrito",
    "customer.checkQuantities": "Verifica las cantidades en cualquier momento.",
    "customer.sendToKitchen": "Enviar a la cocina",
    "customer.placeOrderReady": "Realiza tu pedido cuando estés listo.",
    "customer.letsEat": "¡A comer!",
  },
};

export default function MenuIntroPage() {
  const params = useParams();
  const locale = (
    typeof params.locale === "string" ? params.locale : "en"
  ) as Locale;
  const tableId = typeof params.tableId === "string" ? params.tableId : null;
  const base = `/${locale}`;
  const { restaurantName, tableNumber, tableSlug } = useMenuRestaurant();

  const browseHref = tableSlug
    ? `${base}/menu/${tableSlug}`
    : `${base}/menu/${tableId}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="rounded-3xl border bg-card/80 backdrop-blur shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-2xl bg-(--menu-brand)/10 grid place-items-center border border-(--menu-brand)/15">
                <UtensilsCrossed className="h-5 w-5 text-(--menu-brand)" />
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground rounded-full border bg-muted/30 px-3 py-1">
                  🍽️ Table {tableNumber ?? tableId ?? ""}
                </div>
                <h1 className="text-2xl font-semibold tracking-tight mt-3">
                  {translations[locale]["customer.welcome"] || "Welcome to"}{" "}
                  {restaurantName} 👋
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Tap, filter, and order in seconds — no waiting.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <Card className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">
                      {translations[locale]["customer.quickTip"] || "Quick tip"}
                    </div>
                    <div className="text-sm font-semibold">
                      {translations[locale]["customer.useFilters"] ||
                        "Use filters"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {translations[locale]["customer.wrongTable"] ||
                        "Check table"}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-white/60 border grid place-items-center shrink-0">
                    <Sparkles className="h-5 w-5 text-(--menu-brand)" />
                  </div>
                </div>
              </Card>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ShoppingBag className="h-4 w-4 text-(--menu-brand)" />
                    {translations[locale]["customer.addItems"] || "Add items"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {translations[locale]["customer.browseCategories"] ||
                      "Browse categories"}
                  </p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Info className="h-4 w-4 text-(--menu-brand)" />
                    {translations[locale]["customer.reviewCart"] ||
                      "Review cart"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {translations[locale]["customer.checkQuantities"] ||
                      "Check quantities"}
                  </p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4 text-(--menu-brand)" />
                    {translations[locale]["customer.sendToKitchen"] ||
                      "Send to kitchen"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {translations[locale]["customer.placeOrderReady"] ||
                      "Place order when ready"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="rounded-2xl bg-(--menu-brand) text-white hover:bg-(--menu-brand)/90"
              >
                <Link href={browseHref}>
                  {translations[locale]["customer.letsEat"] || "Let's eat"}{" "}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
