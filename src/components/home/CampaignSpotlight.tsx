import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgePercent, Check, Clock3, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { trackCampaignEvent, type PublicCampaign } from "@/lib/api/marketing";

interface Props {
  campaigns: PublicCampaign[];
}

function discountLabel(campaign: PublicCampaign) {
  const coupon = campaign.coupons?.[0];
  if (!coupon) return campaign.badge_label || "Current offer";
  return coupon.discount_type === "percentage"
    ? `${Number(coupon.discount_value)}% off`
    : `KES ${Number(coupon.discount_value).toLocaleString("en-KE")} off`;
}

function timeLeft(endsAt?: string | null) {
  if (!endsAt) return "While stocks last";
  const milliseconds = new Date(endsAt).getTime() - Date.now();
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return "Ending now";
  const hours = Math.floor(milliseconds / 3_600_000);
  if (hours >= 24) return `${Math.ceil(hours / 24)} days left`;
  return `${Math.max(1, hours)} hours left`;
}

export default function CampaignSpotlight({ campaigns }: Props) {
  const visible = useMemo(
    () => campaigns.filter((campaign) =>
      ["all", "normal"].includes(campaign.customer_scope || "all") &&
      ["home", "all"].includes(campaign.placement || "home")
    ).slice(0, 3),
    [campaigns]
  );
  const [copied, setCopied] = useState("");

  useEffect(() => {
    visible.forEach((campaign) => void trackCampaignEvent(campaign.id, "impression"));
  }, [visible]);

  if (!visible.length) return null;
  const primary = visible[0];
  const coupon = primary.coupons?.[0];
  const accent = primary.accent_color || "#ff5429";

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setCopied("");
    }
  }

  return (
    <section className="border-y border-white/10 bg-[#080d12] text-white">
      <div className="container grid gap-0 py-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,.6fr)]">
        <div className="relative overflow-hidden px-5 py-10 sm:px-8 md:py-14">
          <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} />
          <div className="relative max-w-3xl">
            <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-black uppercase">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5">
                <BadgePercent className="h-4 w-4" style={{ color: accent }} />
                {primary.badge_label || discountLabel(primary)}
              </span>
              <span className="inline-flex items-center gap-2 text-white/65">
                <Clock3 className="h-4 w-4" /> {timeLeft(primary.ends_at)}
              </span>
            </div>
            <h2 className="max-w-2xl font-display text-3xl font-black leading-tight sm:text-5xl">
              {primary.hero_title || primary.name}
            </h2>
            {(primary.hero_subtitle || primary.description) && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
                {primary.hero_subtitle || primary.description}
              </p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to={primary.cta_url || "/products"}
                onClick={() => void trackCampaignEvent(primary.id, "click")}
                className="inline-flex min-h-12 items-center gap-2 rounded-md px-5 font-bold text-white"
                style={{ backgroundColor: accent }}
              >
                {primary.cta_label || "Shop offer"} <ArrowRight className="h-4 w-4" />
              </Link>
              {coupon && (
                <button
                  type="button"
                  onClick={() => void copyCode(coupon.code)}
                  className="inline-flex min-h-12 items-center gap-2 rounded-md border border-white/25 px-5 font-bold hover:bg-white/10"
                >
                  <span className="text-white/60">Code</span> {coupon.code}
                  {copied === coupon.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 lg:border-l lg:border-t-0">
          {visible.slice(1).map((campaign) => (
            <Link
              key={campaign.id}
              to={campaign.cta_url || "/products"}
              onClick={() => void trackCampaignEvent(campaign.id, "click")}
              className="group flex min-h-[132px] items-center justify-between gap-4 border-b border-white/10 px-5 py-6 last:border-b-0 sm:px-7"
            >
              <div>
                <div className="text-xs font-black uppercase text-white/50">{discountLabel(campaign)}</div>
                <div className="mt-2 text-xl font-black leading-tight">{campaign.hero_title || campaign.name}</div>
                <div className="mt-2 text-sm text-white/55">{timeLeft(campaign.ends_at)}</div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
          {visible.length === 1 && primary.hero_image_url && (
            <div className="h-full min-h-[260px] p-5">
              <img src={primary.hero_image_url} alt="" className="h-full max-h-[340px] w-full object-contain" loading="lazy" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}