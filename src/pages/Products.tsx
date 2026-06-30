import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  Clock3,
  PackageCheck,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { listStorefrontProducts } from "@/lib/api/products";
import { listStorefrontCategories } from "@/lib/api/categories";
import type { Product } from "@/types/shop";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function useDebouncedValue<T>(value: T, delayMs = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}

function getProductPrice(product: Product) {
  return Number(product.discounted_price || product.retail_price || product.price || 0);
}

function hasFlashDeal(product: Product) {
  return Boolean(product.is_flash || product.discounted_price != null);
}

function getStockState(product: Product) {
  const rawStockQty = product.current_stock ?? product.stock;
  const stockQty = Number(rawStockQty);
  const hasStockQty = rawStockQty !== undefined && rawStockQty !== null && rawStockQty !== "" && Number.isFinite(stockQty);
  const minQty = Math.max(1, Number(product.min_order_qty || 1));
  const stockStatus = String(product.stock_status_override || product.stock_status || "").toLowerCase();

  if (stockStatus === "out_of_stock" || (hasStockQty && stockQty <= 0) || (hasStockQty && stockQty > 0 && stockQty < minQty)) {
    return "out_of_stock";
  }

  if (
    stockStatus === "limited_stock" ||
    stockStatus === "low_stock" ||
    (hasStockQty && stockQty <= Math.max(minQty, 10))
  ) {
    return "limited_stock";
  }

  return "in_stock";
}

function getPrimaryUnit(product: Product) {
  return product.selling_unit_label || product.price_tiers?.[0]?.unit || "piece";
}

function ProductStage({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  const cards = products.slice(0, 3);

  return (
    <div className="relative h-[190px] overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0_48%,rgba(255,255,255,.09)_49%,transparent_50%)] bg-[size:30px_30px] opacity-25" />
      <p className="absolute left-3 top-2 text-[10px] font-black uppercase tracking-wider text-accent">
        Available now
      </p>
      <div className="absolute inset-x-3 bottom-3 flex items-end justify-center gap-2">
        {cards.map((product, index) => {
          const limited = getStockState(product) === "limited_stock";
          return (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className={`group w-[112px] flex-none rounded-lg bg-white p-2 text-slate-950 shadow-[0_16px_45px_rgba(0,0,0,0.28)] transition-transform hover:-translate-y-1 ${index === 1 ? "-translate-y-2" : ""}`}
            >
              <div className="flex h-20 items-center justify-center rounded-md bg-slate-50">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="h-full w-full object-contain p-1.5" />
                ) : (
                  <Boxes className="h-8 w-8 text-accent" />
                )}
              </div>
              <p className="mt-2 line-clamp-1 text-xs font-black">{product.name}</p>
              <div className="mt-1 flex items-center justify-between gap-1 text-[9px] font-bold">
                <span className="truncate text-slate-500">{getPrimaryUnit(product)}</span>
                <span className={limited ? "text-amber-600" : "text-emerald-600"}>{limited ? "Limited" : "Ready"}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Products() {
  const [params, setParams] = useSearchParams();

  const search = params.get("search") || "";
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const category = params.get("category") || "all";
  const sort = params.get("sort") || "featured";
  const min = params.get("min") || "";
  const max = params.get("max") || "";
  const flashOnly = params.get("flash") === "1";
  const stockFilter = params.get("stock") || "";
  const page = Math.max(1, Number(params.get("page") || 1));
  const pageSize = 24;

  const setParam = (k: string, v: string, options: { resetPage?: boolean } = {}) => {
    const next = new URLSearchParams(params);
    if (!v || v === "all" || v === "featured") next.delete(k);
    else next.set(k, v);
    if (options.resetPage !== false && k !== "page") next.delete("page");
    setParams(next, { replace: true });
  };

  useEffect(() => {
    document.title = "Shop - XPOSE";
  }, []);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch === search) return;
    setParam("search", debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const categoriesQuery = useQuery({
    queryKey: ["storefront-categories"],
    queryFn: listStorefrontCategories,
    staleTime: 5 * 60 * 1000,
  });

  const productsQuery = useQuery({
    queryKey: [
      "storefront-products",
      {
        search,
        category,
        sort,
        min,
        max,
        flash: flashOnly ? "1" : "",
        stock: stockFilter,
        page,
        limit: pageSize,
      },
    ],
    queryFn: () =>
      listStorefrontProducts({
        search,
        category,
        sort,
        min: min ? Number(min) : undefined,
        max: max ? Number(max) : undefined,
        flash: flashOnly ? "1" : undefined,
        stock: stockFilter || undefined,
        page,
        limit: pageSize,
      }),
    staleTime: 20 * 1000,
  });

  const products = productsQuery.data?.products || [];
  const categories = categoriesQuery.data || [];
  const pagination = productsQuery.data?.pagination || {
    page,
    limit: pageSize,
    total: products.length,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };
  const loading = productsQuery.isLoading;
  const isRefreshing = productsQuery.isFetching && !productsQuery.isLoading;

  const visibleProducts = useMemo(() => {
    return products;
  }, [products]);

  const resultCount = pagination.total || visibleProducts.length;
  const selectedCategory = categories.find((item) => String(item.id) === category);
  const flashCount = products.filter(hasFlashDeal).length;
  const limitedCount = products.filter((product) => getStockState(product) === "limited_stock").length;
  const readyCount = products.filter((product) => getStockState(product) !== "out_of_stock").length;
  const categoryCount = categories.length;
  const stageProducts = useMemo(() => {
    const source = visibleProducts.length ? visibleProducts : products;
    return source
      .filter((product) => getStockState(product) !== "out_of_stock")
      .sort((a, b) => {
        const aScore = (hasFlashDeal(a) ? 3 : 0) + (getStockState(a) === "limited_stock" ? 2 : 0);
        const bScore = (hasFlashDeal(b) ? 3 : 0) + (getStockState(b) === "limited_stock" ? 2 : 0);
        return bScore - aScore;
      })
      .slice(0, 3);
  }, [products, visibleProducts]);

  const headline = flashOnly
    ? "Flash deals ready to order"
    : search.trim()
      ? `Stock matching "${search.trim()}"`
      : selectedCategory
        ? `${selectedCategory.name} stock`
        : "Shop XPOSE stock";

  const quickActions = [
    {
      label: "Flash deals",
      icon: BadgePercent,
      action: () => setParam("flash", flashOnly ? "" : "1"),
      active: flashOnly,
    },
    {
      label: "Best value",
      icon: Boxes,
      action: () => setParam("sort", sort === "price-asc" ? "" : "price-asc"),
      active: sort === "price-asc",
    },
    {
      label: "Limited stock",
      icon: Clock3,
      action: () => setParam("stock", stockFilter === "limited" ? "" : "limited"),
      active: stockFilter === "limited",
    },
  ];


  const filterFields = (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Category</label>
        <Select value={category} onValueChange={(v) => setParam("category", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Sort by</label>
        <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="price-asc">Price: low to high</SelectItem>
            <SelectItem value="price-desc">Price: high to low</SelectItem>
            <SelectItem value="rating">Top rated</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Price range (KES)</label>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="Min" value={min} onChange={(e) => setParam("min", e.target.value)} />
          <Input type="number" placeholder="Max" value={max} onChange={(e) => setParam("max", e.target.value)} />
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={() => setParams({}, { replace: true })}>
        <X className="h-4 w-4 mr-2" /> Clear filters
      </Button>
    </div>
  );

  return (
    <div className="container py-6 md:py-8">
      <section className="mb-4 overflow-hidden rounded-xl border border-border bg-[#0b0f14] text-white shadow-soft">
        <div className="grid items-stretch lg:grid-cols-[minmax(0,1.35fr)_390px]">
          <div className="relative overflow-hidden p-5 sm:p-6">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,91,46,0.16)_0,transparent_34%),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:auto,42px_42px,42px_42px]" />
            <div className="relative">
              <p className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-accent">
                <PackageCheck className="h-3.5 w-3.5" />
                XPOSE catalogue
              </p>
              <h1 className="max-w-2xl font-display text-3xl font-black leading-none sm:text-4xl">
                {headline}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                Search retail items, wholesale packs and current deals.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {quickActions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.action}
                      className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-bold transition-colors ${
                        item.active
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-white/15 bg-white/5 text-white hover:border-accent/60"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
                <Link
                  to="/flash-sale"
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-sm font-bold text-white transition-colors hover:border-accent/60"
                >
                  Deal room <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="hidden border-l border-white/10 bg-white/[0.025] px-3 lg:block">
            <ProductStage products={stageProducts} />
          </div>
        </div>
      </section>

      <div className="sticky top-24 z-30 mb-5 rounded-xl border border-border bg-card/95 p-3 shadow-soft backdrop-blur md:p-4 lg:static">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by product, SKU, category, or selling unit"
              className="h-12 rounded-xl pl-11 text-base"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={flashOnly ? "default" : "outline"} className="h-12" onClick={() => setParam("flash", flashOnly ? "" : "1")}>
              <BadgePercent className="mr-2 h-4 w-4" /> Flash
            </Button>
            <Button variant="outline" className="h-12" onClick={() => setParam("sort", "price-asc")}>
              <TrendingUp className="mr-2 h-4 w-4" /> Value
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 lg:hidden">
                  <SlidersHorizontal className="mr-2 h-4 w-4" /> Refine
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader className="mb-6">
                  <SheetTitle>Refine</SheetTitle>
                  <SheetDescription className="sr-only">
                    Filter products by category, sort order, and price range.
                  </SheetDescription>
                </SheetHeader>
                {filterFields}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold">Refine</h3>
              <span className="text-xs text-muted-foreground">{resultCount}</span>
            </div>
            {filterFields}
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-muted-foreground">
              {resultCount.toLocaleString()} {resultCount === 1 ? "product" : "products"}
              {isRefreshing ? <span className="ml-2 text-accent">Updating...</span> : null}
            </p>
            <div className="hidden items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground sm:inline-flex">
              <Truck className="h-3.5 w-3.5 text-accent" />
              Route and home orders ready
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="overflow-hidden rounded-2xl border border-dashed border-border bg-card">
              <div className="grid gap-6 p-7 md:grid-cols-[1fr_280px] md:p-8">
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-accent">No live stock matched</p>
                  <h2 className="mt-2 text-2xl font-black">
                    {selectedCategory ? `${selectedCategory.name} is waiting on stock` : "Try a sharper search"}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                    Search by SKU, product name, category, or selling unit. You can also jump to flash deals or clear filters.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button onClick={() => setParams({}, { replace: true })}>Show all stock</Button>
                    <Button variant="outline" asChild>
                      <Link to="/flash-sale">Flash deals</Link>
                    </Button>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-secondary p-5">
                  <p className="text-sm font-black">Quick checks</p>
                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <span>Ready products: {readyCount.toLocaleString()}</span>
                    <span>Flash deals: {flashCount.toLocaleString()}</span>
                    <span>Limited stock: {limitedCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
                {visibleProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft sm:flex-row">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Page {pagination.page.toLocaleString()} of {pagination.totalPages.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      disabled={!pagination.hasPrev || productsQuery.isFetching}
                      onClick={() => setParam("page", String(Math.max(1, pagination.page - 1)), { resetPage: false })}
                    >
                      Previous
                    </Button>
                    <Button
                      disabled={!pagination.hasNext || productsQuery.isFetching}
                      onClick={() => setParam("page", String(pagination.page + 1), { resetPage: false })}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
