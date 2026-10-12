import { Link } from "@tanstack/react-router";
import { Logo } from "./Navbar";

export function Footer() {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            A structured, searchable directory of clinics, labs, pharmacies and support facilities — so comparing care is simple.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Explore</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/directory" className="hover:text-foreground">Directory</Link></li>
            <li><Link to="/compare" className="hover:text-foreground">Compare</Link></li>
            <li><Link to="/saved" className="hover:text-foreground">Saved</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">For providers</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/admin" className="hover:text-foreground">Admin panel</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Admin sign in</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t py-6 text-center text-xs text-muted-foreground">
        © {2026} MediFind · CSE326 Health Facility Resource Directory. Information is for guidance only — in an emergency call 112.
      </p>
    </footer>
  );
}
