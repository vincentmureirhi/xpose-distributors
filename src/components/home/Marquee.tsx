const items = [
  "Live catalogue pricing",
  "Carton, dozen, and piece rules shown clearly",
  "Secure order tracking links",
  "Fresh flash deals",
  "Route customer orders supported",
  "M-Pesa till payment: 711714",
  "Wholesale and retail checkout",
  "Kenya-wide delivery coordination",
];

export default function Marquee() {
  return (
    <div className="overflow-hidden border-y border-border bg-background py-3">
      <div className="marquee gap-12 text-sm font-semibold text-muted-foreground">
        {[...items, ...items, ...items].map((text, index) => (
          <span key={`${text}-${index}`} className="flex items-center gap-12 whitespace-nowrap">
            {text}
            <span className="h-1 w-1 rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}
