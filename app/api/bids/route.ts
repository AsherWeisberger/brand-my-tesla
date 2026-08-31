import { NextResponse } from "next/server";
import { getState, placeBid } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getState();
  const publicState = {
    auctionEnd: state.auctionEnd,
    raised: state.raised,
    taken: state.taken,
    spots: state.spots.map((s) => ({
      id: s.id,
      name: s.name,
      hint: s.hint,
      size: s.size,
      dim: s.dim,
      dimIn: s.dimIn,
      opening: s.opening,
      current: s.current,
      bidCount: s.bidCount,
      holder: s.holder,
    })),
    history: state.history.map((b) => ({
      id: b.id,
      spotId: b.spotId,
      amount: b.amount,
      brand: b.brand,
      createdAt: b.createdAt,
    })),
  };
  return NextResponse.json(publicState);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const bid = await placeBid({
      spotId: Number(body.spotId),
      amount: Number(body.amount),
      brand: String(body.brand ?? ""),
      email: String(body.email ?? ""),
      website: body.website ? String(body.website) : undefined,
      x: body.x ? String(body.x) : undefined,
      logoDataUrl: body.logoDataUrl ? String(body.logoDataUrl) : undefined,
    });
    const state = await getState();
    return NextResponse.json({ ok: true, bidId: bid.id, deposit: bid.deposit, state });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not place bid";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
