const items = [
  "Free shipping over KES 5,000",
  "30-day easy returns",
  "Manual Till payment available — 711714",
  "Track every order in real time",
  "Wholesale & retail pricing",
  "Curated by humans, delivered fast",
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
