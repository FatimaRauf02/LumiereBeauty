import { useState, useCallback, useEffect } from "react";
import type { Product } from "@workspace/api-client-react";

const KEY = "lumiere_compare";
const MAX = 3;

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

export function useCompare() {
  const [items, setItems] = useState<Product[]>(readStorage);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addToCompare = useCallback((product: Product) => {
    setItems(prev => {
      if (prev.some(p => p.id === product.id)) return prev;
      if (prev.length >= MAX) return prev;
      const next = [...prev, product];
      writeStorage(next);
      return next;
    });
  }, []);

  const removeFromCompare = useCallback((productId: number) => {
    setItems(prev => {
      const next = prev.filter(p => p.id !== productId);
      writeStorage(next);
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    writeStorage([]);
    setItems([]);
  }, []);

  const isInCompare = useCallback(
    (productId: number) => items.some(p => p.id === productId),
    [items]
  );

  const isFull = items.length >= MAX;

  return { items, addToCompare, removeFromCompare, clearCompare, isInCompare, isFull };
}
