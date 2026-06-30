import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useSalesRepSession } from "@/context/SalesRepSessionContext";
import { getSalesRepDisplayName } from "@/lib/salesRepSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Wordmark from "@/components/brand/Wordmark";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Shop" },
  { to: "/vendors", label: "Stores" },
  { to: "/flash-sale", label: "Flash Sale" },
  { to: "/categories", label: "Categories" },
  { to: "/track-order", label: "Track" },
];

export default function Header() {
  const { itemCount, openCart } = useCart();
  const { isSalesRepAuthenticated, salesRep, logout } = useSalesRepSession();
  const repDisplayName = getSalesRepDisplayName(salesRep);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [bumpKey, setBumpKey] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setBumpKey((k) => k + 1);
  }, [itemCount]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    navigate(`/products${q ? `?search=${encodeURIComponent(q)}` : ""}`);
    setSearchOpen(false);
    setMobileOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "glass shadow-soft" : "bg-background"
      )}
    >
      <div className="border-b border-white/10 bg-[#0b0f14] text-white">
        <div className="container flex h-7 items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wide sm:text-[11px]">
          <span className="truncate">M-Pesa till 711714</span>
          <div className="hidden items-center gap-5 sm:flex">
            <span>Retail and wholesale</span>
            <span>Live stock</span>
            <span>Private order tracking</span>
          </div>
          <span className="sm:hidden">Retail + wholesale</span>
        </div>
      </div>
      <div className="container flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <Link to="/" className="flex items-center" aria-label="XPOSE Distributors home">
          <Wordmark size="md" />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "relative py-1 text-sm font-medium transition-colors focus-visible:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent rounded-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {isSalesRepAuthenticated ? (
            <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={logout}>
              {repDisplayName} - Logout
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
              <Link to="/sales-rep/login">Rep login</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen((v) => !v)} aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={openCart}
            aria-label="Cart"
            className="relative"
            data-cart-button="true"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <motion.span
                key={bumpKey}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 rounded-full bg-accent text-accent-foreground text-[11px] font-bold grid place-items-center"
              >
                {itemCount}
              </motion.span>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border overflow-hidden"
          >
            <form onSubmit={submitSearch} className="container py-3 flex gap-2">
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, categories..."
                className="h-11"
              />
              <Button type="submit" className="h-11">Search</Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border overflow-hidden"
          >
            <div className="container py-4 grid gap-1">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary"
                    )
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              {isSalesRepAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary text-left"
                >
                  {repDisplayName} - Logout
                </button>
              ) : (
                <NavLink
                  to="/sales-rep/login"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary"
                    )
                  }
                >
                  Rep login
                </NavLink>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
