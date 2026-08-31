export type SpotSize = "S" | "M" | "L";

export type Spot = {
  id: number;
  name: string;
  hint: string;
  size: SpotSize;
  dim: string;
  dimIn: string;
  opening: number;
};

export const AUCTION_END = process.env.AUCTION_END ?? "2026-09-15T06:59:00.000Z"; // 2026-09-14 23:59 America/Los_Angeles
export const MIN_RAISE = 50;
export const DEPOSIT_RATE = 0.2;
export const DEPOSIT_MIN = 25;

export const SPOTS: Spot[] = [
  { id: 1, name: "Hood", hint: "center of the hood", size: "L", dim: "9.5 × 5.5 cm", dimIn: "3.7 × 2.2 in", opening: 1000 },
  { id: 2, name: "Driver door", hint: "front door, driver", size: "L", dim: "9.5 × 5.5 cm", dimIn: "3.7 × 2.2 in", opening: 750 },
  { id: 3, name: "Passenger door", hint: "front door, passenger", size: "L", dim: "9.5 × 5.5 cm", dimIn: "3.7 × 2.2 in", opening: 750 },
  { id: 4, name: "Driver rear door", hint: "rear door, driver", size: "M", dim: "9.5 × 4 cm", dimIn: "3.7 × 1.6 in", opening: 500 },
  { id: 5, name: "Passenger rear door", hint: "rear door, passenger", size: "M", dim: "9.5 × 4 cm", dimIn: "3.7 × 1.6 in", opening: 500 },
  { id: 6, name: "Front bumper left", hint: "driver side of the front bumper", size: "M", dim: "9.5 × 4 cm", dimIn: "3.7 × 1.6 in", opening: 500 },
  { id: 7, name: "Front bumper right", hint: "passenger side of the front bumper", size: "M", dim: "9.5 × 4 cm", dimIn: "3.7 × 1.6 in", opening: 500 },
  { id: 8, name: "Trunk left", hint: "left side of the trunk", size: "L", dim: "9.5 × 5.5 cm", dimIn: "3.7 × 2.2 in", opening: 750 },
  { id: 9, name: "Trunk right", hint: "right side of the trunk", size: "L", dim: "9.5 × 5.5 cm", dimIn: "3.7 × 2.2 in", opening: 750 },
  { id: 10, name: "Rear bumper left", hint: "driver side of the rear bumper", size: "S", dim: "4.5 × 4.5 cm", dimIn: "1.8 × 1.8 in", opening: 250 },
  { id: 11, name: "Rear bumper right", hint: "passenger side of the rear bumper", size: "S", dim: "4.5 × 4.5 cm", dimIn: "1.8 × 1.8 in", opening: 250 },
];

export const SIZE_LABEL: Record<SpotSize, string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
};

export function minimumBid(current: number) {
  return current + MIN_RAISE;
}

export function depositFor(amount: number) {
  return Math.max(DEPOSIT_MIN, Math.round(amount * DEPOSIT_RATE));
}

export function usd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
