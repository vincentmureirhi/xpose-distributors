import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    toast.success("Welcome back!", { description: "Auth wiring goes here when backend is connected." });
  };
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-md mx-auto">
        <h1 className="font-display font-bold text-4xl tracking-tight mb-2">Welcome back</h1>
        <p className="text-muted-foreground mb-8">Sign in to your account to continue.</p>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <Button type="submit" size="lg" className="w-full bg-gradient-accent text-accent-foreground border-0 shadow-glow">Sign in</Button>
          <p className="text-sm text-center text-muted-foreground">No account? <Link to="/register" className="text-foreground font-medium hover:underline">Create one</Link></p>
        </form>
      </div>
    </div>
  );
}
