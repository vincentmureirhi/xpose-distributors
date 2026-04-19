import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    toast.success("Account created!", { description: "Wire to backend to persist." });
  };
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-md mx-auto">
        <h1 className="font-display font-bold text-4xl tracking-tight mb-2">Create account</h1>
        <p className="text-muted-foreground mb-8">Join XPOSE in under a minute.</p>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div><Label htmlFor="name">Full name</Label><Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label htmlFor="phone">Phone</Label><Input id="phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <Button type="submit" size="lg" className="w-full bg-gradient-accent text-accent-foreground border-0 shadow-glow">Create account</Button>
          <p className="text-sm text-center text-muted-foreground">Already a member? <Link to="/login" className="text-foreground font-medium hover:underline">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
