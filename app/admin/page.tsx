"use client";

import { FormEvent, useEffect, useState } from "react";

type Bid = {
  id: string;
  spotId: number;
  amount: number;
  brand: string;
  email: string;
  approved: boolean;
  createdAt: string;
};

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [bids, setBids] = useState<Bid[]>([]);
  const [msg, setMsg] = useState("");

  async function refresh() {
    const res = await fetch("/api/bids", { cache: "no-store" });
    const data = await res.json();
    setBids(data.history ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function approve(id: string, e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, key }),
    });
    const data = await res.json();
    setMsg(data.ok ? "Approved." : data.error);
    refresh();
  }

  return (
    <main className="admin">
      <h1>Approve logos</h1>
      <p>Bids hold the price immediately. Approve to put the logo on the car.</p>
      <label>
        Admin key
        <input value={key} onChange={(e) => setKey(e.target.value)} type="password" />
      </label>
      <ul>
        {bids.map((b) => (
          <li key={b.id}>
            <strong>{b.brand}</strong> · spot {b.spotId} · ${b.amount} · {b.approved ? "on the car" : "pending"}
            {!b.approved && (
              <form onSubmit={(e) => approve(b.id, e)}>
                <button type="submit">Approve</button>
              </form>
            )}
          </li>
        ))}
      </ul>
      {msg && <p>{msg}</p>}
    </main>
  );
}
