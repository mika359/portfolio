"use client";

import { useSyncExternalStore } from "react";

/**
 * What the hero lion is asked to do. It is kept on <html data-lion="..."> so the canvas can read it
 * every frame without React re-renders, and the buttons subscribe to it.
 *  - sit:   rests (default), head turns and it yawns from time to time
 *  - walk:  walks across the hero
 *  - watch: rests and follows the mouse with its head
 */
export type LionMode = "sit" | "walk" | "watch";

const listeners = new Set<() => void>();

export function getLionMode(): LionMode {
  const v = document.documentElement.dataset.lion;
  return v === "walk" || v === "watch" ? v : "sit";
}

export function setLionMode(mode: LionMode) {
  document.documentElement.dataset.lion = mode;
  listeners.forEach((cb) => cb());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export function useLionMode(): LionMode {
  return useSyncExternalStore(subscribe, getLionMode, () => "sit" as LionMode);
}
