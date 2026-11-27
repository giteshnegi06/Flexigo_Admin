import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { CalendarDays, Home, Images, Inbox, LayoutDashboard, LogOut, Menu, MessageSquareText, PartyPopper, X } from "lucide-react";
import { token } from "../lib/api";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/enquiries", label: "Enquiries", icon: Inbox },
  { to: "/messages", label: "Messages", icon: MessageSquareText },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/holidays", label: "Holidays", icon: PartyPopper },
  { to: "/homes", label: "Homes and prices", icon: Home },
  { to: "/images", label: "Website images", icon: Images },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const signOut = () => {
    token.clear();
    navigate("/login");
  };

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Admin">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${isActive ? "bg-white/15 text-white" : "text-stone/80 hover:bg-white/10 hover:text-white"}`}
        >
          <Icon size={18} aria-hidden /> {label}
        </NavLink>
      ))}
      <button onClick={signOut} className="mt-auto flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-stone/80 hover:bg-white/10 hover:text-white">
        <LogOut size={18} aria-hidden /> Sign out
      </button>
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col bg-forest p-5 lg:flex">
        <p className="mb-8 text-lg font-semibold text-white">FlexiGo Stays <span className="block text-xs font-normal uppercase tracking-widest text-pine">Admin</span></p>
        {nav}
      </aside>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-forest px-4 text-white lg:hidden">
        <p className="font-semibold">FlexiGo Stays Admin</p>
        <button className="grid size-11 place-items-center" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
          {open ? <X /> : <Menu />}
        </button>
      </header>
      {open && <div className="fixed inset-x-0 bottom-0 top-14 z-20 flex flex-col bg-forest p-4 lg:hidden">{nav}</div>}
      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-2xl font-semibold text-forest sm:text-3xl">{title}</h1>
      {children}
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{message}</p>;
}
