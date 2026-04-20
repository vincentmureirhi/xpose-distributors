import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";
import { listBlogPosts, type BlogPost } from "@/lib/api/blog";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Blog — XPOSE Distributors";
    listBlogPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-10 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider mb-4">
          <BookOpen className="h-3.5 w-3.5" /> XPOSE Blog
        </div>
        <h1 className="font-display font-bold text-4xl md:text-6xl tracking-tight">
          Tips, Guides &amp; Deals
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
          Product guides, wholesale tips, and the latest deals from XPOSE Distributors.
        </p>
      </motion.div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
              <div className="aspect-video bg-muted" />
              <div className="p-6 space-y-3">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-6 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="font-display font-bold text-2xl mb-2">Coming Soon</h2>
          <p className="text-muted-foreground">Our blog is being set up. Check back soon for great content!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-elevated transition-all duration-300 hover:border-foreground/20"
            >
              {post.featured_image && (
                <div className="aspect-video overflow-hidden bg-secondary">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.created_at)}
                  {post.author && (
                    <>
                      <span>·</span>
                      <span>{post.author}</span>
                    </>
                  )}
                </div>
                <h2 className="font-display font-bold text-lg leading-snug mb-2 group-hover:text-accent transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{post.excerpt}</p>
                )}
                <Link
                  to={`/blog/${post.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                >
                  Read More <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
