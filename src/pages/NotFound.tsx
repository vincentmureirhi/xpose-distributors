import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="container py-32 text-center">
      <p className="font-display text-9xl font-bold tracking-tighter bg-gradient-accent bg-clip-text text-transparent">404</p>
      <h1 className="font-display font-bold text-3xl mt-4">Page not found</h1>
      <p className="text-muted-foreground mt-2">The page you're looking for doesn't exist.</p>
      <Button asChild className="mt-6"><Link to="/">Back home</Link></Button>
    </div>
  );
};

export default NotFound;
