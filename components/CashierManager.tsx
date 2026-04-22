"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { Wallet, X, Lock } from "lucide-react";
import { toast } from "sonner"; // Adicionei o toast para feedback melhor

interface CashierData {
    status: "open" | "closed";
    initial_balance?: number;
    total_sold?: number;
    expected_balance?: number;
}

interface CashierManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onStatusChange: () => void;
    onCloseSuccess: (dados: any) => void;
}

export default function CashierManager({ isOpen, onClose, onStatusChange, onCloseSuccess }: CashierManagerProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<CashierData | null>(null);

    const [inputBalance, setInputBalance] = useState("");
    const [closingBalance, setClosingBalance] = useState("");

    useEffect(() => {
        if (isOpen) fetchStatus();
    }, [isOpen]);

    const fetchStatus = async () => {
        try {
            const res = await api.get("/cashier/status");
            setData(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenCashier = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/cashier/open", { initial_balance: parseFloat(inputBalance) || 0 });
            toast.success("Caixa aberto com sucesso!");
            await fetchStatus();
            onStatusChange(); // Avisa o PDV
            onClose(); // Fecha o modal automaticamente ao abrir o caixa com sucesso
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Erro ao abrir caixa");
        } finally {
            setLoading(false);
        }
    };

    const handleCloseCashier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm("Tem certeza que deseja fechar o caixa agora?")) return;

        setLoading(true);
        try {
            // Pegamos a resposta completa da API agora
            const response = await api.post("/cashier/close", { final_balance: parseFloat(closingBalance) || 0 });

            toast.success("Caixa fechado com sucesso!");
            await fetchStatus();
            onStatusChange();

            // Passa os dados do cupom para a tela pai
            onCloseSuccess(response.data);

            onClose(); // Fecha o modal do gerenciador
        } catch (err: any) {
            toast.error("Erro ao fechar caixa");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Cabeçalho */}
                <div className={`p-4 flex justify-between items-center ${data?.status === 'open' ? 'bg-green-600' : 'bg-blue-600'} text-white`}>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Wallet size={20} />
                        {data?.status === 'open' ? 'Gerenciar Caixa' : 'Abertura de Caixa'}
                    </h2>
                    {/* O botão X agora SEMPRE aparece */}
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Loading Inicial */}
                    {!data ? (
                        <div className="text-center py-4">Carregando informações...</div>
                    ) : (
                        <>
                            {/* CENÁRIO 1: CAIXA FECHADO (ABRIR) */}
                            {data.status === "closed" && (
                                <form onSubmit={handleOpenCashier} className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded text-sm text-blue-800 mb-4">
                                        O caixa está fechado. Você pode navegar pelo sistema, mas não poderá realizar vendas até abrir o caixa.
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Fundo de Troco (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full mt-1 p-3 border rounded text-lg font-bold text-gray-800 focus:ring-2 focus:ring-blue-500"
                                            placeholder="0.00"
                                            value={inputBalance}
                                            onChange={e => setInputBalance(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <button disabled={loading} className="w-full py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition">
                                        {loading ? "Abrindo..." : "ABRIR CAIXA"}
                                    </button>
                                </form>
                            )}

                            {/* CENÁRIO 2: CAIXA ABERTO (RESUMO E FECHAMENTO) */}
                            {data.status === "open" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 p-3 rounded border">
                                            <span className="text-xs text-gray-500 block">Fundo Inicial</span>
                                            <span className="font-semibold text-gray-700">R$ {data.initial_balance?.toFixed(2)}</span>
                                        </div>
                                        <div className="bg-green-50 p-3 rounded border border-green-100">
                                            <span className="text-xs text-green-600 block">Total Vendido</span>
                                            <span className="font-bold text-green-700 text-lg">R$ {data.total_sold?.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center border border-blue-100">
                                        <div>
                                            <span className="text-sm text-blue-600 block font-medium">Saldo Esperado</span>
                                            <span className="text-xs text-blue-400">Inicial + Vendas</span>
                                        </div>
                                        <span className="text-2xl font-bold text-blue-700">R$ {data.expected_balance?.toFixed(2)}</span>
                                    </div>

                                    <hr />

                                    <form onSubmit={handleCloseCashier}>
                                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            <Lock size={16} /> Fechamento
                                        </h3>
                                        <div className="mb-4">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                                Valor Conferido (Gaveta)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-gray-400 font-bold">R$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full pl-10 p-2 border border-gray-300 rounded focus:border-red-500 focus:ring-red-500"
                                                    placeholder="0.00"
                                                    value={closingBalance}
                                                    onChange={e => setClosingBalance(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <button type="submit" disabled={loading} className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition">
                                            {loading ? "Fechando..." : "FECHAR CAIXA"}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}