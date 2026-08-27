"use client";
import { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import { Search, Package, Loader2 } from "lucide-react";

interface Product {
    id: number;
    name: string;
    barcode?: string;
    stock_quantity: number;
    is_weighted: boolean;
}

interface ProductSearchProps {
    value: string;
    onChange: (productId: string, product: Product | null) => void;
    placeholder?: string;
}

export default function ProductSearch({ value, onChange, placeholder = "Buscar produto por nome..." }: ProductSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!value && query) {
            setQuery("");
        }
    }, [value]);

    const searchProducts = async (searchTerm: string) => {
        if (searchTerm.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: searchTerm,
                active_only: "true",
                limit: "10",
            });
            const res = await api.get(`/products/?${params.toString()}`);
            setResults(res.data.items);
            setIsOpen(res.data.items.length > 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchProducts(val), 300);
    };

    const handleSelect = (product: Product) => {
        setQuery(product.name);
        setIsOpen(false);
        onChange(String(product.id), product);
    };

    const handleClear = () => {
        setQuery("");
        setResults([]);
        setIsOpen(false);
        onChange("", null);
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    className="w-full pl-9 pr-8 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (results.length > 0) setIsOpen(true);
                    }}
                />
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        ×
                    </button>
                )}
                {loading && (
                    <Loader2 size={16} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {results.map((product) => (
                        <button
                            key={product.id}
                            type="button"
                            onClick={() => handleSelect(product)}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                        >
                            <Package size={16} className="text-gray-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 truncate">{product.name}</p>
                                <p className="text-xs text-gray-500">
                                    {product.barcode && `EAN: ${product.barcode} · `}
                                    Estoque: {product.is_weighted ? product.stock_quantity.toFixed(2) : product.stock_quantity}
                                    {product.is_weighted && " kg"}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {isOpen && query.length >= 2 && results.length === 0 && !loading && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    Nenhum produto encontrado
                </div>
            )}
        </div>
    );
}
