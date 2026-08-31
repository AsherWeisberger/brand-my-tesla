import { NextResponse } from "next/server";
import { approveBid, getState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await approveBid(String(body.id), String(body.key ?? ""));
    return NextResponse.json({ ok: true, state: await getState() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nope";
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }
}
