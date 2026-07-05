import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, ShoppingBag } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { getCollection, type CollectionResult } from "@/lib/api/collections";
import { trackCampaignEvent } from "@/lib/api/marketing";

interface Props {
  slug?: string;
}

function upsertMeta(name: string, content: string) {
  let element = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function CollectionPage({ slug: fixedSlug }: Props) {
  const params = useParams();
  const slug = fixedSlug || params.slug || "";
  const [data, setData] = useState<CollectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    getCollection(slug)
      .then((result) => {
        if (!active) return;
        setData(result);
        document.title = result.collection.seo_title || `${result.collection.name} - XPOSE`;
        upsertMeta("description", result.collection.seo_description || result.collection.hero_subtitle || `Shop ${result.collection.name} on XPOSE.`);
        window.sessionStorage.setItem("xposeCampaignId", String(result.collection.id));
        void trackCampaignEvent(result.collection.id, "impression");
      })
      .catch(() => {
        if (!active) return;
        setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [slug]);

  if (loading) {
    return <div className="container grid min-h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
  }

  if (failed || !data) {
    return (
      <div className="container py-24 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-3xl font-black">Collection unavailable</h1>
        <Link to="/products" className="mt-6 inline-flex items-center gap-2 font-black text-accent">Shop all products <ArrowRight className="h-4 w-4" /></Link>
      </div>
    );
  }

  const { collection, products } = data;
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: collection.name,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${window.location.origin}/products/${product.id}`,
      name: product.name,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <section className="relative overflow-hidden border-b border-border bg-[#080b10] text-white">
        {collection.hero_image_url && <img src={collection.hero_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,91,46,0.28),transparent_32%)]" />
        <div className="container relative py-10 md:py-14">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-white/65 hover:text-white"><ArrowLeft className="h-4 w-4" /> Home</Link>
          {collection.badge_label && <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-accent">{collection.badge_label}</p>}
          <h1 className="mt-2 max-w-4xl font-display text-4xl font-black tracking-tight sm:text-6xl">{collection.hero_title || collection.name}</h1>
          {collection.hero_subtitle && <p className="mt-4 max-w-2xl text-base font-medium text-white/68 sm:text-lg">{collection.hero_subtitle}</p>}
        </div>
      </section>

      <section className="container py-10 md:py-14">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-wider text-accent">Available now</p><h2 className="mt-1 text-2xl font-black">{products.length} products</h2></div>
          <Link to="/products" onClick={() => void trackCampaignEvent(collection.id, "click")} className="hidden items-center gap-2 text-sm font-black hover:text-accent sm:inline-flex">Shop full catalogue <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {products.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">Fresh stock is being added.</div>
        )}
      </section>
    </>
  );
}
