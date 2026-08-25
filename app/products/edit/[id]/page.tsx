"use client";
import { useState, useEffect, use } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Edit, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { role, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showFiscal, setShowFiscal] = useState(false);

    const [productId, setProductId] = useState<string>("");

    const [formData, setFormData] = useState({
        name: "",
        barcode: "",
        category: "",
        price: "",
        cost_price: "",
        min_stock: "",
        stock_quantity: 0,
        // Campos Fiscais NFC-e
        ncm: "",
        cest: "",
        cfop: "5102",
        unidade_medida: "UN",
        origem: "0",
        csosn_icms: "102",
    });

    // Inicialização
    useEffect(() => {
        const init = async () => {
            const resolvedParams = await params;
            setProductId(resolvedParams.id);
            fetchProduct(resolvedParams.id);
        };
        init();
    }, [params]);

    // Busca dados do produto
    const fetchProduct = async (id: string) => {
        try {
            const res = await api.get(`/products/${id}`);
            const p = res.data;
            setFormData({
                name: p.name,
                barcode: p.barcode || "",
                category: p.category || "",
                price: p.price.toString(),
                cost_price: p.cost_price.toString(),
                min_stock: p.min_stock.toString(),
                stock_quantity: p.stock_quantity,
                // Campos Fiscais
                ncm: p.ncm || "",
                cest: p.cest || "",
                cfop: p.cfop || "5102",
                unidade_medida: p.unidade_medida || "UN",
                origem: p.origem || "0",
                csosn_icms: p.csosn_icms || "102",
            });
            
            // Se tem dados fiscais, expandir seção automaticamente
            if (p.ncm || p.cest || p.cfop !== "5102") {
                setShowFiscal(true);
            }
        } catch (error) {
            alert("Erro ao carregar produto.");
            router.push("/");
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                name: formData.name,
                barcode: formData.barcode || null,
                category: formData.category || null,
                price: parseFloat(formData.price),
                cost_price: parseFloat(formData.cost_price),
                min_stock: parseFloat(formData.min_stock),
                // Campos Fiscais
                ncm: formData.ncm || null,
                cest: formData.cest || null,
                cfop: formData.cfop || "5102",
                unidade_medida: formData.unidade_medida || "UN",
                origem: formData.origem || "0",
                csosn_icms: formData.csosn_icms || "102",
            };

            await api.put(`/products/${productId}`, payload);
            toast.success("Produto atualizado com sucesso!");
            router.push("/");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Erro ao atualizar");
        } finally {
            setLoading(false);
        }
    };

    // Proteção de Rota
    if (!authLoading && role !== "admin" && role !== "manager") {
        return <div className="p-8 text-center">Acesso Negado</div>;
    }

    if (fetching) return <div className="p-8 text-center">Carregando dados...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
            <div className="w-full max-w-2xl">

                <div className="flex items-center justify-between mb-6">
                    <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                        <ArrowLeft size={20} /> Cancelar
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Edit /> Editar Produto
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                            <input
                                type="text"
                                name="name"
                                required
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                            <input
                                type="text"
                                name="barcode"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500"
                                value={formData.barcode}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                            <input
                                type="text"
                                name="category"
                                list="categories"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500"
                                value={formData.category}
                                onChange={handleChange}
                            />
                            <datalist id="categories">
                                <option value="Bebidas" />
                                <option value="Alimentos" />
                                <option value="Limpeza" />
                                <option value="Construção" />
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-green-700 mb-1">Preço Venda (R$)</label>
                            <input
                                type="number"
                                name="price"
                                step="0.01"
                                required
                                className="w-full p-2 border border-green-300 rounded focus:ring-green-500 bg-green-50"
                                value={formData.price}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preço Custo (R$)</label>
                            <input
                                type="number"
                                name="cost_price"
                                step="0.01"
                                required
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500"
                                value={formData.cost_price}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Campo de Estoque Bloqueado */}
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Estoque Atual</label>
                            <input
                                type="number"
                                disabled
                                className="w-full p-2 border border-gray-200 rounded bg-gray-100 text-gray-500 cursor-not-allowed"
                                value={formData.stock_quantity}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Use a função de Reposição para alterar.</p>
                        </div>

                        {/* Estoque Mínimo para alerta */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
                            <input
                                type="number"
                                name="min_stock"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500"
                                value={formData.min_stock}
                                onChange={handleChange}
                            />
                        </div>

                    </div>

                    {/* Seção Fiscais NFC-e */}
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={() => setShowFiscal(!showFiscal)}
                            className="flex items-center gap-2 text-sm font-semibold text-orange-700 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors w-full"
                        >
                            <FileText size={18} />
                            Dados Fiscais (NFC-e)
                            <span className="ml-auto text-xs text-orange-500">
                                {showFiscal ? '▲ Ocultar' : '▼ Expandir'}
                            </span>
                        </button>

                        {showFiscal && (
                            <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200 space-y-4">
                                <p className="text-xs text-orange-600 mb-3">
                                    Estes campos são utilizados para a emissão de Nota Fiscal de Consumidor Eletrônica (NFC-e).
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* NCM */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">NCM</label>
                                        <input
                                            type="text"
                                            name="ncm"
                                            maxLength={8}
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="Ex: 22021000"
                                            value={formData.ncm}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    {/* CEST */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CEST</label>
                                        <input
                                            type="text"
                                            name="cest"
                                            maxLength={7}
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="Ex: 0301100"
                                            value={formData.cest}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    {/* CFOP */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CFOP</label>
                                        <select
                                            name="cfop"
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                                            value={formData.cfop}
                                            onChange={handleChange}
                                        >
                                            <option value="5102">5102 - Venda dentro do estado</option>
                                            <option value="6102">6102 - Venda interestadual</option>
                                            <option value="5405">5405 - Venda de mercadoria com ST</option>
                                            <option value="5949">5949 - Outra saída de mercadoria</option>
                                        </select>
                                    </div>

                                    {/* Unidade de Medida */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Unidade de Medida</label>
                                        <select
                                            name="unidade_medida"
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                                            value={formData.unidade_medida}
                                            onChange={handleChange}
                                        >
                                            <option value="UN">UN - Unidade</option>
                                            <option value="KG">KG - Quilograma</option>
                                            <option value="LT">LT - Litro</option>
                                            <option value="MT">MT - Metro</option>
                                            <option value="CX">CX - Caixa</option>
                                            <option value="PC">PC - Peça</option>
                                            <option value="PAR">PAR - Par</option>
                                            <option value="PCT">PCT - Pacote</option>
                                        </select>
                                    </div>

                                    {/* Origem */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                                        <select
                                            name="origem"
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                                            value={formData.origem}
                                            onChange={handleChange}
                                        >
                                            <option value="0">0 - Nacional</option>
                                            <option value="1">1 - Estrangeira (importação direta)</option>
                                            <option value="2">2 - Estrangeira (adquirida no mercado interno)</option>
                                            <option value="3">3 - Nacional com conteúdo importado {'>'} 40%</option>
                                            <option value="4">4 - Nacional produzida conforme processos produtivos básicos</option>
                                            <option value="5">5 - Nacional com conteúdo importado {'<='} 40%</option>
                                            <option value="6">6 - Estrangeira (importação direta) sem similar nacional</option>
                                            <option value="7">7 - Estrangeira (adquirida no mercado interno) sem similar nacional</option>
                                            <option value="8">8 - Nacional com conteúdo importado {'>'} 70%</option>
                                        </select>
                                    </div>

                                    {/* CSOSN ICMS */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CSOSN ICMS</label>
                                        <select
                                            name="csosn_icms"
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                                            value={formData.csosn_icms}
                                            onChange={handleChange}
                                        >
                                            <option value="101">101 - Tributada com permissão de crédito</option>
                                            <option value="102">102 - Tributada sem permissão de crédito</option>
                                            <option value="103">103 - Isenção de ICMS para faixa de receita bruta</option>
                                            <option value="201">201 - Tributada com permissão de crédito e com cobrança de ICMS por ST</option>
                                            <option value="202">202 - Tributada sem permissão de crédito e com cobrança de ICMS por ST</option>
                                            <option value="203">203 - Isenção de ICMS para faixa de receita bruta e com cobrança de ICMS por ST</option>
                                            <option value="300">300 - Imune</option>
                                            <option value="400">400 - Não tributada</option>
                                            <option value="500">500 - ICMS cobrado anteriormente por ST ou por antecipação</option>
                                            <option value="900">900 - Outros</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <Save size={18} />
                            {loading ? "Salvando..." : "Atualizar Produto"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}