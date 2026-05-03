import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useGetCart, useAddToCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from "@workspace/api-client-react";
import type { Cart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCartQueryKey } from "@workspace/api-client-react";

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  sessionId: string;
  addToCart: (productId: number, quantity?: number, variantLabel?: string) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string>("");
  const queryClient = useQueryClient();

  useEffect(() => {
    let id = localStorage.getItem("lumiere_cart_session");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      localStorage.setItem("lumiere_cart_session", id);
    }
    setSessionId(id);
  }, []);

  const cartRequest = sessionId ? { headers: { "x-session-id": sessionId } } : undefined;

  const { data: cart, isLoading } = useGetCart({ request: cartRequest }, { query: { enabled: !!sessionId } });

  const addMutation = useAddToCart({ request: cartRequest });
  const updateMutation = useUpdateCartItem({ request: cartRequest });
  const removeMutation = useRemoveCartItem({ request: cartRequest });
  const clearMutation = useClearCart({ request: cartRequest });

  const invalidateCart = () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });

  const addToCart = async (productId: number, quantity = 1, variantLabel?: string) => {
    await addMutation.mutateAsync({ data: { productId, quantity, ...(variantLabel ? { variantLabel } : {}) } as any });
    await invalidateCart();
  };
  const updateItem = async (itemId: number, quantity: number) => {
    await updateMutation.mutateAsync({ itemId: String(itemId), data: { quantity } });
    await invalidateCart();
  };
  const removeItem = async (itemId: number) => {
    await removeMutation.mutateAsync({ itemId: String(itemId) });
    await invalidateCart();
  };
  const clearCart = async () => {
    await clearMutation.mutateAsync();
    await invalidateCart();
  };

  return (
    <CartContext.Provider value={{ cart: cart ?? null, isLoading, sessionId, addToCart, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
