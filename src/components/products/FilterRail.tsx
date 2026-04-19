import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category } from "@/types/shop";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export interface Filters {
  search: string;
  category: string;
  sort: string;
  min: string;
  max: string;
}

interface Props {
  filters: Filters;
  setFilters: (f: Filters) => void;
  categories: Category[];
  resultCount: number;
}

function FilterFields({ filters, setFilters, categories }: Omit<Props, "resultCount">) {
  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Category</label>
        <Select value={filters.category || "all"} onValueChange={(v) => setFilters({ ...filters, category: v })}>
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
        <Select value={filters.sort || "featured"} onValueChange={(v) => setFilters({ ...filters, sort: v })}>
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
          <Input type="number" placeholder="Min" value={filters.min} onChange={(e) => setFilters({ ...filters, min: e.target.value })} />
          <Input type="number" placeholder="Max" value={filters.max} onChange={(e) => setFilters({ ...filters, max: e.target.value })} />
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setFilters({ search: filters.search, category: "all", sort: "featured", min: "", max: "" })}
      >
        <X className="h-4 w-4 mr-2" /> Clear filters
      </Button>
    </div>
  );
}

export default function FilterRail({ filters, setFilters, categories, resultCount }: Props) {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search products…"
            className="pl-10 h-11"
          />
        </div>
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-11 lg:hidden">
                <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader className="mb-6"><SheetTitle>Filters</SheetTitle></SheetHeader>
              <FilterFields filters={filters} setFilters={setFilters} categories={categories} />
            </SheetContent>
          </Sheet>
          <Select value={filters.sort || "featured"} onValueChange={(v) => setFilters({ ...filters, sort: v })}>
            <SelectTrigger className="h-11 w-44 lg:hidden"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-asc">Price ↑</SelectItem>
              <SelectItem value="price-desc">Price ↓</SelectItem>
              <SelectItem value="rating">Top rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold">Filters</h3>
              <span className="text-xs text-muted-foreground">{resultCount} results</span>
            </div>
            <FilterFields filters={filters} setFilters={setFilters} categories={categories} />
          </div>
        </aside>
        <div data-filter-results>
          <p className="text-sm text-muted-foreground mb-4 lg:hidden">{resultCount} results</p>
        </div>
      </div>
    </>
  );
}
