import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";
import { VIENNOISERIES, FEUILLETES, countSachets, sachetsTotal } from "@/lib/catalog";

/** Nombre de sachets par produit (id → quantité). */
type Counts = Record<string, number>;

interface CartContextValue {
  vienno: Counts;
  friand: Counts;
  addVienno: (id: string, delta: number) => void;
  addFriand: (id: string, delta: number) => void;
  clear: () => void;
  viennoSachets: number;
  friandSachets: number;
  totalSachets: number;
  viennoTotal: number;
  friandTotal: number;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const buildInitial = (products: { id: string }[]): Counts =>
  products.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {} as Counts);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [vienno, setVienno] = useState<Counts>(() => buildInitial(VIENNOISERIES));
  const [friand, setFriand] = useState<Counts>(() => buildInitial(FEUILLETES));

  const addVienno = useCallback((id: string, delta: number) => {
    setVienno((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  }, []);
  const addFriand = useCallback((id: string, delta: number) => {
    setFriand((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  }, []);
  const clear = useCallback(() => {
    setVienno(buildInitial(VIENNOISERIES));
    setFriand(buildInitial(FEUILLETES));
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const viennoSachets = countSachets(vienno);
    const friandSachets = countSachets(friand);
    const viennoTotal = sachetsTotal(VIENNOISERIES, vienno);
    const friandTotal = sachetsTotal(FEUILLETES, friand);
    return {
      vienno,
      friand,
      addVienno,
      addFriand,
      clear,
      viennoSachets,
      friandSachets,
      totalSachets: viennoSachets + friandSachets,
      viennoTotal,
      friandTotal,
      total: viennoTotal + friandTotal,
    };
  }, [vienno, friand, addVienno, addFriand, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé à l'intérieur d'un <CartProvider>");
  return ctx;
};
