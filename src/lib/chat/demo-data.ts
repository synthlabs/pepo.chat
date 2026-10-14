import { POOL, type Badge } from "./mock-chat";

export interface DemoMessage {
  id: number;
  ts: string;
  user: string;
  color: string;
  badges: Badge[];
  text: string;
  you?: boolean;
}

/** Frozen chat rows for the demo window - pool indexes chosen to show every badge type, multi-badge rows, and varied emotes. */
export const DEMO_SNAPSHOT = [5, 2, 3, 23, 13, 1, 21, 15, 18];
export const DEMO_TIMES = [
  "9:41",
  "9:42",
  "9:43",
  "9:43",
  "9:44",
  "9:45",
  "9:45",
  "9:46",
  "9:47",
];

export function demoSnapshot(): DemoMessage[] {
  return DEMO_SNAPSHOT.flatMap((poolIndex, i) => {
    const src = POOL[poolIndex];
    if (!src) return [];
    return [
      {
        id: i,
        ts: DEMO_TIMES[i] ?? "9:47",
        user: src.user,
        color: src.color,
        badges: src.badges,
        text: src.text(),
      },
    ];
  });
}

/** First id a visitor-sent message can take. */
export const DEMO_NEXT_ID = DEMO_SNAPSHOT.length;

export interface DemoChannel {
  login: string;
  live: boolean;
  viewers: number;
  color: string;
}

export const DEMO_CHANNELS: DemoChannel[] = [
  { login: "laurendev", live: true, viewers: 4213, color: "#e91916" },
  { login: "clip_farmer", live: true, viewers: 12004, color: "#00bcd4" },
  { login: "synthlabs", live: true, viewers: 891, color: "#8a2be2" },
  { login: "gamer_kim", live: false, viewers: 0, color: "#1e90ff" },
  { login: "kappa_kate", live: false, viewers: 0, color: "#ff69b4" },
  { login: "mod_wren", live: false, viewers: 0, color: "#00ad03" },
];

export const DEMO_ACTIVE = "laurendev";
export const DEMO_MAX_MESSAGES = 14;

/** Deterministic viewer formatting (no toLocaleString - keeps SSR and hydration identical). */
export function formatViewers(viewers: number): string {
  if (viewers >= 1000) {
    const k = viewers / 1000;
    return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}K`;
  }
  return String(viewers);
}
