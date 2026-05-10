import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSalesRepSession } from "@/context/SalesRepSessionContext";

export default function SalesRepChangePassword() {
  const navigate = useNavigate();
  const { isSalesRepAuthenticated, salesRep, mustChangePassword, changePassword, status, getErrorMessage } = useSalesRepSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "restoring") return;
    if (!isSalesRepAuthenticated) {
      navigate("/sales-rep/login", { replace: true });
      return;
    }
    if (!mustChangePassword) {
      navigate("/sales-rep/location-access", { replace: true });
    }
  }, [isSalesRepAuthenticated, mustChangePassword, navigate, status]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success("Password updated", {
        description: "You can now continue to location setup and rep order capture.",
      });
      navigate("/sales-rep/location-access", { replace: true });
    } catch (error) {
      toast.error("Could not change password", {
        description: getErrorMessage(error, "Please check your details and try again."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-md mx-auto">
        <h1 className="font-display font-bold text-4xl tracking-tight mb-2">Change temporary password</h1>
        <p className="text-muted-foreground mb-8">
          {salesRep?.full_name ? `${salesRep.full_name},` : ""} you must set a new password before capturing orders.
        </p>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <Label htmlFor="current_password">Current password</Label>
            <Input
              id="current_password"
              type="password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <Label htmlFor="new_password">New password</Label>
            <Input
              id="new_password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="confirm_password">Confirm new password</Label>
            <Input
              id="confirm_password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Update password"
            )}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Need a different account? <Link to="/sales-rep/login" className="text-foreground font-medium hover:underline">Back to rep login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
