import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { getTerms } from "@/lib/api/terms";

function renderMarkdown(text: string) {
  return text
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("## ")) {
        return (
          <h2 key={i} className="font-display font-bold text-2xl mt-8 mb-3 text-foreground">
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={i} className="font-display font-semibold text-lg mt-6 mb-2 text-foreground">
            {line.replace("### ", "")}
          </h3>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={i} className="font-bold text-foreground mb-2">
            {line.replace(/\*\*/g, "")}
          </p>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="ml-4 text-muted-foreground mb-1 list-disc">
            {line.replace("- ", "")}
          </li>
        );
      }
      if (line.startsWith("*") && line.endsWith("*")) {
        return (
          <p key={i} className="italic text-muted-foreground mt-4">
            {line.replace(/\*/g, "")}
          </p>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return (
        <p key={i} className="text-muted-foreground mb-2 leading-relaxed">
          {line}
        </p>
      );
    });
}

export default function Terms() {
  const [content, setContent] = useState<string>("");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Terms & Conditions — XPOSE Distributors";
    getTerms()
      .then((t) => {
        setContent(t.content || "");
        setUpdatedAt(t.updated_at || "");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-10 md:py-14 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider mb-4">
          <FileText className="h-3.5 w-3.5" /> Legal
        </div>
        <h1 className="font-display font-bold text-4xl md:text-5xl tracking-tight">
          Terms &amp; Conditions
        </h1>
        {updatedAt && (
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: {new Date(updatedAt).toLocaleDateString("en-KE")}
          </p>
        )}
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`h-4 bg-muted animate-pulse rounded ${i % 4 === 3 ? "w-2/3" : "w-full"}`} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-8"
        >
          {renderMarkdown(content)}
        </motion.div>
      )}
    </div>
  );
}
