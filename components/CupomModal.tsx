"use client";

import React, { useRef } from "react";
// 1. Novo import usando o Hook em vez do Componente
import { useReactToPrint } from "react-to-print";
import { Printer, X } from "lucide-react";

interface CupomModalProps {
    isOpen: boolean;
    onClose: () => void;
    dados: any;
}

export default function CupomModal({ isOpen, onClose, dados }: CupomModalProps) {
    // 2. Criamos a ref com o nome que a nova versão exige
    const contentRef = useRef<HTMLDivElement>(null);

    // 3. Configuramos a impressão através do Hook
    const handlePrint = useReactToPrint({
        contentRef, // <-- AQUI ESTÁ A CORREÇÃO DO ERRO
        documentTitle: dados ? `Venda_${dados.id_venda}` : "Recibo",
        pageStyle: "@page { size: 80mm auto; margin: 0; }",
    });

    if (!isOpen || !dados) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60]">
            <div className="bg-gray-100 p-6 rounded-xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">

                <div className="w-full flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Recibo de Venda</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* --- ÁREA DO CUPOM --- */}
                <div className="bg-white p-4 shadow-sm w-full flex justify-center mb-6 overflow-hidden rounded">
                    <div
                        ref={contentRef} // <-- Passamos a ref aqui
                        className="print-container"
                        style={{
                            width: '80mm',
                            color: '#000',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            margin: '0 auto'
                        }}
                    >
                        <div className="text-center border-b border-black border-dashed pb-2 mb-2">
                            <h1 className="font-bold text-sm uppercase">{dados.nome_fantasia || "MEU PDV"}</h1>
                            <p>CNPJ: {dados.cnpj || "00.000.000/0001-00"}</p>
                            <p>{dados.data_hora}</p>
                            <p>Venda N: {dados.id_venda}</p>
                        </div>

                        <div className="border-b border-black border-dashed pb-2 mb-2">
                            <div className="flex justify-between font-bold mb-1">
                                <span>Qtd - Item</span>
                                <span>Total</span>
                            </div>
                            {dados.itens?.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between mb-1">
                                    <span>
                                        {item.quantidade}x {item.descricao.substring(0, 15)}
                                    </span>
                                    <span>R$ {item.valor_total.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="text-right font-bold text-sm">
                            <p>TOTAL: R$ {dados.total_venda?.toFixed(2)}</p>
                            <p>PAGAMENTO: {dados.metodo_pagamento}</p>
                        </div>

                        <div className="text-center mt-4 pt-2 border-t border-black border-dashed">
                            <p>Obrigado pela preferencia!</p>
                            <p>Este nao e um documento fiscal</p>
                        </div>
                    </div>
                </div>
                {/* --- FIM DA ÁREA DO CUPOM --- */}

                {/* Botões de Ação */}
                <div className="w-full flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-300 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-400 font-bold transition-colors"
                    >
                        Fechar
                    </button>

                    {/* 4. Chamamos a função do Hook no clique do botão */}
                    <button
                        onClick={() => handlePrint()}
                        className="flex-[2] bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
                    >
                        <Printer size={20} />
                        Imprimir Cupom
                    </button>
                </div>

            </div>
        </div>
    );
}