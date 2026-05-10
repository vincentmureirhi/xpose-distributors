import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSalesRepSession } from "@/context/SalesRepSessionContext";
import { getSalesRepDisplayName } from "@/lib/salesRepSession";

function getPostLoginPath(mustChangePassword: boolean) {
  return mustChangePassword ? "/sales-rep/change-password" : "/sales-rep/location-access";
}

export default function SalesRepLogin() {
  const navigate = useNavigate();
  const { login, isSalesRepAuthenticated, mustChangePassword, status, getErrorMessage } = useSalesRepSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "restoring") return;
    if (!isSalesRepAuthenticated) return;
    navigate(getPostLoginPath(mustChangePassword), { replace: true });
  }, [isSalesRepAuthenticated, mustChangePassword, navigate, status]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const rep = await login(identifier, password);
      const welcomeName = rep.full_name || rep.username;
      toast.success("Sales rep login successful", {
        description: welcomeName ? `Welcome ${welcomeName}.` : "Welcome back!",
      });
      navigate(getPostLoginPath(rep.must_change_password), { replace: true });
    } catch (error) {
      toast.error("Login failed", {
        description: getErrorMessage(error, "Check your identifier and password and try again."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-md mx-auto">
        <h1 className="font-display font-bold text-4xl tracking-tight mb-2">Sales rep sign in</h1>
        <p className="text-muted-foreground mb-8">Use your assigned username or email and password.</p>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <Label htmlFor="identifier">Username or email</Label>
            <Input
              id="identifier"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full bg-gradient-accent text-accent-foreground border-0 shadow-glow"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
              </>
            ) : (
              "Sign in as sales rep"
            )}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Shopping as a customer? <Link to="/checkout" className="text-foreground font-medium hover:underline">Go to checkout</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
