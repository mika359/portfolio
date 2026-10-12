"use client";

import { useSyncExternalStore } from "react";

/**
 * What the hero lion is asked to do. It is kept on <html data-lion="..."> so the canvas can read it
 * every frame without React re-renders, and the button subscribes to it.
 *  - sit:  rests (default), follows the mouse with its head and yawns from time to time
 *  - walk: walks across the hero
 */
export type LionMode = "sit" | "walk";

const listeners = new Set<() => void>();

export function getLionMode(): LionMode {
  return document.documentElement.dataset.lion === "walk" ? "walk" : "sit";
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
