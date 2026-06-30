import { BadgePercent, CreditCard, PackageCheck, ShieldCheck } from "lucide-react";

const signals = [
  { icon: CreditCard, label: "M-Pesa till 711714" },
  { icon: PackageCheck, label: "Retail and wholesale prices" },
  { icon: BadgePercent, label: "Live deals and stock" },
  { icon: ShieldCheck, label: "Private order tracking" },
];

export default function Marquee() {
  return (
    <section className="border-y border-border bg-background" aria-label="Store benefits">
      <div className="container grid grid-cols-2 md:grid-cols-4">
        {signals.map(({ icon: Icon, label }, index) => (
          <div
            key={label}
            className={`flex min-h-14 items-center gap-2 px-2 py-3 text-xs font-bold text-foreground sm:px-4 sm:text-sm ${index % 2 === 0 ? "border-r border-border" : ""} md:border-r md:last:border-r-0`}
          >
            <Icon className="h-4 w-4 flex-shrink-0 text-accent" />
            <span className="leading-5">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}