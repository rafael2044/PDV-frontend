"use client";
import { useState } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Package, Scale, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CreateProduct() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showFiscal, setShowFiscal] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        barcode: "",
        category: "",
        price: "",
        cost_price: "",
        stock_quantity: "1",
        min_stock: "1",
        is_weighted: false,
        // Campos Fiscais NFC-e
        ncm: "",
        cest: "",
        cfop: "5102",
        unidade_medida: "UN",
        origem: "0",
        csosn_icms: "102",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (e.target.type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Bloqueia o submit

            // Opcional: Se quiser que o Enter pule para o próximo campo (comportamento estilo Excel)
            const formElement = e.currentTarget as HTMLFormElement;
            const form = formElement.form;
            const index = Array.prototype.indexOf.call(form, e.currentTarget);
            form.elements[index + 1].focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                cost_price: parseFloat(formData.cost_price),
                stock_quantity: parseFloat(formData.stock_quantity) || 1,
                min_stock: parseFloat(formData.min_stock) || 1,
                barcode: formData.barcode || null,
                category: formData.category || null,
                is_weighted: formData.is_weighted,
                // Campos Fiscais - enviar null se vazio
                ncm: formData.ncm || null,
                cest: formData.cest || null,
                cfop: formData.cfop || "5102",
                unidade_medida: formData.unidade_medida || "UN",
                origem: formData.origem || "0",
                csosn_icms: formData.csosn_icms || "102",
            };

            await api.post("/products/", payload);
            toast.success("Produto cadastrado com sucesso!");

            setFormData({
                name: "",
                barcode: "",
                category: "",
                price: "",
                cost_price: "",
                stock_quantity: "",
                min_stock: "5",
                is_weighted: false,
                ncm: "",
                cest: "",
                cfop: "5102",
                unidade_medida: "UN",
                origem: "0",
                csosn_icms: "102",
            });

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Erro ao cadastrar produto");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
            <div className="w-full max-w-2xl">

                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-6">
                    <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                        <ArrowLeft size={20} /> Voltar ao PDV
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Package /> Novo Produto
                    </h1>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nome (Ocupa 2 colunas) */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto *</label>
                            <input
                                type="text"
                                name="name"
                                required
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ex: Coca-Cola 2L"
                                value={formData.name}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        {/* Código de Barras */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                            <input
                                type="text"
                                name="barcode"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Escaneie ou digite"
                                value={formData.barcode}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        {/* Categoria */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                            <input
                                type="text"
                                name="category"
                                list="categories"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ex: Bebidas"
                                value={formData.category}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                            />
                            {/* Datalist para sugestões simples */}
                            <datalist id="categories">
                                <option value="Bebidas" />
                                <option value="Alimentos" />
                                <option value="Limpeza" />
                                <option value="Construção" />
                                <option value="Eletrônicos" />
                                <option value="Bebidas" />
                                <option value="Alimentos" />
                                <option value="Limpeza" />
                                <option value="Construção" />
                                <option value="Eletrônicos" />
                            </datalist>
                        </div>

                        <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-4 transition-all hover:border-blue-300">
                            <div className={`p-2 rounded-full transition-colors ${formData.is_weighted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                <Scale size={24} />
                            </div>
                            <div className="flex-1 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, is_weighted: !prev.is_weighted }))}>
                                <label className="block text-sm font-bold text-gray-800 cursor-pointer select-none">
                                    Produto vendido por Peso (KG)?
                                </label>
                                <p className="text-xs text-gray-500 select-none">Se marcado, o preço será calculado por Quilograma e permitirá decimais.</p>
                            </div>
                            <input
                                type="checkbox"
                                id="is_weighted"
                                name="is_weighted"
                                checked={formData.is_weighted}
                                onChange={handleChange}
                                className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                            />
                        </div>

                        {/* Preço de Venda */}
                        <div>
                            <label className="block text-sm font-medium text-green-700 mb-1">Preço de Venda (R$) *</label>
                            <input
                                type="number"
                                name="price"
                                step="0.5"
                                required
                                className="w-full p-2 border border-green-300 rounded focus:ring-green-500 focus:border-green-500 bg-green-50"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        {/* Preço de Custo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Custo (R$) *</label>
                            <input
                                type="number"
                                name="cost_price"
                                step="0.5"
                                required
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0.00"
                                value={formData.cost_price}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        {/* Estoque Inicial */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Inicial</label>
                            <input
                                type="number"
                                name="stock_quantity"
                                min="1"
                                step="1"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                placeholder="1"
                                value={formData.stock_quantity}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                            />
                            <p className={(parseFloat(formData.stock_quantity) < parseFloat(formData.min_stock)) ? "text-xs text-red-500 mt-1 font-bold" : "text-xs text-gray-500 mt-1"}>
                                Deve ser maior ou igual ao estoque mínimo.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
                            <input
                                type="number"
                                name="min_stock"
                                min="1"
                                step="1"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                placeholder="1"
                                value={formData.min_stock}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Deve ser maior que 1 unidade.
                            </p>
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
                                    Se não informados, serão utilizados valores padrão.
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
                                        <p className="text-[10px] text-gray-500 mt-1">Nomenclatura Comum do Mercosul (8 dígitos)</p>
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
                                        <p className="text-[10px] text-gray-500 mt-1">Código Especificador da Substituição Tributária</p>
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
                        <Link
                            href="/"
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={loading || parseFloat(formData.stock_quantity) < parseFloat(formData.min_stock)}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <Save size={18} />
                            {loading ? "Salvando..." : "Salvar Produto"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}