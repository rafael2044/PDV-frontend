"use client";

import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer, X, FileText, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

interface CupomModalProps {
    isOpen: boolean;
    onClose: () => void;
    dados: any;
    onReimprimirNFCE?: (saleId: number) => void;
    onReprocessarNFCE?: (saleId: number) => void;
}

export default function CupomModal({ isOpen, onClose, dados, onReimprimirNFCE, onReprocessarNFCE }: CupomModalProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: dados ? `Venda_${dados.id_venda}` : "Recibo",
        pageStyle: "@page { size: 80mm auto; margin: 0; }",
    });

    if (!isOpen || !dados) return null;

    const getNFCeStatusBadge = () => {
        if (!dados.nfce_status || dados.nfce_status === 'desabilitado') return null;
        
        switch (dados.nfce_status) {
            case 'autorizada':
                return (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                        <CheckCircle size={20} className="text-green-600" />
                        <div>
                            <p className="text-sm font-semibold text-green-700">NFC-e Autorizada</p>
                            {dados.nfce_chave && (
                                <p className="text-xs text-green-600 mt-1">
                                    Chave: {dados.nfce_chave.substring(0, 20)}...
                                </p>
                            )}
                            {dados.nfce_protocolo && (
                                <p className="text-xs text-green-600">
                                    Protocolo: {dados.nfce_protocolo}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 'rejeitada':
                return (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                        <XCircle size={20} className="text-red-600" />
                        <div>
                            <p className="text-sm font-semibold text-red-700">NFC-e Rejeitada</p>
                            {dados.nfce_resultado?.message && (
                                <p className="text-xs text-red-600 mt-1">
                                    {dados.nfce_resultado.message}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 'pendente':
                return (
                    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                        <Clock size={20} className="text-yellow-600" />
                        <div>
                            <p className="text-sm font-semibold text-yellow-700">NFC-e Pendente</p>
                            <p className="text-xs text-yellow-600 mt-1">
                                Aguardando processamento
                            </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60]">
            <div className="bg-gray-100 p-6 rounded-xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">

                <div className="w-full flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Recibo de Venda</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Status NFC-e */}
                {getNFCeStatusBadge()}

                {/* --- ÁREA DO CUPOM --- */}
                <div className="bg-white p-4 shadow-sm w-full flex justify-center mb-6 overflow-hidden rounded mt-3">
                    <div
                        ref={contentRef}
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

                        {/* Informações da NFC-e no cupom */}
                        {dados.nfce_status === 'autorizada' && dados.nfce_chave && (
                            <div className="text-center mt-2 pt-2 border-t border-black border-dashed text-[10px]">
                                <p>NFC-e Autorizada</p>
                                <p>Chave: {dados.nfce_chave}</p>
                                {dados.nfce_protocolo && <p>Protocolo: {dados.nfce_protocolo}</p>}
                            </div>
                        )}

                        <div className="text-center mt-4 pt-2 border-t border-black border-dashed">
                            <p>Obrigado pela preferencia!</p>
                            {dados.nfce_status !== 'autorizada' && (
                                <p>Este nao e um documento fiscal</p>
                            )}
                        </div>
                    </div>
                </div>
                {/* --- FIM DA ÁREA DO CUPOM --- */}

                {/* Botões de Ação */}
                <div className="w-full flex flex-col gap-3">
                    {/* Botões da NFC-e */}
                    {dados.nfce_status === 'autorizada' && onReimprimirNFCE && (
                        <button
                            onClick={() => onReimprimirNFCE(dados.id_venda)}
                            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
                        >
                            <FileText size={20} />
                            Imprimir Cupom Fiscal (NFC-e)
                        </button>
                    )}
                    
                    {(dados.nfce_status === 'rejeitada' || dados.nfce_status === 'pendente') && onReprocessarNFCE && (
                        <button
                            onClick={() => onReprocessarNFCE(dados.id_venda)}
                            className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
                        >
                            <Loader2 size={20} />
                            Reenviar NFC-e
                        </button>
                    )}
                    
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-300 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-400 font-bold transition-colors"
                        >
                            Fechar
                        </button>

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
        </div>
    );
}