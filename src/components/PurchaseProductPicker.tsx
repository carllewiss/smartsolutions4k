import { useEffect, useRef, useState, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/hooks/useProducts";

export interface PickerProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  is_service: boolean;
}

interface Props {
  value?: string;
  onSelect: (product: PickerProduct) => void;
  placeholder?: string;
}

export function PurchaseProductPicker({ onSelect, value, placeholder = "Search product..." }: Props) {
  const { data: products = [], isLoading } = useProducts();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Show selected product name as initial value
  useEffect(() => {
    if (value && products.length) {
      const p = products.find(x => x.id === value);
      if (p) setQuery(p.name);
    }
  }, [value, products]);

  const results = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    const list = !q ? products : products.filter((p: any) =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
    return list.slice(0, 50);
  }, [debounced, products]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-7 h-9 text-sm"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover shadow-elegant rounded-md border max-h-72 overflow-y-auto">
          <ul className="divide-y">
            {results.map((p: any) => (
              <li key={p.id}
                onMouseDown={() => { onSelect(p); setQuery(p.name); setOpen(false); }}
                className="px-3 py-2 cursor-pointer hover:bg-accent-soft">
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.category} · {p.is_service ? "Service" : p.unit}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
