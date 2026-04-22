"use client";

import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer, X } from "lucide-react";

interface FechamentoModalProps {
    isOpen: boolean;
    onClose: () => void;
    dados: any; // Substitua pela sua interface tipada depois
}

export default function FechamentoModal({ isOpen, onClose, dados }: FechamentoModalProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: dados ? `Fechamento_Caixa_${dados.id_sessao}` : "Auditoria_Caixa",
        pageStyle: "@page { size: 80mm auto; margin: 0; }",
    });

    if (!isOpen || !dados) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[70]">
            <div className="bg-gray-100 p-6 rounded-xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">

                <div className="w-full flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Auditoria de Caixa</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* --- ÁREA DO CUPOM DE AUDITORIA --- */}
                <div className="bg-white p-4 shadow-sm w-full flex justify-center mb-6 overflow-hidden rounded max-h-[60vh] overflow-y-auto">
                    <div
                        ref={contentRef}
                        className="print-container"
                        style={{ width: '80mm', color: '#000', fontFamily: 'monospace', fontSize: '12px', margin: '0 auto' }}
                    >
                        {/* Cabeçalho */}
                        <div className="text-center border-b border-black pb-2 mb-2">
                            <h1 className="font-bold text-sm uppercase">FECHAMENTO DE CAIXA</h1>
                            <p>Sessão N: {dados.id_sessao}</p>
                            <p>Terminal: {dados.terminal}</p>
                            <p>Operador: {dados.operador}</p>
                        </div>

                        {/* Período */}
                        <div className="border-b border-black border-dashed pb-2 mb-2">
                            <p><strong>Abertura:</strong> {dados.data_abertura}</p>
                            <p><strong>Fechamento:</strong> {dados.data_fechamento}</p>
                        </div>

                        {/* Movimentações de Fundo/Gaveta */}
                        <div className="border-b border-black border-dashed pb-2 mb-2">
                            <h2 className="font-bold mb-1 uppercase text-center">Movimentações</h2>
                            <div className="flex justify-between"><span>Fundo Inicial:</span> <span>R$ {dados.fundo_de_caixa?.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Suprimentos (+):</span> <span>R$ {dados.suprimentos?.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Sangrias (-):</span> <span>R$ {dados.sangrias?.toFixed(2)}</span></div>
                        </div>

                        {/* Resumo de Vendas */}
                        <div className="border-b border-black pb-2 mb-2">
                            <h2 className="font-bold mb-1 uppercase text-center">Vendas por Pagamento</h2>
                            {dados.vendas_por_metodo?.map((v: any, i: number) => (
                                <div key={i} className="flex justify-between">
                                    <span>{v.metodo}</span>
                                    <span>R$ {v.valor.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-bold mt-2 pt-1 border-t border-black border-dashed">
                                <span>TOTAL VENDAS:</span>
                                <span>R$ {dados.total_vendas?.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Auditoria Final */}
                        <div className="border-2 border-black p-1 text-center font-bold">
                            <div className="flex justify-between mb-1">
                                <span>Dinheiro Esperado:</span>
                                <span>R$ {dados.total_esperado_gaveta?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                                <span>Dinheiro Informado:</span>
                                <span>R$ {dados.total_informado_gaveta?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mt-1 pt-1 border-t border-black">
                                <span>Diferença:</span>
                                <span className={dados.diferenca < 0 ? "text-black" : "text-black"}>
                                    {dados.diferenca === 0 ? "OK (R$ 0.00)" : `R$ ${dados.diferenca?.toFixed(2)}`}
                                </span>
                            </div>
                        </div>

                        {/* Assinatura */}
                        <div className="mt-8 pt-4 border-t border-black text-center">
                            <p>___________________________________</p>
                            <p>Assinatura do Operador</p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-black text-center">
                            <p>___________________________________</p>
                            <p>Assinatura do Gerente</p>
                        </div>

                        <div className="text-center mt-4 text-[10px]">
                            <p>Impresso em: {new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Botões */}
                <div className="w-full flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-gray-300 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-400 font-bold transition-colors">
                        Fechar
                    </button>
                    <button onClick={() => handlePrint()} className="flex-[2] bg-gray-800 text-white px-4 py-3 rounded-lg hover:bg-black font-bold flex items-center justify-center gap-2 transition-colors shadow-lg">
                        <Printer size={20} />
                        Imprimir Relatório
                    </button>
                </div>

            </div>
        </div>
    );
}