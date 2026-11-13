import { NextResponse } from "next/server";

/**
 * "On this day": one historical event for today's date, from Wikipedia's free
 * public feed (no key). Picks the event of the day deterministically so every
 * visitor sees the same line for a day. Cached for 6 hours.
 */
export const revalidate = 21600;

type Event = { text?: string; year?: number };

export async function GET() {
  const now = new Date();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  try {
    const r = await fetch(`https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/${mm}/${dd}`, {
      headers: { "User-Agent": "mira-hud (open-source demo)" },
      next: { revalidate: 21600 },
    });
    const d = await r.json();
    const events: Event[] = (d.selected || []).filter((e: Event) => e.text && e.year);
    if (!events.length) return NextResponse.json({ text: "" });
    const pick = events[(Number(mm) * 31 + Number(dd)) % events.length];
    return NextResponse.json({ text: `${pick.year} - ${pick.text}` });
  } catch {
    return NextResponse.json({ text: "" });
  }
}
