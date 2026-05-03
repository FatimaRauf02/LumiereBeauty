import { useState, useCallback, useEffect } from "react";
import type { Product } from "@workspace/api-client-react";

const KEY = "lumiere_recently_viewed";
const MAX = 8;

function readStorage(): Product[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: Product[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<Product[]>(readStorage);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addRecentlyViewed = useCallback((product: Product) => {
    setItems(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      const next = [product, ...filtered].slice(0, MAX);
      writeStorage(next);
      return next;
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    writeStorage([]);
    setItems([]);
  }, []);

  return { items, addRecentlyViewed, clearRecentlyViewed };
}
