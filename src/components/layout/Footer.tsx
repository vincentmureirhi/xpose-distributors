import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  ExternalLink,
  Mail,
  MessageCircle,
  Music2,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import Wordmark from "@/components/brand/Wordmark";

const TIKTOK_URL = "https://www.tiktok.com/@xposebeautyshopvo?is_from_webapp=1&sender_device=pc";
const WHATSAPP_URL = "https://wa.me/254701377869";
const DEVELOPER_EMAIL = "vinwambug@gmail.com";

const shopLinks = [
  ["All products", "/products"],
  ["Verified stores", "/vendors"],
  ["Categories", "/categories"],
  ["Flash sale", "/flash-sale"],
];

const supportLinks = [
  ["Track order", "/track-order"],
  ["Route delivery", "/route-delivery"],
  ["Blog", "/blog"],
  ["Terms", "/terms"],
  ["Sell on XPOSE", "/sell-on-xpose"],
];

export default function Footer() {
  return (
    <footer className="mt-24 overflow-hidden border-t border-border bg-[#070b10] text-white">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(255,91,46,0.23),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(34,197,94,0.16),transparent_24%)]" />
        <div className="container relative py-12 md:py-16">
          <div className="mb-10 grid gap-3 md:grid-cols-3">
            {[
              [ShieldCheck, "Secure checkout", "Protected orders and private tracking."],
              [Truck, "Flexible delivery", "Standard and route delivery options."],
              [BadgeCheck, "Verified vendors", "Shop approved marketplace sellers."],
            ].map(([Icon, title, text]) => {
              const RealIcon = Icon as typeof ShieldCheck;
              return (
                <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur">
                  <RealIcon className="mb-4 h-5 w-5 text-accent" />
                  <p className="font-black">{title as string}</p>
                  <p className="mt-2 text-sm leading-6 text-white/62">{text as string}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr_0.75fr_1fr]">
            <div>
              <Link to="/" className="inline-flex rounded-xl bg-white px-3 py-2">
                <Wordmark size="md" />
              </Link>
              <p className="mt-5 max-w-sm text-sm font-semibold leading-7 text-white/65">
                Better prices for daily shopping, salon restocks and wholesale orders.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={TIKTOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/12 bg-white px-4 text-sm font-black text-slate-950 transition-transform hover:-translate-y-0.5"
                >
                  <Music2 className="h-4 w-4 text-accent" /> TikTok <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/12 px-4 text-sm font-black text-emerald-200 transition-transform hover:-translate-y-0.5"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-black uppercase tracking-wider text-white/90">Shop</h4>
              <ul className="space-y-3 text-sm text-white/62">
                {shopLinks.map(([label, to]) => (
                  <li key={to}><Link to={to} className="transition-colors hover:text-accent">{label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-black uppercase tracking-wider text-white/90">Support</h4>
              <ul className="space-y-3 text-sm text-white/62">
                {supportLinks.map(([label, to]) => (
                  <li key={to}><Link to={to} className="transition-colors hover:text-accent">{label}</Link></li>
                ))}
                <li>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent">Contact support</a>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><Store className="h-5 w-5" /></div>
                <div>
                  <h4 className="font-black">Grow your store</h4>
                  <p className="mt-2 text-sm leading-6 text-white/62">Reach retail and wholesale buyers across XPOSE.</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/sell-on-xpose" className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-black text-accent-foreground hover:bg-accent/90">
                  Start selling <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/vendor/login" className="inline-flex h-10 items-center rounded-full border border-white/15 px-4 text-sm font-black text-white hover:border-accent/70 hover:text-accent">
                  Vendor login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/20">
        <div className="container grid gap-3 py-5 text-xs text-white/55 md:grid-cols-3 md:items-center">
          <p className="md:text-left">Copyright {new Date().getFullYear()} XPOSE Distributors. Registered business: XPOSE Beauty Shop.</p>
          <p className="text-center font-semibold text-white/65">
            Developed by Dreams &amp; Visions ·{" "}
            <a href={`mailto:${DEVELOPER_EMAIL}`} className="inline-flex items-center gap-1 hover:text-accent">
              <Mail className="h-3.5 w-3.5" /> {DEVELOPER_EMAIL}
            </a>
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end"><span>M-Pesa Till 711714</span></div>
        </div>
      </div>
    </footer>
  );
}
