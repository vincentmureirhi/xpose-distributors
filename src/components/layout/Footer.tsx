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
            A modern marketplace built for speed, clarity, and a buying experience that feels effortless.
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
            <li><Link to="/categories" className="hover:text-foreground">Categories</Link></li>
            <li><Link to="/products?sort=rating" className="hover:text-foreground">Top rated</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-4 text-sm">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/track-order" className="hover:text-foreground">Track order</Link></li>
            <li><a href="#" className="hover:text-foreground">Shipping</a></li>
            <li><a href="#" className="hover:text-foreground">Returns</a></li>
            <li><a href="#" className="hover:text-foreground">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-4 text-sm">Newsletter</h4>
          <p className="text-sm text-muted-foreground mb-3">Drops, deals, and early access.</p>
          <form className="flex gap-2">
            <input type="email" placeholder="you@email.com" className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm" />
            <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">Join</button>
          </form>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container py-5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} XPOSE Distributors. All rights reserved.</p>
          <p>Manual Till payment available on 711714.</p>
        </div>
      </div>
    </footer>
  );
}
