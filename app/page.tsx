"use client";

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
  const [mode, setMode] = useState<"live" | "final">("live");
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
            Ten vinyl spots on a white 2018 Model 3. The Tesla badge stays clean. Your logo rides
            the trunk through the Bay Area, Superchargers, conferences, and the posts that come
            with them.
          </p>
          <div className="stats">
            <div>
              <div className="stat-num">{usd(state?.raised ?? 0)}</div>
              <div className="stat-label">raised · {state?.taken ?? 0} of 10 spots with bids</div>
              <div className="bar">
                <span style={{ width: `${Math.min(100, ((state?.taken ?? 0) / 10) * 100)}%` }} />
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
          {mode === "live" ? <Lid spots={spots} onPick={setOpen} /> : <FinalLook spots={spots} onPick={setOpen} />}
          <div className="toggle">
            <button className={mode === "live" ? "on" : ""} onClick={() => setMode("live")} type="button">
              Live auction
            </button>
            <button className={mode === "final" ? "on" : ""} onClick={() => setMode("final")} type="button">
              Final look
            </button>
          </div>
          <p className="hint">Tap any spot to place a bid.</p>
        </section>

        <section className="section">
          <h2>The auction, live.</h2>
          <p className="sub">Every spot shows its current top bid. Floors: $250 small · $500 medium · $750–$1,000 large. Premium sits next to the Tesla badge.</p>
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
              <p>Ten zones, three sticker sizes, priced by how close they sit to the Tesla T.</p>
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
            <p>Yes. The Model 3 is real, the vinyl is real, and Robert actually drives it. The only stretch is treating a trunk like premium ad inventory — which is the point.</p>
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
  return (
    <div className="lid" aria-label="Trunk sticker map">
      {[2, 1, 3, 9, 4, 5, 10, 7, 6, 8].map((id) => {
        const s = byId(id);
        if (!s) return <div key={id} className={`s${id}`} />;
        return (
          <button key={id} className={`spot s${id}`} type="button" onClick={() => onPick(s)}>
            {s.holder?.logoDataUrl ? <img src={s.holder.logoDataUrl} alt="" /> : <span className="s-meta">{SIZE_LABEL[s.size]}</span>}
            <span className="s-name">{s.holder?.brand ?? s.name}</span>
            <span className="s-bid">{usd(s.current)}</span>
          </button>
        );
      })}
      <div className="badge">
        <TeslaT />
      </div>
    </div>
  );
}

function FinalLook({ spots, onPick }: { spots: SpotView[]; onPick: (s: SpotView) => void }) {
  const hit = (id: number) => {
    const s = spots.find((x) => x.id === id);
    if (s) onPick(s);
  };
  return (
    <div className="final">
      <svg className="car-svg" viewBox="0 0 900 420" role="img" aria-label="White 2018 Model 3 rear three-quarter">
        <defs>
          <linearGradient id="paint" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#d9d9d4" />
          </linearGradient>
          <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="18" stdDeviation="16" floodOpacity=".35" />
          </filter>
        </defs>
        <ellipse cx="450" cy="378" rx="280" ry="18" fill="#000" opacity=".35" />
        <g filter="url(#sh)">
          <path fill="url(#paint)" d="M170 250c20-78 90-150 250-168 140-16 250 18 310 78 28 28 48 70 52 118l-8 42c-18 8-70 14-160 14H250c-50 0-90-6-80-84z" />
          <path fill="#1a1c22" d="M250 118c90-40 230-44 330-8 8 20 10 42-6 54-86 18-210 20-300-6-12-16-16-28-24-40z" />
          <path fill="#c1121f" d="M220 262h470c8 0 10 8 4 12H230c-8 0-12-6-10-12z" />
          <rect x="430" y="200" width="40" height="40" rx="8" fill="#111" />
          <path fill="#f3f1eb" d="M438 208h24l-2 4h-20zM449 212h6v20c-4 .6-7 .6-10 0 3 2 6 3 9 3s6-1 9-3c-3 .6-6 .6-10 0z" />
          <ellipse cx="250" cy="330" rx="48" ry="48" fill="#1a1c22" />
          <ellipse cx="250" cy="330" rx="28" ry="28" fill="#6b6d73" />
          <ellipse cx="680" cy="328" rx="52" ry="52" fill="#1a1c22" />
          <ellipse cx="680" cy="328" rx="30" ry="30" fill="#6b6d73" />
        </g>
        <rect className="hotspot" onClick={() => hit(1)} x="400" y="150" width="100" height="40" rx="8" />
        <rect className="hotspot" onClick={() => hit(2)} x="280" y="150" width="100" height="40" rx="8" />
        <rect className="hotspot" onClick={() => hit(3)} x="520" y="150" width="100" height="40" rx="8" />
        <rect className="hotspot" onClick={() => hit(4)} x="360" y="200" width="48" height="40" rx="8" />
        <rect className="hotspot" onClick={() => hit(5)} x="492" y="200" width="48" height="40" rx="8" />
        <rect className="hotspot" onClick={() => hit(6)} x="400" y="248" width="100" height="32" rx="8" />
        <rect className="hotspot" onClick={() => hit(7)} x="280" y="248" width="100" height="32" rx="8" />
        <rect className="hotspot" onClick={() => hit(8)} x="520" y="248" width="100" height="32" rx="8" />
        <rect className="hotspot" onClick={() => hit(9)} x="210" y="170" width="48" height="48" rx="8" />
        <rect className="hotspot" onClick={() => hit(10)} x="650" y="165" width="48" height="48" rx="8" />
      </svg>
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
