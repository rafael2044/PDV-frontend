"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { CheckCircle, XCircle, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NFCeToggle() {
    const [habilitado, setHabilitado] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        fetchConfig();
    }, [pathname]); // Recarrega quando a rota muda (volta das configurações)

    const fetchConfig = async () => {
        try {
            const { data } = await api.get("/settings/");
            setHabilitado(data.nfce.habilitado);
        } catch (error) {
            console.error("Erro ao buscar configuração NFC-e:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-400">
                <Settings size={16} className="animate-spin" />
                <span className="text-xs">NFC-e</span>
            </div>
        );
    }

    return (
        <Link
            href="/settings"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-medium text-sm transition-all hover:shadow-md ${
                habilitado
                    ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                    : 'bg-gray-50 border-gray-300 text-gray-500 hover:bg-gray-100'
            }`}
            title="Configurações do Sistema"
        >
            {habilitado ? (
                <CheckCircle size={16} className="text-green-600" />
            ) : (
                <XCircle size={16} className="text-gray-400" />
            )}
            <span>NFC-e: {habilitado ? 'Ativo' : 'Inativo'}</span>
            <Settings size={14} className="ml-1 opacity-60" />
        </Link>
    );
}
