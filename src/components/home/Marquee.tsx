const items = [
  "🔥 Deals Available — Don't Miss Out!",
  "🚚 Free Shipping for Orders Over KES 75,000",
  "💰 Wholesale & Retail Pricing",
  "⚡ Flash Sales Live Now",
  "🇰🇪 Delivering Across Kenya",
  "🏷️ Best Prices Guaranteed",
  "📦 Same-Day Dispatch Available",
  "💳 Manual Till Payment — 711714",
  "🛍️ Hybrid Company — BLACK FRIDAY Every Day",
  "⭐ Quality You Can Trust",
];

export default function Marquee() {
  return (
    <div className="border-y border-border bg-background py-3 overflow-hidden">
      <div className="marquee gap-12 text-sm font-medium text-muted-foreground">
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-12 whitespace-nowrap">
            {t}
            <span className="h-1 w-1 rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}
