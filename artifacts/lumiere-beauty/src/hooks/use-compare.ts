import { useState, useCallback, useEffect, useSyncExternalStore } from "react";
import type { Product } from "@workspace/api-client-react";

const KEY = "lumiere_compare";
const MAX = 3;

// Keep a module-level copy so all hook instances share the same reference
let currentItems: Product[] = (() => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
})();

const listeners = new Set<() => void>();

function notifyAll() {
  listeners.forEach(fn => fn());
}

function writeStorage(items: Product[]) {
  currentItems = items;
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  notifyAll();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  // Also listen for cross-tab changes
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      try {
        currentItems = e.newValue ? JSON.parse(e.newValue) : [];
      } catch {
        currentItems = [];
      }
      notifyAll();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return currentItems;
}

export function useCompare() {
  const items = useSyncExternalStore(subscribe, getSnapshot);

  const addToCompare = useCallback((product: Product) => {
    if (currentItems.some(p => p.id === product.id)) return;
    if (currentItems.length >= MAX) return;
    writeStorage([...currentItems, product]);
  }, []);

  const removeFromCompare = useCallback((productId: number) => {
    writeStorage(currentItems.filter(p => p.id !== productId));
  }, []);

  const clearCompare = useCallback(() => {
    writeStorage([]);
  }, []);

  const isInCompare = useCallback(
    (productId: number) => currentItems.some(p => p.id === productId),
    [items]
  );

  const isFull = items.length >= MAX;

  return { items, addToCompare, removeFromCompare, clearCompare, isInCompare, isFull };
}