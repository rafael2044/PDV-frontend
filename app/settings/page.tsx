"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, FileText, Save, Loader2, CheckCircle, XCircle,
    Settings, Play, AlertTriangle, Shield
} from "lucide-react";
import { toast } from "sonner";

interface NFCeConfig {
    habilitado: boolean;
    ambiente: number;
    uf: string;
    serie: string;
    municipio_ibge: string;
    certificado_configurado: boolean;
    csc_configurado: boolean;
}

interface SystemSettings {
    nome_fantasia: string;
    cnpj: string;
    nfce: NFCeConfig;
}

export default function SettingsPage() {
    const { role, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [settings, setSettings] = useState<SystemSettings | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        nfce_habilitado: false,
        nfce_ambiente: 2,
        nfce_uf: "SP",
        nfce_serie: "1",
        nfce_municipio_ibge: "",
        nfce_certificado_caminho: "",
        nfce_certificado_senha: "",
        nfce_csc: "",
        nfce_id_csc: ""
    });

    // Proteção de rota
    useEffect(() => {
        if (!authLoading && role !== "admin") {
            router.push("/");
        }
    }, [role, authLoading]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get("/settings/");
            setSettings(data);
            setFormData(prev => ({
                ...prev,
                nfce_habilitado: data.nfce.habilitado,
                nfce_ambiente: data.nfce.ambiente,
                nfce_uf: data.nfce.uf,
                nfce_serie: data.nfce.serie,
                nfce_municipio_ibge: data.nfce.municipio_ibge || "",
            }));
        } catch (error) {
            toast.error("Erro ao carregar configurações");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleToggle = async () => {
        try {
            const { data } = await api.post("/settings/nfce/toggle");
            setFormData(prev => ({ ...prev, nfce_habilitado: data.nfce_habilitado }));
            toast.success(data.message);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao alterar status");
        }
    };

    const handleTestConfig = async () => {
        setTesting(true);
        try {
            const { data } = await api.get("/sales/nfce/testar-configuracao");
            if (data.success) {
                toast.success("Configuração OK! Tudo pronto para emitir NFC-e.");
            } else {
                toast.error(`Erros encontrados: ${data.erros.join(", ")}`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao testar configuração");
        } finally {
            setTesting(false);
        }
    };

    const handleTestSEFAZ = async () => {
        setTesting(true);
        try {
            const { data } = await api.get("/sales/nfce/status-servico");
            if (data.success) {
                toast.success("Serviço da SEFAZ está disponível!");
            } else {
                toast.error(data.message || "Serviço da SEFAZ indisponível");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao verificar SEFAZ");
        } finally {
            setTesting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.put("/settings/nfce", formData);
            toast.success("Configurações salvas! Reinicie o serviço para aplicar.");
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao salvar configurações");
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
            </div>
        );
    }

    if (role !== "admin") {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800">Acesso Negado</h1>
                    <p className="text-gray-500 mt-2">Apenas administradores podem acessar esta página.</p>
                    <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
                        Voltar ao PDV
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="bg-white p-2 rounded-full shadow hover:bg-gray-50 text-gray-600">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Settings /> Configurações do Sistema
                            </h1>
                            <p className="text-sm text-gray-500">Gerencie as configurações de NFC-e e outras opções</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Seção NFC-e */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                        <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
                            <h2 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                                <FileText size={20} />
                                Nota Fiscal de Consumidor Eletrônica (NFC-e)
                            </h2>
                            <p className="text-sm text-orange-600 mt-1">
                                Configure a emissão de notas fiscais eletrônicas para vendas ao consumidor final
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Toggle Principal */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div>
                                    <h3 className="font-semibold text-gray-800">Emissão de NFC-e</h3>
                                    <p className="text-sm text-gray-500">
                                        {formData.nfce_habilitado 
                                            ? "Ativo - Notas fiscais serão emitidas automaticamente" 
                                            : "Inativo - Vendas sem emissão de nota fiscal"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleToggle}
                                    className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${
                                        formData.nfce_habilitado
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                                    }`}
                                >
                                    {formData.nfce_habilitado ? 'ATIVO' : 'INATIVO'}
                                </button>
                            </div>

                            {/* Ambiente */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ambiente
                                    </label>
                                    <select
                                        name="nfce_ambiente"
                                        value={formData.nfce_ambiente}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value={2}>Homologação (Testes)</option>
                                        <option value={1}>Produção (Real)</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Use Homologação para testes. Mude para Produção apenas quando tudo estiver funcionando.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Série da NFC-e
                                    </label>
                                    <input
                                        type="text"
                                        name="nfce_serie"
                                        value={formData.nfce_serie}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="1"
                                    />
                                </div>
                            </div>

                            {/* UF e Município */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        UF do Emitente
                                    </label>
                                    <select
                                        name="nfce_uf"
                                        value={formData.nfce_uf}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="AC">AC - Acre</option>
                                        <option value="AL">AL - Alagoas</option>
                                        <option value="AP">AP - Amapá</option>
                                        <option value="AM">AM - Amazonas</option>
                                        <option value="BA">BA - Bahia</option>
                                        <option value="CE">CE - Ceará</option>
                                        <option value="DF">DF - Distrito Federal</option>
                                        <option value="ES">ES - Espírito Santo</option>
                                        <option value="GO">GO - Goiás</option>
                                        <option value="MA">MA - Maranhão</option>
                                        <option value="MT">MT - Mato Grosso</option>
                                        <option value="MS">MS - Mato Grosso do Sul</option>
                                        <option value="MG">MG - Minas Gerais</option>
                                        <option value="PA">PA - Pará</option>
                                        <option value="PB">PB - Paraíba</option>
                                        <option value="PR">PR - Paraná</option>
                                        <option value="PE">PE - Pernambuco</option>
                                        <option value="PI">PI - Piauí</option>
                                        <option value="RJ">RJ - Rio de Janeiro</option>
                                        <option value="RN">RN - Rio Grande do Norte</option>
                                        <option value="RS">RS - Rio Grande do Sul</option>
                                        <option value="RO">RO - Rondônia</option>
                                        <option value="RR">RR - Roraima</option>
                                        <option value="SC">SC - Santa Catarina</option>
                                        <option value="SP">SP - São Paulo</option>
                                        <option value="SE">SE - Sergipe</option>
                                        <option value="TO">TO - Tocantins</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Código IBGE do Município
                                    </label>
                                    <input
                                        type="text"
                                        name="nfce_municipio_ibge"
                                        value={formData.nfce_municipio_ibge}
                                        onChange={handleChange}
                                        maxLength={7}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="Ex: 2111300"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        7 dígitos. Consulte em: www.ibge.gov.br/explica/codigos-dos-municipios.php
                                    </p>
                                </div>
                            </div>

                            {/* Certificado Digital */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Shield size={18} />
                                    Certificado Digital A1
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Caminho do Certificado
                                        </label>
                                        <input
                                            type="text"
                                            name="nfce_certificado_caminho"
                                            value={formData.nfce_certificado_caminho}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="/caminho/para/certificado.pfx"
                                        />
                                        <div className="flex items-center gap-2 mt-2">
                                            {settings?.nfce.certificado_configurado ? (
                                                <span className="flex items-center gap-1 text-xs text-green-600">
                                                    <CheckCircle size={12} /> Configurado
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-red-500">
                                                    <XCircle size={12} /> Não configurado
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Senha do Certificado
                                        </label>
                                        <input
                                            type="password"
                                            name="nfce_certificado_senha"
                                            value={formData.nfce_certificado_senha}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="Senha do certificado"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* CSC */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="font-semibold text-gray-800 mb-4">
                                    CSC - Código de Segurança do Contribuinte
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            CSC
                                        </label>
                                        <input
                                            type="text"
                                            name="nfce_csc"
                                            value={formData.nfce_csc}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="Seu CSC"
                                        />
                                        <div className="flex items-center gap-2 mt-2">
                                            {settings?.nfce.csc_configurado ? (
                                                <span className="flex items-center gap-1 text-xs text-green-600">
                                                    <CheckCircle size={12} /> Configurado
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-red-500">
                                                    <XCircle size={12} /> Não configurado
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            ID do CSC
                                        </label>
                                        <input
                                            type="text"
                                            name="nfce_id_csc"
                                            value={formData.nfce_id_csc}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="Ex: 000001"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Botões de Teste */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="font-semibold text-gray-800 mb-4">Testes de Configuração</h3>
                                
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={handleTestConfig}
                                        disabled={testing}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {testing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                                        Testar Configuração
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={handleTestSEFAZ}
                                        disabled={testing}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {testing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                                        Testar Conexão SEFAZ
                                    </button>
                                </div>
                                
                                <p className="text-xs text-gray-500 mt-2">
                                    Use estes botões para verificar se a configuração está correta antes de emitir notas fiscais.
                                </p>
                            </div>

                            {/* Aviso */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">Importante</p>
                                    <p className="text-xs text-yellow-600 mt-1">
                                        Após alterar as configurações, é necessário reiniciar o servidor backend para que as mudanças tenham efeito.
                                        As configurações são salvas no arquivo .env do servidor.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex justify-end gap-4">
                        <Link
                            href="/"
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition-colors"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {saving ? "Salvando..." : "Salvar Configurações"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
