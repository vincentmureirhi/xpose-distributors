import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Calendar } from "lucide-react";
import { listBlogPosts, type BlogPost } from "@/lib/api/blog";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" });
}

export default function BlogPreview() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listBlogPosts()
      .then((p) => setPosts(p.slice(0, 3)))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="container py-16 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider mb-3">
            <BookOpen className="h-3.5 w-3.5" /> Blog
          </div>
          <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight">
            Latest from XPOSE
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            Tips, product guides, and the best deals — all in one place.
          </p>
        </motion.div>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
        >
          View all posts <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
              <div className="aspect-video bg-muted" />
              <div className="p-6 space-y-3">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-6 bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
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
              <div className="p-5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <Calendar className="h-3 w-3" />
                  {formatDate(post.created_at)}
                </div>
                <h3 className="font-display font-bold text-base leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                )}
                <Link
                  to={`/blog/${post.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                >
                  Read more <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
