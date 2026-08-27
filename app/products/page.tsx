"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
    ArrowLeft,
    Search,
    Plus,
    Edit2,
    Trash2,
    Package,
    Eye,
    EyeOff
} from "lucide-react";
import Pagination from "@/components/Pagination";
import { toast } from "sonner";

interface Product {
    id: number;
    name: string;
    barcode: string | null;
    price: number;
    stock_quantity: number;
    min_stock: number;
    category: string | null;
    is_active: boolean;
    is_weighted: boolean;
}

export default function ProductList() {
    const { role } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;

    // Permissão: Apenas Admin e Manager podem editar/excluir
    const canManage = role === "admin" || role === "manager";

    const fetchProducts = useCallback(async (page: number, searchTerm: string) => {
        setLoading(true);
        try {
            const skip = (page - 1) * itemsPerPage;
            const params = new URLSearchParams({
                skip: String(skip),
                limit: String(itemsPerPage),
            });
            if (searchTerm) params.append("search", searchTerm);

            const res = await api.get(`/products/?${params.toString()}`);
            setProducts(res.data.items);
            setTotalItems(res.data.total);
            setTotalPages(res.data.total_pages);
        } catch (error) {
            toast.error("Erro ao carregar produtos");
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

    useEffect(() => {
        fetchProducts(currentPage, search);
    }, [currentPage, fetchProducts]);

    // Debounce para busca
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1);
            fetchProducts(1, search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, fetchProducts]);

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) return;

        try {
            await api.delete(`/products/${id}`);
            toast.success("Produto excluído com sucesso!");
            fetchProducts(currentPage, search);
        } catch (error: any) {
            const msg = error.response?.data?.detail || "Erro ao excluir produto";
            toast.error(msg);
        }
    };

    const toggleStatus = async (product: Product) => {
        try {
            const newStatus = !product.is_active;

            const payload = {
                ...product,
                is_active: newStatus
            };

            await api.put(`/products/${product.id}`, payload);

            toast.success(`Produto ${newStatus ? 'Ativado' : 'Desativado'}!`);

            // Atualiza lista local
            setProducts(prev => prev.map(p =>
                p.id === product.id ? { ...p, is_active: newStatus } : p
            ));

        } catch (error) {
            toast.error("Erro ao alterar status");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto">

                {/* Cabeçalho */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="bg-white p-2 rounded-full shadow hover:bg-gray-50 text-gray-600">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Package /> Produtos
                            </h1>
                            <p className="text-sm text-gray-500">{totalItems} itens cadastrados</p>
                        </div>
                    </div>

                    {canManage && (
                        <Link
                            href="/products/create"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition"
                        >
                            <Plus size={20} /> Novo Produto
                        </Link>
                    )}
                </div>

                {/* Barra de Ferramentas (Busca) */}
                <div className="bg-white p-4 rounded-t-lg border-b border-gray-200 flex items-center gap-2">
                    <Search className="text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou código de barras..."
                        className="flex-1 outline-none text-gray-700"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Tabela */}
                <div className="bg-white shadow-sm rounded-b-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                            <tr>
                                <th className="p-4 border-b">ID</th>
                                <th className="p-4 border-b">Produto</th>
                                <th className="p-4 border-b">Categoria</th>
                                <th className="p-4 border-b">Preço</th>
                                <th className="p-4 border-b">Estoque</th>
                                <th className="p-4 border-b">Estoque Mínimo</th>
                                <th className="p-4 border-b">Status</th>
                                {canManage && <th className="p-4 border-b text-center">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-500">Nenhum produto encontrado.</td></tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 text-gray-500">#{product.id}</td>
                                        <td className="p-4 font-medium text-gray-800">
                                            {product.name}
                                            {product.barcode && <span className="block text-xs text-gray-400">{product.barcode}</span>}
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                                {product.category || "Geral"}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-gray-800">R$ {product.price.toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${product.stock_quantity > 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                                                {product.is_weighted ? product.stock_quantity.toFixed(2) : product.stock_quantity} {product.is_weighted ? "kg" : "un"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold`}>
                                                {product.min_stock} {product.is_weighted ? "kg" : "un"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                {product.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        {canManage && (
                                            <td className="p-4 flex justify-center gap-2">
                                                <button
                                                    onClick={() => toggleStatus(product)}
                                                    className={`p-2 rounded transition ${product.is_active ? 'text-gray-400 hover:text-gray-600' : 'text-gray-400 hover:text-green-600'}`}
                                                    title={product.is_active ? "Desativar Produto" : "Ativar Produto"}
                                                >
                                                    {product.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                                </button>
                                                <Link
                                                    href={`/products/edit/${product.id}`}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product.id, product.name)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                />
            </div>
        </div>
    );
}
