import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Send, X } from "lucide-react";

interface Message {
  from: "bot" | "user";
  text: string;
}

const ASSISTANT_AVATAR = "/images/mueni-assistant.png";

const FAQ: Record<string, string> = {
  shipping: "We offer free shipping for orders over KES 75,000 and deliver across Kenya.",
  payment: "We accept M-Pesa Till 711714, bank transfer, and cash on delivery where available.",
  returns: "We operate a quality-first policy. If you receive a defective item, contact us within 48 hours via WhatsApp.",
  wholesale: "We support retail and wholesale pricing. Larger quantities unlock better unit pricing where eligible.",
  contact: "Call or WhatsApp us at 0701377869 for direct support.",
  track: "You can track your order from the Track page using your order number and phone verification.",
};

const quickActions = [
  { label: "Browse products", path: "/products" },
  { label: "Track my order", path: "/track-order" },
  { label: "Flash sale", path: "/flash-sale" },
  { label: "View blog", path: "/blog" },
  { label: "Contact support", whatsapp: true },
  { label: "Shipping info", faq: "shipping" },
];

function getBotResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("ship") || lower.includes("deliver") || lower.includes("delivery")) return FAQ.shipping;
  if (lower.includes("pay") || lower.includes("mpesa") || lower.includes("till")) return FAQ.payment;
  if (lower.includes("return") || lower.includes("refund")) return FAQ.returns;
  if (lower.includes("wholesale") || lower.includes("bulk") || lower.includes("retail")) return FAQ.wholesale;
  if (lower.includes("contact") || lower.includes("human") || lower.includes("support")) return FAQ.contact;
  if (lower.includes("track") || lower.includes("order")) return FAQ.track;
  return "I can help with shipping, payment, wholesale pricing, order tracking, and contact details.";
}

export default function MueniChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { from: "bot", text: "Hi, I'm MUENI. I can help with products, orders, delivery, and payments." },
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
      window.open("https://wa.me/254701377869", "_blank", "noopener,noreferrer");
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
      <motion.button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open MUENI support"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 z-50 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-foreground shadow-lg"
      >
        <motion.span
          animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full bg-accent/35"
        />

        {open ? (
          <span className="relative z-10 grid h-full w-full place-items-center bg-foreground text-background">
            <X className="h-6 w-6" />
          </span>
        ) : (
          <img
            src={ASSISTANT_AVATAR}
            alt="MUENI support"
            className="relative z-10 h-full w-full object-cover object-top"
            loading="lazy"
          />
        )}

        {!open && (
          <span
            className="absolute bottom-1 right-1 z-20 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"
            aria-label="Support available"
            title="Support available"
          />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="fixed bottom-40 right-4 z-50 flex max-h-[520px] w-[calc(100vw-2rem)] max-w-[340px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elevated sm:right-6"
          >
            <div className="flex items-center gap-3 bg-foreground px-4 py-3 text-background">
              <div className="h-11 w-11 overflow-hidden rounded-full border border-white/30 bg-white">
                <img src={ASSISTANT_AVATAR} alt="" className="h-full w-full object-cover object-top" />
              </div>
              <div>
                <p className="text-sm font-bold">MUENI</p>
                <p className="text-[10px] text-background/70">XPOSE customer care</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="ml-auto opacity-70 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              {messages.map((message, index) => (
                <div key={`${message.from}-${index}`} className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      message.from === "user"
                        ? "rounded-br-sm bg-foreground text-background"
                        : "rounded-bl-sm bg-secondary text-foreground"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {messages.length <= 1 && (
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => handleAction(action)}
                      className="rounded-xl border border-border bg-background px-2 py-2 text-left text-xs transition-all hover:border-accent hover:bg-secondary"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-border p-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && sendMessage(input)}
                placeholder="Ask about products or orders..."
                className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                className="grid h-9 w-9 place-items-center rounded-lg bg-foreground text-background hover:opacity-90"
                aria-label="Send message"
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
