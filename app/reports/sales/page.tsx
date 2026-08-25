"use client";
import { useEffect, useState } from "react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Calendar, Monitor, User, Receipt, DollarSign, Clock,
    FileText, CheckCircle, XCircle, Loader2, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

// Interfaces
interface UserData {
    id: number;
    name: string;
    username: string;
    role: string;
    is_active: boolean;
}

interface Session {
    id: number;
    terminal_id: string;
    start_time: string;
    end_time: string | null;
    initial_balance: number;
    final_balance: number | null;
    status: string;
}

interface SaleItem {
    product: { name: string, is_weighted: boolean };
    quantity: number;
    unit_price: number;
    subtotal: number;
}

interface Sale {
    id: number;
    total_amount: number;
    payment_method: string;
    timestamp: string;
    items: SaleItem[];
    seller: UserData;
    nfce_status: string;
    nfce_chave: string | null;
    nfce_protocolo: string | null;
    nfce_numero: number | null;
}

export default function SalesReport() {
    const { role } = useAuth();
    const router = useRouter();

    // Estados
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // Hoje YYYY-MM-DD
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
    const [sales, setSales] = useState<Sale[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [loadingSales, setLoadingSales] = useState(false);

    // Proteção
    useEffect(() => {
        if (role !== "admin" && role !== "manager") {
            router.push("/");
        }
    }, [role]);

    // Carregar Sessões ao mudar a data
    useEffect(() => {
        fetchSessions();
        setSelectedSessionId(null);
        setSales([]);
    }, [date]);

    // Carregar Vendas ao selecionar sessão
    useEffect(() => {
        if (selectedSessionId) {
            fetchSales(selectedSessionId);
        }
    }, [selectedSessionId]);

    const fetchSessions = async () => {
        setLoadingSessions(true);
        try {
            const res = await api.get(`/cashier/history?day=${date}`);
            setSessions(res.data);
        } catch (error) {
            toast.error("Erro ao buscar caixas.");
        } finally {
            setLoadingSessions(false);
        }
    };

    const fetchSales = async (sessionId: number) => {
        setLoadingSales(true);
        try {
            const res = await api.get(`/sales/?session_id=${sessionId}`);
            setSales(res.data);
        } catch (error) {
            toast.error("Erro ao buscar vendas.");
        } finally {
            setLoadingSales(false);
        }
    };

    const handleReimprimirNFCE = async (saleId: number) => {
        try {
            const { data } = await api.get(`/sales/${saleId}/nfce/danfe`);
            if (data.success && data.html) {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(data.html);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                        printWindow.print();
                    }, 500);
                }
                toast.success("DANFE gerado com sucesso!");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao gerar DANFE");
        }
    };

    const handleReprocessarNFCE = async (saleId: number) => {
        try {
            toast.info("Reenviando NFC-e para a SEFAZ...");
            const { data } = await api.post(`/sales/${saleId}/nfce/reprocessar`);
            
            if (data.success) {
                toast.success("NFC-e autorizada com sucesso!");
                // Atualizar venda na lista
                setSales(prev => prev.map(sale => 
                    sale.id === saleId 
                        ? { ...sale, nfce_status: 'autorizada', nfce_chave: data.chave, nfce_protocolo: data.protocolo }
                        : sale
                ));
            } else {
                toast.error(data.message || "NFC-e rejeitada novamente");
                // Atualizar status na lista
                setSales(prev => prev.map(sale => 
                    sale.id === saleId 
                        ? { ...sale, nfce_status: 'rejeitada' }
                        : sale
                ));
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao reprocessar NFC-e");
        }
    };

    const getNFCeStatusBadge = (status: string) => {
        switch (status) {
            case 'autorizada':
                return (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
                        <CheckCircle size={12} /> Autorizada
                    </span>
                );
            case 'rejeitada':
                return (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold">
                        <XCircle size={12} /> Rejeitada
                    </span>
                );
            case 'pendente':
                return (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
                        <Clock size={12} /> Pendente
                    </span>
                );
            case 'desabilitado':
                return (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                        -
                    </span>
                );
            default:
                return null;
        }
    };

    // Cálculos de Resumo
    const totalSalesValue = sales.reduce((acc, sale) => acc + sale.total_amount, 0);

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto flex flex-col h-[90vh]">

                {/* CABEÇALHO */}
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="bg-white p-2 rounded-full shadow hover:bg-gray-50 text-gray-600">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Receipt /> Relatório de Vendas
                            </h1>
                            <p className="text-sm text-gray-500">Consulte caixas e vendas por período</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                        <Calendar className="text-gray-400" size={20} />
                        <input
                            type="date"
                            className="outline-none text-gray-700 font-medium"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* CONTEÚDO DIVIDIDO EM DUAS COLUNAS */}
                <div className="flex gap-6 flex-1 overflow-hidden">

                    {/* COLUNA 1: LISTA DE CAIXAS (SESSÕES) */}
                    <div className="w-1/3 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
                            Caixas do Dia ({sessions.length})
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {loadingSessions ? (
                                <p className="text-center p-4 text-gray-500">Carregando...</p>
                            ) : sessions.length === 0 ? (
                                <p className="text-center p-8 text-gray-400">Nenhum caixa aberto nesta data.</p>
                            ) : (
                                sessions.map(session => (
                                    <button
                                        key={session.id}
                                        onClick={() => setSelectedSessionId(session.id)}
                                        className={`w-full text-left p-4 rounded-lg border transition-all ${selectedSessionId === session.id
                                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                            : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-800 flex items-center gap-2">
                                                <Monitor size={16} className="text-gray-400" />
                                                {session.terminal_id}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${session.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {session.status === 'open' ? 'Aberto' : 'Fechado'}
                                            </span>
                                        </div>

                                        <div className="text-xs text-gray-500 space-y-1">
                                            <p className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(session.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                {session.end_time && ` - ${new Date(session.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                                            </p>
                                            <p>Fundo: R$ {session.initial_balance.toFixed(2)}</p>
                                            {session.final_balance && <p>Fechamento: R$ {session.final_balance.toFixed(2)}</p>}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* COLUNA 2: LISTA DE VENDAS DA SESSÃO SELECIONADA */}
                    <div className="w-2/3 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {!selectedSessionId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <Monitor size={48} className="mb-2 opacity-20" />
                                <p>Selecione um caixa ao lado para ver as vendas.</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                    <h2 className="font-bold text-gray-700">Vendas Realizadas</h2>
                                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                                        <DollarSign size={16} /> Total: R$ {totalSalesValue.toFixed(2)}
                                    </div>
                                </div>

                                <div className="overflow-y-auto flex-1 p-4 space-y-4">
                                    {loadingSales ? (
                                        <p className="text-center p-4">Carregando vendas...</p>
                                    ) : sales.length === 0 ? (
                                        <p className="text-center p-8 text-gray-400">Nenhuma venda registrada neste caixa.</p>
                                    ) : (
                                        sales.map(sale => (
                                            <div key={sale.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition bg-white">
                                                <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-bold text-gray-800">Venda #{sale.id}</span>
                                                            {getNFCeStatusBadge(sale.nfce_status)}
                                                        </div>
                                                        <span className="text-xs text-gray-500 mt-1">
                                                            {new Date(sale.timestamp).toLocaleTimeString('pt-BR')} • {sale.payment_method.toUpperCase()} • Vendedor: {sale.seller.name}
                                                        </span>
                                                        {sale.nfce_chave && (
                                                            <span className="text-[10px] text-gray-400 mt-1">
                                                                NFC-e: {sale.nfce_chave.substring(0, 30)}...
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg font-bold text-blue-600">
                                                            R$ {sale.total_amount.toFixed(2)}
                                                        </span>
                                                        
                                                        {/* Botões de ação NFC-e */}
                                                        <div className="flex gap-1">
                                                            {sale.nfce_status === 'autorizada' && (
                                                                <button
                                                                    onClick={() => handleReimprimirNFCE(sale.id)}
                                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                    title="Imprimir Cupom Fiscal (NFC-e)"
                                                                >
                                                                    <FileText size={18} />
                                                                </button>
                                                            )}
                                                            
                                                            {(sale.nfce_status === 'rejeitada' || sale.nfce_status === 'pendente') && (
                                                                <button
                                                                    onClick={() => handleReprocessarNFCE(sale.id)}
                                                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                                    title="Reenviar NFC-e"
                                                                >
                                                                    <RefreshCw size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Itens da Venda */}
                                                <ul className="text-sm space-y-1 bg-gray-50 p-3 rounded text-gray-600">
                                                    {sale.items.map((item, idx) => (
                                                        <li key={idx} className="flex justify-between">
                                                            <span>
                                                                {item.quantity}{item.product?.is_weighted ? " kg " : ""}x {item.product ? item.product.name : ``}
                                                            </span>
                                                            <span className="font-medium text-gray-800">
                                                                R$ {item.subtotal.toFixed(2)}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}