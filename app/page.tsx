"use client";
import { useEffect, useState } from "react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import {
  Edit, Trash2, Search,
  ShoppingCart, LogOut, Package,
  Loader2, Wallet, UserCog,
  History, Monitor, LockKeyhole,
  Receipt, Database, ScanBarcode,
  LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import CashierManager from "@/components/CashierManager";
import CheckoutModal from "@/components/CheckoutModal";
import QuantityModal from "@/components/QuantityModal";
import ChangeTerminalModal from "@/components/ChangeTerminalModal";
import useScanDetection from "@/hooks/useScanDetection";
import { parseBalanceBarcode } from "@/lib/barcode";
import CupomModal from "@/components/CupomModal";
import FechamentoModal from "@/components/FechamentoModal";
import { toast } from "sonner";

// Interfaces
interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  category: string;
  barcode?: string;
  is_weighted: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

export default function PDV() {
  const { user, role, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [terminalName, setTerminalName] = useState("");
  const router = useRouter();

  const canManage = role === 'admin' || role === 'manager';

  // Estados existentes
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pdv_cart");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // ESTADOS DE MODAIS
  const [isCashierModalOpen, setCashierModalOpen] = useState(false);
  const [isTerminalModalOpen, setTerminalModalOpen] = useState(false);
  const [selectedProductForQty, setSelectedProductForQty] = useState<Product | null>(null);
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [dadosFechamento, setDadosFechamento] = useState<any>(null);
  // ESTADOS DE CONTROLE
  const [isCashierOpen, setIsCashierOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);


  useEffect(() => {
    setTerminalName(Cookies.get("terminal_id") || "Indefinido");
  }, []);

  // Salvar carrinho no localStorage
  useEffect(() => {
    localStorage.setItem("pdv_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (isAuthenticated) {
      checkStatus();
      fetchProducts();
    };
  }, [isAuthenticated]);

  const checkStatus = async () => {
    try {
      const { data } = await api.get("/cashier/status");
      setIsCashierOpen(data.status === "open");
    } catch (e) { console.error(e); }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products/?active_only=true&limit=1000");
      setProducts(res.data.items);
    } catch (error) {
      console.error("Erro ao buscar produtos", error);
    }
  };

  const addToCart = (quantity: number) => {
    if (!selectedProductForQty) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === selectedProductForQty.id);
      if (existing) {
        return prev.map((item) =>
          item.id === selectedProductForQty.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...selectedProductForQty, quantity }];
    });
    setSelectedProductForQty(null);
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleEditTerminal = () => {
    if (isCashierOpen) {
      toast.warning("Feche o caixa antes de alterar as configurações do terminal.");
      return;
    }
    setTerminalModalOpen(true);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProductForQty(product);
  };

  const handleConfirmSale = async (paymentMethod: string) => {
    setLoading(true);
    try {
      const payload = {
        payment_method: paymentMethod,
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      };

      const response = await api.post("/sales/", payload);

      const dadosCupom = response.data;

      setLastSaleData(dadosCupom);
      setShowReceiptModal(true);

      setShowCheckout(false);
      setCart([]);
      fetchProducts();
      toast.success(`Venda finalizada com sucesso! Pagamento: ${paymentMethod.toUpperCase()}`);

    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Erro ao realizar venda");
    } finally {
      setLoading(false);
    }
  };

  const handlePreCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckout(true);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // <--- IMPEDE QUE O ENTER "VAZE" PARA O MODAL E FECHE ELE SOZINHO

      const exactMatch = products.find(p =>
        (p.barcode && p.barcode === search) ||
        p.name.toLowerCase() === search.toLowerCase()
      );

      if (exactMatch) {
        // Se achou, abre o modal (NÃO CHAME addToCart AQUI!)
        handleProductClick(exactMatch);
        setSearch("");
      } else if (filteredProducts.length === 1) {
        handleProductClick(filteredProducts[0]);
        setSearch("");
      }
    }
  };

  const handleScan = (code: string) => {
    const cleanCode = code.trim();
    const balance = parseBalanceBarcode(cleanCode);

    if (balance.isBalanceBarcode && balance.valid) {
      const product =
        products.find((p) => p.barcode?.trim() === cleanCode) ||
        products.find((p) => p.barcode?.trim() === balance.productCode);

      if (product) {
        setCart((prev) => {
          const existing = prev.find((item) => item.id === product.id);
          if (existing) {
            return prev.map((cartItem) =>
              cartItem.id === product.id
                ? { ...cartItem, quantity: Math.round((cartItem.quantity + balance.weightKg) * 1000) / 1000 }
                : cartItem
            );
          }
          return [...prev, { ...product, quantity: balance.weightKg }];
        });
        toast.success(`${product.name} - ${balance.weightKg.toFixed(3)}kg adicionado`);
        return;
      }
    }

    const product = products.find((p) => p.barcode?.trim() === cleanCode);

    if (product) {
      handleProductClick(product);
      toast.success(`Produto identificado: ${product.name}`);
    } else {
      toast.warning(`Produto com código "${cleanCode}" não encontrado.`);
    }
  };

  useScanDetection({
    onScan: handleScan,
    minLength: 3 // Mínimo de caracteres para considerar um código
  });

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search)) // <--- Busca também no código
  );

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-2 text-blue-600">
          <Loader2 className="animate-spin w-10 h-10" />
          <span className="font-semibold">Verificando acesso...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* --- CORREÇÃO: Usamos Fragment (<>...</>) para tirar os modais de dentro do overflow-hidden --- */}

      <CashierManager
        isOpen={isCashierModalOpen}
        onClose={() => setCashierModalOpen(false)}
        onStatusChange={checkStatus}
        onCloseSuccess={(dados) => setDadosFechamento(dados)}
      />

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onConfirm={handleConfirmSale}
        total={total}
        cart={cart}
        loading={loading}
      />

      <CupomModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        dados={lastSaleData}
      />

      <FechamentoModal
        isOpen={!!dadosFechamento}
        dados={dadosFechamento}
        onClose={() => setDadosFechamento(null)}
      />

      <ChangeTerminalModal
        isOpen={isTerminalModalOpen}
        onClose={() => setTerminalModalOpen(false)}
        currentName={terminalName}
      />

      <QuantityModal
        isOpen={!!selectedProductForQty}
        product={selectedProductForQty}
        onClose={() => setSelectedProductForQty(null)}
        onConfirm={addToCart}
      />

      {/* --- INÍCIO DO LAYOUT PRINCIPAL --- */}
      <div className="flex h-screen bg-gray-100 overflow-hidden relative">

        {/* Coluna Esquerda: Produtos */}
        <div className="w-2/3 flex flex-col p-6 space-y-4">
          <header className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">

            {/* Linha Superior: Identidade e Logout */}
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
                  <LayoutGrid className="text-blue-600" /> Sistema PDV
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    Operador: <strong className="text-gray-700">{user}</strong>
                  </span>
                  <span className="h-4 w-px bg-gray-300 hidden sm:block"></span>
                  <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                    <Monitor size={12} className="text-gray-400" />
                    <span>Terminal: <strong className="text-gray-700">{terminalName}</strong></span>
                    {canManage && (
                      <button
                        onClick={handleEditTerminal}
                        className="ml-1 p-1 hover:bg-white hover:text-blue-600 rounded-full transition-colors"
                        title="Configurar Terminal"
                      >
                        <Edit size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                title="Sair do Sistema"
              >
                <span className="hidden sm:inline">Sair</span>
                <LogOut size={18} />
              </button>
            </div>

            {/* Linha Inferior: Barra de Ferramentas (Scrollável) */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200">
              {/* Botão de Caixa (Destaque) */}
              <button
                onClick={() => setCashierModalOpen(true)}
                className={`shrink-0 px-4 py-2.5 rounded-lg flex items-center gap-2 border font-medium transition-all shadow-sm ${!isCashierOpen
                  // Removi 'animate-pulse' para corrigir o visual tremido
                  ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
              >
                <Wallet size={18} />
                {isCashierOpen ? "Gerenciar Caixa" : "Abrir Caixa"}
              </button>

              <div className="h-8 w-px bg-gray-200 shrink-0 mx-1"></div>

              {/* Botões Admin */}
              {canManage && (
                <>
                  <Link href="/products" className="shrink-0 bg-blue-50 text-blue-700 border border-blue-100 px-4 py-2.5 rounded-lg hover:bg-blue-100 flex items-center gap-2 transition-colors font-medium text-sm">
                    <Package size={18} /> Produtos
                  </Link>
                  <Link href="/users" className="shrink-0 bg-purple-50 text-purple-700 border border-purple-100 px-4 py-2.5 rounded-lg hover:bg-purple-100 flex items-center gap-2 transition-colors font-medium text-sm">
                    <UserCog size={18} /> Usuários
                  </Link>
                  <Link href="/stock" className="shrink-0 bg-orange-50 text-orange-700 border border-orange-100 px-4 py-2.5 rounded-lg hover:bg-orange-100 flex items-center gap-2 transition-colors font-medium text-sm">
                    <History size={18} /> Estoque
                  </Link>
                  <Link href="/reports" className="shrink-0 bg-teal-50 text-teal-700 border border-teal-100 px-4 py-2.5 rounded-lg hover:bg-teal-100 flex items-center gap-2 transition-colors font-medium text-sm">
                    <Receipt size={18} /> Relatórios
                  </Link>

                  {/* Apenas Admin vê Backup */}
                  {role === 'admin' && (
                    <Link href="/backup" className="shrink-0 bg-gray-800 text-white border border-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors font-medium text-sm shadow-sm">
                      <Database size={18} /> Backup
                    </Link>
                  )}
                </>
              )}
            </div>
          </header>

          <div className="relative group">
            <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              {/* Se tiver texto e parecer número, mostra ícone de código de barras, senão lupa */}
              {search && /^\d+$/.test(search) ? <ScanBarcode size={20} /> : <Search size={20} />}
            </div>
            <input
              type="text"
              placeholder="Escanear código de barras ou buscar nome..."
              className="w-full pl-10 p-3 rounded-lg border-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown} // <--- O Pulo do Gato
              autoFocus // Já abre focado para escanear
            />
            {/* Botãozinho para limpar busca se tiver texto */}
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <span className="text-xs font-bold">ESC</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-4 pb-4 align-content-start">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition border border-transparent hover:border-blue-500 flex flex-col justify-between h-40 relative group"
              >
                <div className="pr-6">
                  <h3 className="font-semibold text-gray-800 line-clamp-2 leading-tight" title={product.name}>
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{product.category || "Geral"}</p>
                </div>

                <div className="flex justify-between items-end mt-2">
                  <span className="text-lg font-bold text-blue-600">
                    R$ {product.price.toFixed(2)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${product.stock_quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    Estoque: {product.is_weighted ? product.stock_quantity.toFixed(2) : product.stock_quantity} {product.is_weighted && "kg"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Carrinho */}
        <div className="w-1/3 bg-white shadow-xl flex flex-col border-l border-gray-200">
          <div className="p-6 bg-gray-800 text-white">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart /> Caixa
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <ShoppingCart size={48} />
                <p className="mt-2">Carrinho vazio</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.quantity}{item.is_weighted ? " kg " : ""}x R$ {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-800">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-500 text-lg">Total a Pagar</span>
              <span className="text-4xl font-bold text-gray-800">R$ {total.toFixed(2)}</span>
            </div>
            {isCashierOpen ? (
              <button
                onClick={handlePreCheckout}
                disabled={cart.length === 0 || loading}
                className={`w-full py-4 rounded-lg text-xl font-bold text-white transition
                        ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'}
                        `}
              >
                {loading ? "Processando..." : "FINALIZAR VENDA (F2)"}
              </button>
            ) : (
              <button
                onClick={() => setCashierModalOpen(true)}
                className="w-full py-4 rounded-lg text-xl font-bold text-white bg-gray-400 hover:bg-gray-500 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <LockKeyhole /> CAIXA FECHADO
              </button>
            )}

            {!isCashierOpen && (
              <p className="text-center text-xs text-red-500 mt-2 font-medium">
                Abra o caixa para realizar vendas.
              </p>
            )}
          </div>
        </div>
      </div>
    </> // Fim do Fragment
  );
}