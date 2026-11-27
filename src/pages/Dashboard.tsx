import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, inr, prettyDate, type Enquiry, type Summary } from "../lib/api";
import { ErrorNote, PageTitle } from "../components/Layout";

export function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [latest, setLatest] = useState<Enquiry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api<Summary>("/admin/summary"), api<Enquiry[]>("/admin/enquiries")])
      .then(([s, e]) => {
        setSummary(s);
        setLatest(e.slice(0, 5));
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const cards = summary
    ? [
        { label: "New enquiries", value: summary.newEnquiries, to: "/enquiries" },
        { label: "Upcoming booked stays", value: summary.upcomingStays, to: "/enquiries" },
        { label: "Nights blocked this month", value: summary.blockedNightsThisMonth, to: "/calendar" },
        { label: "Active homes", value: summary.activeHomes, to: "/homes" },
      ]
    : [];

  return (
    <>
      <PageTitle title="Dashboard" />
      <ErrorNote message={error} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(summary ? cards : Array.from({ length: 4 }, (_, i) => ({ label: "Loading", value: "-", to: "/" + i }))).map((c) => (
          <Link key={c.label + c.to} to={c.to} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line hover:ring-forest">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold text-forest">{c.value}</p>
          </Link>
        ))}
      </div>
      <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-forest">Latest enquiries</h2>
          <Link to="/enquiries" className="text-sm font-semibold text-pine-dark underline">See all</Link>
        </div>
        {latest.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No enquiries yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {latest.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span><strong className="text-forest">{e.name}</strong> · {e.home}</span>
                <span className="text-muted">{prettyDate(e.checkIn)} to {prettyDate(e.checkOut)} · {inr(e.quotedTotal)} · <span className="capitalize">{e.status}</span></span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
