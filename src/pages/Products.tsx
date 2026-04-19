import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { listProducts } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import type { Product, Category } from "@/types/shop";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const search = params.get("search") || "";
  const category = params.get("category") || "all";
  const sort = params.get("sort") || "featured";
  const min = params.get("min") || "";
  const max = params.get("max") || "";

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (!v || v === "all" || v === "featured") next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    document.title = "Shop — XPOSE";
    listCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    listProducts({ search, category, sort, min: min ? Number(min) : undefined, max: max ? Number(max) : undefined })
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [search, category, sort, min, max]);

  const resultCount = products.length;

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
    <div className="container py-10 md:py-14">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Catalog</p>
        <h1 className="font-display font-bold text-4xl md:text-6xl tracking-tight">All products</h1>
        <p className="text-muted-foreground mt-2">Discover curated picks across every category.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setParam("search", e.target.value)}
            placeholder="Search products…"
            className="pl-10 h-11"
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-11 lg:hidden">
              <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader className="mb-6"><SheetTitle>Filters</SheetTitle></SheetHeader>
            {filterFields}
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold">Filters</h3>
              <span className="text-xs text-muted-foreground">{resultCount}</span>
            </div>
            {filterFields}
          </div>
        </aside>

        <div>
          <p className="text-sm text-muted-foreground mb-4">{resultCount} {resultCount === 1 ? "product" : "products"}</p>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-border">
              <p className="font-display font-semibold text-lg">No products match your filters</p>
              <p className="text-sm text-muted-foreground mt-1">Try clearing them and starting fresh.</p>
              <Button variant="outline" className="mt-5" onClick={() => setParams({}, { replace: true })}>Clear filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
