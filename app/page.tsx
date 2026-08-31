"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { SIZE_LABEL, depositFor, minimumBid, usd, type SpotSize } from "@/lib/spots";

type Holder = {
  brand: string;
  website?: string;
  x?: string;
  logoDataUrl?: string;
  approved: boolean;
} | null;

type SpotView = {
  id: number;
  name: string;
  hint: string;
  size: SpotSize;
  dim: string;
  dimIn: string;
  opening: number;
  current: number;
  bidCount: number;
  holder: Holder;
};

type HistoryItem = {
  id: string;
  spotId: number;
  amount: number;
  brand: string;
  createdAt: string;
};

type State = {
  auctionEnd: string;
  raised: number;
  taken: number;
  spots: SpotView[];
  history: HistoryItem[];
};

const Car3D = dynamic(() => import("@/components/Car3D"), {
  ssr: false,
  loading: () => <div className="car-canvas" />,
});

function TeslaT({ size = 54 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <path
        fill="#111"
        d="M8 12h48l-3 6H11zM30 18h4v34c-8 1.4-14 1.4-20 0 6 4 12.5 6 18 6s12-2 18-6c-6 1.4-12 1.4-20 0z"
      />
    </svg>
  );
}

function countdown(end: string) {
  const ms = new Date(end).getTime() - Date.now();
  if (ms <= 0) return "Auction ended";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${d}d ${h}h ${m}m`;
}

export default function Home() {
  const [state, setState] = useState<State | null>(null);
  const [mode, setMode] = useState<"live" | "final">("final");
  const [open, setOpen] = useState<SpotView | null>(null);
  const [now, setNow] = useState("");

  async function load() {
    const res = await fetch("/api/bids", { cache: "no-store" });
    setState(await res.json());
  }

  useEffect(() => {
    load();
    const t = setInterval(() => {
      setNow(new Date().toISOString());
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const spots = state?.spots ?? [];
  const latest = state?.history[0];
  const clock = state ? countdown(state.auctionEnd) : "";

  return (
    <>
      <div className="wrap">
        <nav className="nav">
          <a className="brand" href="#top">
            <span className="brand-mark">T</span>
            Brand My Tesla
          </a>
          <div className="nav-links">
            <a href="#auction">Live auction</a>
            <a href="#how">How it works</a>
            <a href="#car">The car</a>
            <a href="#faq">FAQ</a>
          </div>
          <a className="btn btn-ink" href="#auction">
            Get a spot
          </a>
        </nav>

        <header className="hero" id="top">
          <p className="kicker">Robert Scoble · @scobleizer · UNALIGNED</p>
          <h1>Your brand, on my Tesla.</h1>
          <p className="lede">
            Eleven vinyl spots on a white 2018 Model 3. Hood, doors, bumpers, trunk. The Tesla
            badge stays clean. Your logo rides the car through the Bay Area, Superchargers,
            conferences, and the posts that come with them.
          </p>
          <div className="stats">
            <div>
              <div className="stat-num">{usd(state?.raised ?? 0)}</div>
              <div className="stat-label">raised · {state?.taken ?? 0} of 11 spots with bids</div>
              <div className="bar">
                <span style={{ width: `${Math.min(100, ((state?.taken ?? 0) / 11) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="stat-num">{clock || "—"}</div>
              <div className="stat-label">until the auction closes · you can still outbid any spot</div>
            </div>
          </div>
          <p className="ticker" suppressHydrationWarning>
            {latest
              ? `${latest.brand} bid ${usd(latest.amount)} on spot ${latest.spotId}`
              : "Auction is open. No bids yet — floors are live."}
            {now ? "" : ""}
          </p>
        </header>

        <section className="stage" id="auction">
          {mode === "live" ? (
            <Lid spots={spots} onPick={setOpen} />
          ) : (
            <Car3D
              spots={spots}
              onPick={(id) => {
                const s = spots.find((x) => x.id === id);
                if (s) setOpen(s);
              }}
            />
          )}
          <div className="toggle">
            <button className={mode === "final" ? "on" : ""} onClick={() => setMode("final")} type="button">
              3D car
            </button>
            <button className={mode === "live" ? "on" : ""} onClick={() => setMode("live")} type="button">
              Spot map
            </button>
          </div>
          <p className="hint">Drag to orbit · grey pads are the brand spots, click to bid</p>
        </section>

        <section className="section">
          <h2>The auction, live.</h2>
          <p className="sub">Every spot shows its current top bid. Floors still $250 / $500 / $750–$1,000. The hood is the $1,000 large.</p>
          <table className="table">
            <thead>
              <tr>
                <th>Spot</th>
                <th>Size</th>
                <th>Held by</th>
                <th>Current bid</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {spots.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>
                      {s.id} {s.name}
                    </strong>
                    <div className="size">{s.hint}</div>
                  </td>
                  <td>
                    {SIZE_LABEL[s.size]}
                    <div className="size">
                      {s.dim} · {s.dimIn}
                    </div>
                  </td>
                  <td>{s.holder?.brand ?? "—"}</td>
                  <td>
                    {usd(s.current)}
                    <div className="size">
                      {s.bidCount} bid{s.bidCount === 1 ? "" : "s"}
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-ghost" type="button" onClick={() => setOpen(s)}>
                      {s.bidCount ? "Outbid" : "Bid"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="section" id="how">
          <h2>How it works</h2>
          <p className="sub">Same job as a laptop-lid auction. Bigger object. More highway.</p>
          <div className="steps">
            <article className="step">
              <span>01</span>
              <h3>Pick your spot and size</h3>
              <p>Eleven zones on the hood, doors, bumpers, and trunk. Three sticker sizes; the hood opens at $1,000.</p>
            </article>
            <article className="step">
              <span>02</span>
              <h3>Win the bid</h3>
              <p>Top bid when the clock hits zero wins. A 20% deposit holds it. Lose, and it comes back.</p>
            </article>
            <article className="step">
              <span>03</span>
              <h3>Your sticker rides along</h3>
              <p>Die-cut vinyl on the car, a link on this page, and whatever frames Robert posts from the road.</p>
            </article>
          </div>
        </section>

        <section className="section" id="car">
          <h2>What the money buys.</h2>
          <p className="sub">Not a new car. The car is already his. You buy the rolling billboard and the feed it shows up in.</p>
          <div className="facts">
            <div className="fact">
              <p className="kicker">You get</p>
              <ul>
                <li>A quality die-cut vinyl of your logo on a white 2018 Model 3</li>
                <li>A linked listing on this page for the life of the auction and after</li>
                <li>The car in Robert Scoble&apos;s daily FSD miles — Bay Area, conferences, Superchargers</li>
                <li>A real chance to appear in @scobleizer photos and videos. No promised impression counts.</li>
              </ul>
            </div>
            <div className="card">
              <p className="kicker">The machine</p>
              <dl className="dl">
                <div>
                  <dt>Car</dt>
                  <dd>2018 Tesla Model 3</dd>
                </div>
                <div>
                  <dt>Color</dt>
                  <dd>White</dd>
                </div>
                <div>
                  <dt>Home</dt>
                  <dd>Bay Area</dd>
                </div>
                <div>
                  <dt>Driver</dt>
                  <dd>Robert Scoble</dd>
                </div>
                <div>
                  <dt>Computer</dt>
                  <dd>Hardware 3 FSD</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="section faq" id="faq">
          <h2>Questions</h2>
          <details open>
            <summary>Is this real?</summary>
            <p>Yes. The Model 3 is real, the vinyl is real, and Robert actually drives it. The only stretch is treating a car like premium ad inventory — which is the point.</p>
          </details>
          <details>
            <summary>Why this car?</summary>
            <p>Everyone already looks at a Tesla. Robert has been putting miles and FSD content on this white 2018 Model 3 for years. Brands sit next to a badge people already recognize.</p>
          </details>
          <details>
            <summary>What do I actually get?</summary>
            <p>Your logo on the car, a link here, and whatever public frames the car lands in. We will not invent reach numbers. Robert and UNALIGNED keep final say on what goes on the paint.</p>
          </details>
          <details>
            <summary>How does payment work?</summary>
            <p>A bid takes a 20% deposit (minimum $25). Without Stripe keys on this deploy, the bid still records and we send a payment link for the deposit. Win, and the rest is due when the auction closes. Lose, and the deposit comes back.</p>
          </details>
          <details>
            <summary>What if someone outbids me?</summary>
            <p>You stay in the history. A new bid has to clear the current one by $50.</p>
          </details>
          <details>
            <summary>Can any brand join?</summary>
            <p>Almost. Every logo is checked by hand. If a bid is refused, the deposit comes back in full.</p>
          </details>
          <details>
            <summary>Why not just buy ads?</summary>
            <p>Because this one lives on a car people already photograph, at Superchargers and conferences, and in a feed that is already about this machine.</p>
          </details>
          <p className="size" style={{ marginTop: 18 }}>
            Not affiliated with Tesla, Inc.
          </p>
        </section>

        <footer className="foot">
          <div>
            Made by <a href="https://x.com/AsherWeisberger">Asher Weisberger</a>
            {" · "}
            Talent <a href="https://x.com/scobleizer">Robert Scoble</a> / UNALIGNED
          </div>
          <div>Brand My Tesla · vinyl on a white 2018 Model 3</div>
        </footer>
      </div>
      {open && <BidModal spot={open} onClose={() => setOpen(null)} onPlaced={load} />}
    </>
  );
}

function Lid({ spots, onPick }: { spots: SpotView[]; onPick: (s: SpotView) => void }) {
  const byId = (id: number) => spots.find((s) => s.id === id);
  const cell = (id: number) => {
    const s = byId(id);
    if (!s) return <div key={id} className={`s${id}`} />;
    return (
      <button key={id} className={`spot s${id}`} type="button" onClick={() => onPick(s)}>
        {s.holder?.logoDataUrl ? <img src={s.holder.logoDataUrl} alt="" /> : <span className="s-meta">{SIZE_LABEL[s.size]}</span>}
        <span className="s-name">{s.holder?.brand ?? s.name}</span>
        <span className="s-bid">{usd(s.current)}</span>
      </button>
    );
  };
  return (
    <div className="lid" aria-label="Car sticker map">
      {[6, 1, 7, 2, 3, 4, 5, 8, 9, 10, 11].map(cell)}
      <div className="badge">
        <TeslaT size={36} />
      </div>
    </div>
  );
}

function BidModal({
  spot,
  onClose,
  onPlaced,
}: {
  spot: SpotView;
  onClose: () => void;
  onPlaced: () => void;
}) {
  const min = spot.bidCount ? minimumBid(spot.current) : spot.current;
  const [amount, setAmount] = useState(min);
  const [brand, setBrand] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [x, setX] = useState("");
  const [logo, setLogo] = useState<string | undefined>();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const deposit = useMemo(() => depositFor(amount || min), [amount, min]);

  function onFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/bids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spotId: spot.id,
        amount,
        brand,
        email,
        website,
        x,
        logoDataUrl: logo,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) {
      setErr(data.error || "Could not place bid");
      return;
    }
    onPlaced();
    onClose();
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <button className="close" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h3>
          Spot {spot.id} · {spot.name}
        </h3>
        <p className="m-sub">
          {SIZE_LABEL[spot.size]} sticker · {spot.dim} · Current {usd(spot.current)}
          {spot.holder ? ` by ${spot.holder.brand}` : ""} · {spot.bidCount} bids
        </p>
        <label className="field">
          Your bid (USD)
          <input type="number" min={min} step={50} value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
        </label>
        <p className="m-sub">Minimum {usd(min)}</p>
        <div className="deposit">
          Deposit, 20% of {usd(amount || min)} — {usd(deposit)} due now. Refunded in full if you don&apos;t win.
          If you do, the remaining {usd((amount || min) - deposit)} is collected when the auction closes.
        </div>
        <label className="field">
          Brand name
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Acme" required />
        </label>
        <label className="field">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@acme.com" required />
        </label>
        <label className="field">
          Website (optional)
          <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://acme.com" />
        </label>
        <label className="field">
          X handle (optional)
          <input value={x} onChange={(e) => setX(e.target.value)} placeholder="@acme" />
        </label>
        <label className="drop">
          {logo ? "Logo attached" : "Upload your logo · PNG · JPG · SVG"}
          <input type="file" accept="image/png,image/jpeg,image/svg+xml" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {err && <p className="err">{err}</p>}
        <button className="btn btn-accent" type="submit" disabled={busy} style={{ width: "100%", height: 48 }}>
          {busy ? "Placing…" : spot.holder ? `Outbid ${spot.holder.brand}` : "Place bid"}
        </button>
        <p className="m-sub" style={{ marginTop: 10 }}>
          Every logo is checked by hand before it goes on the car.
        </p>
      </form>
    </div>
  );
}
