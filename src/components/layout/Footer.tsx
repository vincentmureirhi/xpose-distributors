import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook } from "lucide-react";
import Wordmark from "@/components/brand/Wordmark";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/30">
      <div className="container py-16 grid gap-12 md:grid-cols-4">
        <div>
          <Link to="/" className="inline-flex mb-4">
            <Wordmark size="md" />
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A hybrid distributor where wholesale meets retail, with sharp pricing for everyday trade.
          </p>
          <div className="flex gap-2 mt-5">
            {[Instagram, Twitter, Facebook].map((Icon, i) => (
              <a key={i} href="#" className="h-9 w-9 rounded-full grid place-items-center bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-4 text-sm">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/products" className="hover:text-foreground">All products</Link></li>
            <li><Link to="/vendors" className="hover:text-foreground">Verified stores</Link></li>
            <li><Link to="/categories" className="hover:text-foreground">Categories</Link></li>
            <li><Link to="/flash-sale" className="hover:text-foreground">Flash Sales</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-4 text-sm">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/track-order" className="hover:text-foreground">Track order</Link></li>
            <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">Terms &amp; Conditions</Link></li>
            <li><a href="https://wa.me/254701377869" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Contact via WhatsApp</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-4 text-sm">Business</h4>
          <p className="text-sm text-muted-foreground mb-3">Apply to sell verified products through XPOSE.</p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/sell-on-xpose"
              className="inline-flex h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 items-center"
            >
              Sell on XPOSE
            </Link>
            <Link
              to="/vendor/login"
              className="inline-flex h-10 px-4 rounded-md border border-border bg-background text-sm font-medium hover:bg-secondary items-center"
            >
              Vendor login
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container py-5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>Copyright {new Date().getFullYear()} XPOSE Distributors. All rights reserved.</p>
          <p>M-Pesa Till 711714. Free shipping for orders over KES 75,000.</p>
        </div>
      </div>
    </footer>
  );
}
