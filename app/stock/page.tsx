"use client";
import { useEffect, useState } from "react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    History,
    ArrowUpCircle,
    ArrowDownCircle,
    Filter,
    PackagePlus,
    Search
} from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/Pagination";
import ProductSearch from "@/components/ProductSearch";


interface StockMovement {
    id: number;
    product_name: string;
    quantity_change: number;
    movement_type: 'entry' | 'sale' | 'loss';
    description: string;
    timestamp: string;
}

export default function StockPage() {
    const { role } = useAuth();
    const router = useRouter();

    // Dados
    const [movements, setMovements] = useState<StockMovement[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Filtros
    const [filterType, setFilterType] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Formulário de Entrada
    const [selectedProduct, setSelectedProduct] = useState("");
    const [entryQuantity, setEntryQuantity] = useState("");
    const [loadingEntry, setLoadingEntry] = useState(false);

    useEffect(() => {
        if (role !== "admin" && role !== "manager") {
            router.push("/");
            return;
        }
        fetchHistory();
    }, [role]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterType, startDate, endDate]);

    // Busca Histórico com Filtros
    const fetchHistory = async () => {
        try {
            const params = new URLSearchParams();
            if (filterType) params.append("movement_type", filterType);
            if (startDate) params.append("start_date", startDate);
            if (endDate) params.append("end_date", endDate);

            const res = await api.get(`/stock/history?${params.toString()}`);
            setMovements(res.data);
        } catch (error) {
            toast.error("Erro ao carregar histórico");
        }
    };

    // Registrar Entrada (Ação do Formulário)
    const handleEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !entryQuantity) {
            toast.warning("Selecione um produto e a quantidade.");
            return;
        }

        setLoadingEntry(true);
        try {
            await api.post(`/products/${selectedProduct}/stock`, null, {
                params: { quantity: entryQuantity }
            });

            toast.success("Entrada registrada com sucesso!");
            setEntryQuantity("");
            fetchHistory(); // Atualiza a tabela na hora
        } catch (error: any) {
            toast.error("Erro ao registrar entrada");
        } finally {
            setLoadingEntry(false);
        }
    };

    const totalPages = Math.ceil(movements.length / itemsPerPage);
    const currentItems = movements.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Cabeçalho */}
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/" className="bg-white p-2 rounded-full shadow hover:bg-gray-50 text-gray-600">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <History /> Histórico e Movimentação
                    </h1>
                </div>

                {/* CARD: Nova Entrada de Estoque */}
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-4">
                        <PackagePlus className="text-blue-500" /> Registrar Entrada (Compra/Reposição)
                    </h2>
                    <form onSubmit={handleEntry} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Produto</label>
                            <ProductSearch
                                value={selectedProduct}
                                onChange={(productId) => setSelectedProduct(productId)}
                                placeholder="Buscar produto por nome..."
                            />
                        </div>
                        <div className="w-full md:w-32">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Qtd.</label>
                            <input
                                type="number"
                                step="1"
                                min="1"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500"
                                value={entryQuantity}
                                onChange={e => setEntryQuantity(e.target.value)}
                            />
                        </div>
                        <button
                            disabled={loadingEntry}
                            className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition disabled:opacity-70"
                        >
                            {loadingEntry ? "Salvando..." : "Confirmar Entrada"}
                        </button>
                    </form>
                </div>

                {/* BARRA DE FILTROS E TABELA */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {/* Filtros */}
                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 text-gray-500 font-medium">
                            <Filter size={18} /> Filtros:
                        </div>

                        <select
                            className="p-2 border border-gray-300 rounded text-sm"
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                        >
                            <option value="">Todas as Ações</option>
                            <option value="entry">Entradas</option>
                            <option value="sale">Vendas</option>
                            <option value="loss">Perdas/Ajustes</option>
                        </select>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">De:</span>
                            <input
                                type="date"
                                className="p-2 border border-gray-300 rounded text-sm"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Até:</span>
                            <input
                                type="date"
                                className="p-2 border border-gray-300 rounded text-sm"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={fetchHistory}
                            className="ml-auto bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-full"
                            title="Aplicar Filtros"
                        >
                            <Search size={18} />
                        </button>
                    </div>

                    {/* Tabela */}
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                            <tr>
                                <th className="p-4 border-b">Data/Hora</th>
                                <th className="p-4 border-b">Produto</th>
                                <th className="p-4 border-b">Tipo</th>
                                <th className="p-4 border-b">Qtd.</th>
                                <th className="p-4 border-b">Descrição</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                            {currentItems.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhum registro encontrado no período.</td></tr>
                            ) : (
                                currentItems.map((mov) => (
                                    <tr key={mov.id} className="hover:bg-gray-50">
                                        <td className="p-4 text-gray-500">
                                            {new Date(mov.timestamp).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="p-4 font-medium">{mov.product_name}</td>
                                        <td className="p-4">
                                            <span className={`flex items-center gap-1 w-fit px-2 py-1 rounded text-xs font-bold uppercase
                                        ${mov.movement_type === 'entry' ? 'bg-blue-100 text-blue-700' :
                                                    mov.movement_type === 'sale' ? 'bg-green-100 text-green-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                {mov.movement_type === 'entry' && <ArrowUpCircle size={14} />}
                                                {mov.movement_type === 'sale' && <ArrowDownCircle size={14} />}
                                                {mov.movement_type === 'loss' && <ArrowDownCircle size={14} />}

                                                {mov.movement_type === 'entry' ? 'Entrada' :
                                                    mov.movement_type === 'sale' ? 'Venda' : 'Perda'}
                                            </span>
                                        </td>
                                        <td className={`p-4 font-bold ${mov.quantity_change > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                                            {mov.quantity_change > 0 ? '+' : ''}{mov.quantity_change}
                                        </td>
                                        <td className="p-4 text-gray-500 truncate max-w-xs" title={mov.description || ''}>
                                            {mov.description || '-'}
                                        </td>
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
                    totalItems={movements.length}
                    itemsPerPage={itemsPerPage}
                />
            </div>
        </div>
    );
}