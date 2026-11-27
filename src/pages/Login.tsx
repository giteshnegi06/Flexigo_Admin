import { useState } from "react";
import { useNavigate } from "react-router";
import { Lock } from "lucide-react";
import { api, token } from "../lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ token: string }>("/admin/login", { method: "POST", body: JSON.stringify({ password: new FormData(e.currentTarget).get("password") }) });
      token.set(res.token);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-forest p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <span className="grid size-12 place-items-center rounded-full bg-stone text-forest"><Lock aria-hidden /></span>
        <h1 className="mt-4 text-2xl font-semibold text-forest">FlexiGo Stays Admin</h1>
        <p className="mt-1 text-sm text-muted">Sign in to manage enquiries, prices and dates.</p>
        <label className="mt-6 block text-sm font-medium text-forest">
          Password
          <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-base outline-none focus:border-forest" />
        </label>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="mt-6 min-h-12 w-full rounded-[10px] bg-forest font-semibold text-white hover:bg-forest-soft disabled:opacity-60">
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
