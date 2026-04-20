import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, BookOpen } from "lucide-react";
import { getBlogPost, type BlogPost } from "@/lib/api/blog";
import { Button } from "@/components/ui/button";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    window.scrollTo(0, 0);
    getBlogPost(id)
      .then((p) => {
        setPost(p);
        if (p) document.title = `${p.title} — XPOSE Blog`;
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container py-14 max-w-3xl mx-auto space-y-6">
        <div className="h-10 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
        <div className="aspect-video bg-muted animate-pulse rounded-2xl" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`h-4 bg-muted animate-pulse rounded ${i === 5 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-32 text-center">
        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="font-display font-bold text-3xl mb-2">Post not found</h1>
        <p className="text-muted-foreground mb-6">This blog post doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/blog">Back to Blog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-14 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
        <Link to="/blog">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Blog
        </Link>
      </Button>

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(post.created_at)}
          {post.author && (
            <>
              <span>·</span>
              <span>{post.author}</span>
            </>
          )}
        </div>

        <h1 className="font-display font-bold text-4xl md:text-5xl tracking-tight leading-tight mb-6">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 border-l-4 border-accent pl-4">
            {post.excerpt}
          </p>
        )}

        {post.featured_image && (
          <div className="rounded-2xl overflow-hidden mb-8 aspect-video bg-secondary">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {post.content && (
          <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground">
            {post.content.split("\n\n").map((para, i) => (
              <p key={i} className="mb-4 leading-relaxed text-muted-foreground">
                {para}
              </p>
            ))}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-border flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Enjoyed this post? Share it with your network!
          </p>
          <Button asChild variant="outline">
            <Link to="/blog">More Articles →</Link>
          </Button>
        </div>
      </motion.article>
    </div>
  );
}
