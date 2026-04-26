import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, Send, Sparkles } from "lucide-react";

interface Message {
  from: "bot" | "user";
  text: string;
}

const FAQ: Record<string, string> = {
  shipping: "🚚 We offer free shipping for orders over KES 75,000. We deliver across Kenya!",
  payment: "💳 We accept M-Pesa (Till: 711714), bank transfer, and cash on delivery.",
  returns: "We operate a quality-first policy. If you receive a defective item, contact us within 48 hours via WhatsApp.",
  pricing: "💰 We offer flexible pricing — retail, bulk discount, and volume options. Your pricing is applied automatically based on your selection.",
  contact: "📞 Call/WhatsApp us at 0701377869 for direct support.",
  track: "🔍 You can track your order on our Track Order page using your order number.",
};

function getBotResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("ship") || lower.includes("deliver") || lower.includes("delivery")) return FAQ.shipping;
  if (lower.includes("pay") || lower.includes("mpesa") || lower.includes("till")) return FAQ.payment;
  if (lower.includes("return") || lower.includes("refund")) return FAQ.returns;
  if (lower.includes("wholesale") || lower.includes("bulk") || lower.includes("retail") || lower.includes("pric")) return FAQ.pricing;
  if (lower.includes("contact") || lower.includes("human") || lower.includes("support")) return FAQ.contact;
  if (lower.includes("track") || lower.includes("order")) return FAQ.track;
  return "I'm not sure about that 🤔 — try asking about shipping, payment, pricing, or contact us directly on WhatsApp!";
}

const quickActions = [
  { label: "🛍️ Browse Products", path: "/products" },
  { label: "📦 Track My Order", path: "/track-order" },
  { label: "⚡ Flash Sales", path: "/products?flash=1" },
  { label: "📰 View Blog", path: "/blog" },
  { label: "💬 Contact Support", whatsapp: true },
  { label: "🚚 Shipping Info", faq: "shipping" },
];

export default function MueniChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { from: "bot", text: "Hi! I'm MUENI, your shopping assistant 🛍️ How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { from: "user", text };
    const botMsg: Message = { from: "bot", text: getBotResponse(text) };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  const handleAction = (action: (typeof quickActions)[0]) => {
    if (action.whatsapp) {
      window.open("https://wa.me/254701377869", "_blank");
      return;
    }
    if (action.faq) {
      setMessages((prev) => [
        ...prev,
        { from: "user", text: action.label },
        { from: "bot", text: FAQ[action.faq!] },
      ]);
      return;
    }
    if (action.path) {
      setOpen(false);
      navigate(action.path);
    }
  };

  return (
    <>
      {/* Chatbot toggle button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open MUENI chatbot"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg text-white"
      >
        <motion.span
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full bg-violet-500"
        />
        {open ? <X className="h-6 w-6 relative z-10" /> : <Sparkles className="h-6 w-6 relative z-10" />}
        {!open && (
          <span
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-[9px] font-bold text-accent-foreground flex items-center justify-center"
            aria-label="AI-powered chatbot"
            title="AI-powered chatbot"
          >
            AI
          </span>
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="fixed bottom-40 right-6 z-50 w-[340px] max-h-[520px] rounded-2xl border border-border bg-card shadow-elevated flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
              <div className="h-9 w-9 rounded-full bg-white/20 grid place-items-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm">MUENI</p>
                <p className="text-[10px] text-white/70">Your AI Shopping Assistant</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto opacity-70 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.from === "user"
                        ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm"
                        : "bg-secondary text-foreground rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Quick actions (shown after welcome) */}
              {messages.length <= 1 && (
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {quickActions.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => handleAction(a)}
                      className="text-xs rounded-xl border border-border bg-background px-2 py-2 text-left hover:bg-secondary hover:border-violet-400 transition-all"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask me anything…"
                className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-violet-400"
              />
              <button
                onClick={() => sendMessage(input)}
                className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white grid place-items-center hover:opacity-90"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
