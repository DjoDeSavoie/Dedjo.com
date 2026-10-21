import { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { VIENNOISERIES, FEUILLETES, countSachets, sachetsTotal } from "@/lib/catalog";
import { useDisponibilite } from "@/hooks/useDisponibilite";

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

  const { statut } = useDisponibilite();

  // Seul un produit disponible peut être ajouté (le retrait reste toujours possible)
  const addVienno = useCallback(
    (id: string, delta: number) => {
      if (delta > 0 && statut(id) !== "disponible") return;
      setVienno((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
    },
    [statut]
  );
  const addFriand = useCallback(
    (id: string, delta: number) => {
      if (delta > 0 && statut(id) !== "disponible") return;
      setFriand((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
    },
    [statut]
  );

  // Un produit qui passe à « victime » pendant la visite quitte le panier, avec un message
  useEffect(() => {
    const retirer = (produits: { id: string; name: string }[], panier: Counts, vider: (ids: string[]) => void) => {
      const partis = produits.filter((p) => (panier[p.id] || 0) > 0 && statut(p.id) === "victime");
      if (!partis.length) return;
      vider(partis.map((p) => p.id));
      partis.forEach((p) => toast.warning(`${p.name} est victime de son succès, on l'a retiré de ton panier.`));
    };
    const sans = (ids: string[]) => (prev: Counts) => ids.reduce((o, id) => ({ ...o, [id]: 0 }), prev);
    retirer(VIENNOISERIES, vienno, (ids) => setVienno(sans(ids)));
    retirer(FEUILLETES, friand, (ids) => setFriand(sans(ids)));
  }, [statut, vienno, friand]);

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
