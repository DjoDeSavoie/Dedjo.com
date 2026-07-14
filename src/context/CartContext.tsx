import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";
import {
  VIENNOISERIES,
  FEUILLETES,
  viennoPrice,
  friandPrice,
} from "@/lib/catalog";

type Counts = Record<string, number>;

interface CartContextValue {
  vienno: Counts;
  friand: Counts;
  addVienno: (id: string, delta: number) => void;
  addFriand: (id: string, delta: number) => void;
  setVienno: (id: string, qty: number) => void;
  setFriand: (id: string, qty: number) => void;
  clear: () => void;
  viennoCount: number;
  friandCount: number;
  totalItems: number;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const buildInitial = (products: { id: string }[]): Counts =>
  products.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {} as Counts);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [vienno, setViennoState] = useState<Counts>(() => buildInitial(VIENNOISERIES));
  const [friand, setFriandState] = useState<Counts>(() => buildInitial(FEUILLETES));

  const addVienno = useCallback((id: string, delta: number) => {
    setViennoState((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  }, []);
  const addFriand = useCallback((id: string, delta: number) => {
    setFriandState((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  }, []);
  const setVienno = useCallback((id: string, qty: number) => {
    setViennoState((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  }, []);
  const setFriand = useCallback((id: string, qty: number) => {
    setFriandState((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  }, []);
  const clear = useCallback(() => {
    setViennoState(buildInitial(VIENNOISERIES));
    setFriandState(buildInitial(FEUILLETES));
  }, []);

  const viennoCount = useMemo(
    () => Object.values(vienno).reduce((a, b) => a + b, 0),
    [vienno]
  );
  const friandCount = useMemo(
    () => Object.values(friand).reduce((a, b) => a + b, 0),
    [friand]
  );
  const total = useMemo(
    () => (viennoPrice(viennoCount) || 0) + friandPrice(friandCount),
    [viennoCount, friandCount]
  );

  const value: CartContextValue = {
    vienno,
    friand,
    addVienno,
    addFriand,
    setVienno,
    setFriand,
    clear,
    viennoCount,
    friandCount,
    totalItems: viennoCount + friandCount,
    total,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé à l'intérieur d'un <CartProvider>");
  return ctx;
};
