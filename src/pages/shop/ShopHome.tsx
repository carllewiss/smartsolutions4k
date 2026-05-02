import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { useShopFeatured } from "@/hooks/useShop";
import { usePublishedPosts as useBlogPosts } from "@/hooks/useBlog";
import { ArrowRight, Truck, ShieldCheck, Headphones, BadgePercent } from "lucide-react";

export default function ShopHome() {
  const { data: featured = [] } = useShopFeatured();
  const { data: posts = [] } = useBlogPosts();

  return (
    <ShopLayout>
      {/* HERO */}
      <section className="bg-gradient-to-br from-shop-soft to-shop-soft/50">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-shop-accent font-semibold mb-3">Welcome to 4K Smart Solutions</p>
            <h1 className="text-4xl md:text-6xl font-bold font-heading leading-tight mb-4">
              Shop. Get Services.<br />Stay Connected.
            </h1>
            <p className="text-muted-foreground text-lg mb-6 max-w-md">
              Phone accessories, internet, printing, and KRA, NSSF, HELB & eTIMS services — all in one place.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button asChild size="lg" className="bg-shop-deep hover:bg-shop-deep/90 text-shop-deep-foreground">
                <Link to="/shop">Shop Now <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/shop/services">Government Services</Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="aspect-square bg-card rounded-2xl shadow-xl p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="text-7xl font-bold text-shop-deep">4K</div>
                <div className="text-xl text-muted-foreground mt-2">Smart Solutions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USP */}
      <section className="border-y bg-card">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: "Fast Delivery", desc: "Same-day in Nairobi" },
            { icon: ShieldCheck, title: "Genuine Products", desc: "100% authentic" },
            { icon: Headphones, title: "24/7 Support", desc: "WhatsApp anytime" },
            { icon: BadgePercent, title: "Best Prices", desc: "Competitive rates" },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="bg-shop-soft p-3 rounded-full">
                <f.icon className="h-5 w-5 text-shop-deep" />
              </div>
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold font-heading">Featured Products</h2>
            <p className="text-muted-foreground mt-1">Browse our most popular items</p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/shop">View All <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>
        {featured.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No featured products yet. Admin can mark products as featured in Inventory.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* SERVICES TEASER */}
      <section className="bg-shop-soft/30 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">Government Services</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            One-click WhatsApp inquiry for KRA, NSSF, HELB, eTIMS, eCitizen and more.
          </p>
          <Button asChild size="lg" className="bg-shop-deep hover:bg-shop-deep/90 text-shop-deep-foreground">
            <Link to="/shop/services">Explore Services <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>
      </section>

      {/* RECENT BLOG */}
      {posts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold font-heading">Recent News</h2>
            <p className="text-muted-foreground mt-1">Updates & tips from our team</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {posts.slice(0, 3).map((p) => (
              <Link key={p.id} to={`/shop/blog/${p.slug}`} className="group block">
                <div className="aspect-video bg-shop-soft rounded-lg overflow-hidden mb-3">
                  {p.cover_image_url && (
                    <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {p.published_at && new Date(p.published_at).toLocaleDateString()} {p.author_name && `by ${p.author_name}`}
                </p>
                <h3 className="font-bold group-hover:text-shop-accent">{p.title}</h3>
                {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.excerpt}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </ShopLayout>
  );
}
