import { promises as fs } from "fs";
import path from "path";
import { SPOTS, MIN_RAISE, AUCTION_END } from "./spots";

export type Bid = {
  id: string;
  spotId: number;
  amount: number;
  brand: string;
  email: string;
  website?: string;
  x?: string;
  logoDataUrl?: string;
  approved: boolean;
  deposit: "pending" | "paid" | "refunded";
  createdAt: string;
};

export type Store = {
  bids: Bid[];
};

const FILE = path.join(process.cwd(), "data", "bids.json");

async function read(): Promise<Store> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as Store;
  } catch {
    return { bids: [] };
  }
}

async function write(store: Store) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2));
}

export function topBid(bids: Bid[], spotId: number): Bid | undefined {
  return bids
    .filter((b) => b.spotId === spotId)
    .sort((a, b) => b.amount - a.amount || b.createdAt.localeCompare(a.createdAt))[0];
}

export async function getState() {
  const store = await read();
  const spots = SPOTS.map((spot) => {
    const history = store.bids
      .filter((b) => b.spotId === spot.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const top = topBid(store.bids, spot.id);
    return {
      ...spot,
      current: top?.amount ?? spot.opening,
      bidCount: history.length,
      holder: top
        ? {
            brand: top.brand,
            website: top.website,
            x: top.x,
            logoDataUrl: top.approved ? top.logoDataUrl : undefined,
            approved: top.approved,
          }
        : null,
      history,
    };
  });
  const raised = spots.reduce((sum, s) => sum + (s.bidCount ? s.current : 0), 0);
  const taken = spots.filter((s) => s.bidCount > 0).length;
  return {
    auctionEnd: AUCTION_END,
    raised,
    taken,
    spots,
    history: [...store.bids].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

export async function placeBid(input: {
  spotId: number;
  amount: number;
  brand: string;
  email: string;
  website?: string;
  x?: string;
  logoDataUrl?: string;
}) {
  const spot = SPOTS.find((s) => s.id === input.spotId);
  if (!spot) throw new Error("Unknown spot");
  if (new Date() > new Date(AUCTION_END)) throw new Error("Auction has ended");

  const brand = input.brand.trim();
  const email = input.email.trim();
  if (!brand) throw new Error("Brand name is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A real email is required");
  if (input.logoDataUrl && input.logoDataUrl.length > 350_000) {
    throw new Error("Logo is too large (keep it under ~200KB)");
  }

  const store = await read();
  const top = topBid(store.bids, spot.id);
  const floor = (top?.amount ?? spot.opening) + (top ? MIN_RAISE : 0);
  if (input.amount < floor) {
    throw new Error(`Minimum bid is $${floor}`);
  }

  const bid: Bid = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    spotId: input.spotId,
    amount: Math.round(input.amount),
    brand,
    email,
    website: input.website?.trim() || undefined,
    x: input.x?.trim().replace(/^@/, "") || undefined,
    logoDataUrl: input.logoDataUrl,
    approved: false,
    deposit: "pending",
    createdAt: new Date().toISOString(),
  };
  store.bids.push(bid);
  await write(store);
  return bid;
}

export async function approveBid(id: string, adminKey: string) {
  const expected = process.env.ADMIN_KEY;
  if (!expected || adminKey !== expected) throw new Error("Bad admin key");
  const store = await read();
  const bid = store.bids.find((b) => b.id === id);
  if (!bid) throw new Error("Bid not found");
  bid.approved = true;
  await write(store);
  return bid;
}
