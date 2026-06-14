import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVendorSession } from "@/context/VendorSessionContext";

export default function VendorLogin() {
  const navigate = useNavigate();
  const { login, isVendorAuthenticated, status, getErrorMessage } = useVendorSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Vendor Login - XPOSE";
  }, []);

  useEffect(() => {
    if (status === "restoring") return;
    if (isVendorAuthenticated) navigate("/vendor/dashboard", { replace: true });
  }, [isVendorAuthenticated, navigate, status]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const workspace = await login(identifier, password);
      toast.success("Vendor login successful", {
        description: workspace.vendor?.store_name ? `Welcome back, ${workspace.vendor.store_name}.` : "Welcome back.",
      });
      navigate("/vendor/dashboard", { replace: true });
    } catch (error) {
      toast.error("Login failed", {
        description: getErrorMessage(error, "Check your vendor username and password."),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background">
      <section className="container grid gap-8 py-12 md:py-20 lg:grid-cols-[minmax(0,1fr)_460px]">
        <div className="rounded-3xl bg-[#070b10] p-8 text-white shadow-2xl md:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-white/75">
            <BadgeCheck className="h-4 w-4 text-accent" />
            Verified seller access
          </div>
          <h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
            Manage your XPOSE marketplace store.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/65">
            Submit products, update your public store profile, and track XPOSE review status from one vendor workspace.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["Products", "Draft, submit, and improve listings."],
              ["Verification", "Blue tick appears after approval."],
              ["Pricing", "XPOSE reviews margins before launch."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-black">{title}</p>
                <p className="mt-1 text-sm text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="self-start rounded-3xl border border-border bg-card p-6 shadow-soft md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Vendor sign in</h2>
              <p className="text-sm text-muted-foreground">Use the credentials issued by XPOSE after approval.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-identifier">Username, email, or phone</Label>
              <Input
                id="vendor-identifier"
                required
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-password">Password</Label>
              <Input
                id="vendor-password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign in
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Need a store?{" "}
              <Link to="/sell-on-xpose" className="font-semibold text-foreground hover:underline">
                Apply to sell on XPOSE
              </Link>
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}
