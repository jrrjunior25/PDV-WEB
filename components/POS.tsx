import React, { useState, useMemo, useReducer, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { Product, SaleItem, Sale, SystemSettings, CashRegisterSession, Customer } from '../types';
import { useAuth } from '../auth/AuthContext';
import { generatePixBrCode } from '../services/pixService';
import Input from './ui/Input';
import Button from './ui/Button';
import Modal from './ui/Modal';
import QRCode from './ui/QRCode';
import { Trash2Icon, SearchIcon, PrinterIcon, CalculatorIcon, UserSearchIcon } from './icons/Icon';

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product, quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const cartReducer = (state: SaleItem[], action: CartAction): SaleItem[] => {
  switch (action.type) {
    case 'ADD_ITEM':
      const { product, quantity } = action.payload;
      const existingItem = state.find(item => item.productId === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        return state.map(item =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
            : item
        );
      }
      return [
        ...state,
        {
          productId: product.id,
          productName: product.name,
          quantity: quantity,
          unitPrice: product.price,
          totalPrice: product.price * quantity,
          imageUrl: product.imageUrl,
          returnableQuantity: 0, // This is temporary, will be set on sale completion
        },
      ];
    case 'REMOVE_ITEM':
      return state.filter(item => item.productId !== action.payload.productId);
    case 'UPDATE_QUANTITY':
        if (action.payload.quantity <= 0) {
            return state.filter(item => item.productId !== action.payload.productId);
        }
        return state.map(item =>
            item.productId === action.payload.productId
            ? { ...item, quantity: action.payload.quantity, totalPrice: action.payload.quantity * item.unitPrice }
            : item
        );
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
};

const POS: React.FC = () => {
  const { user } = useAuth();
  const { data: products, refetch: refetchProducts } = useMockApi<Product[]>(api.getProducts);
  const { data: settings } = useMockApi<SystemSettings>(api.getSettings);
  
  const [cashSession, setCashSession] = useState<CashRegisterSession | null | undefined>(undefined);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [lastAddedItem, setLastAddedItem] = useState<SaleItem | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  
  const [isFinalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('PIX');
  const [pixBrCode, setPixBrCode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState<Sale | null>(null);

  const [isCashManagerOpen, setIsCashManagerOpen] = useState(false);
  const [sangriaAmount, setSangriaAmount] = useState(0);
  const [closingAmount, setClosingAmount] = useState<number | undefined>(undefined);
  const [closingNotes, setClosingNotes] = useState('');
  
  const [isIdentifyCustomerModalOpen, setIdentifyCustomerModalOpen] = useState(true);

  const receiptRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchCashSession = async () => {
    const session = await api.getCurrentCashRegisterSession();
    setCashSession(session);
    if(session){
        setIdentifyCustomerModalOpen(true);
    }
  };
  
  useEffect(() => {
    fetchCashSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if(cashSession && !activeCustomer) {
        setIdentifyCustomerModalOpen(true);
    }
  }, [cashSession, activeCustomer]);

  const cartTotal = useMemo(() => cart.reduce((total, item) => total + item.totalPrice, 0), [cart]);
  
  const closingReport = useMemo(() => {
    if (!cashSession || !isCashManagerOpen) return null;
    const cashSales = cashSession.salesSummary['Dinheiro'] || 0;
    const expected = cashSession.openingBalance + cashSales - cashSession.totalSangrias;
    const difference = closingAmount !== undefined ? closingAmount - expected : 0;
    return { ...cashSession, expected, difference };
  }, [cashSession, isCashManagerOpen, closingAmount]);

  useEffect(() => {
    if (cart.length > 0) {
        const lastItem = cart[cart.length - 1];
        const lastProduct = products?.find(p => p.id === lastItem.productId);
        if (lastProduct) { setLastAddedItem({ ...lastItem, imageUrl: lastProduct.imageUrl }); }
    } else { setLastAddedItem(null); }
  }, [cart, products]);

  useEffect(() => {
    if (isPaymentModalOpen && paymentMethod === 'PIX' && settings && cartTotal > 0) {
        const brCode = generatePixBrCode({
            pixKey: settings.pixKey, recipientName: settings.companyName,
            city: settings.address.split(',')[1]?.trim()?.split('-')[0]?.trim() || 'SAO PAULO',
            amount: cartTotal, txid: `SALE${Date.now()}`
        });
        setPixBrCode(brCode);
    } else { setPixBrCode(null); }
  }, [isPaymentModalOpen, paymentMethod, settings, cartTotal]);
  
  const formatCurrency = (value: number | undefined) => (value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || !activeCustomer) return;
    const foundProduct = products?.find(p => p.barcode === searchTerm || p.name.toLowerCase() === searchTerm.toLowerCase());
    if (foundProduct) {
        if(foundProduct.stock > 0) {
            dispatch({ type: 'ADD_ITEM', payload: { product: foundProduct, quantity: 1 } });
            setSearchTerm('');
        } else { alert(`Produto "${foundProduct.name}" sem estoque.`); }
    } else { alert('Produto não encontrado.'); }
    searchInputRef.current?.focus();
  };

  const startNewSale = () => {
    dispatch({ type: 'CLEAR_CART' });
    setSaleCompleted(null);
    setPaymentModalOpen(false);
    setFinalizeModalOpen(false);
    setIdentifyCustomerModalOpen(true);
    setActiveCustomer(null);
    refetchProducts();
  };

  const handleFinalizeSale = async (method?: Sale['paymentMethod']) => {
    const finalPaymentMethod = method || paymentMethod;
    setIsProcessing(true);
    try {
        const saleData = { 
            items: cart, 
            totalAmount: cartTotal, 
            paymentMethod: finalPaymentMethod, 
            customerId: activeCustomer?.id,
            customerName: activeCustomer?.name,
        };
        const deliveryInfo = finalPaymentMethod === 'A Pagar na Entrega' ? { address: activeCustomer?.address || '', customerName: activeCustomer?.name || '' } : undefined;
        const completedSale = await api.processSale(saleData, deliveryInfo);
        
        if (finalPaymentMethod !== 'A Pagar na Entrega') {
            setSaleCompleted(completedSale);
        } else {
            alert('Venda enviada para entrega com sucesso!');
            startNewSale();
        }
    } catch (error) {
        console.error("Erro ao processar venda:", error);
        alert("Falha ao processar a venda.");
    } finally { setIsProcessing(false); if (method !== 'A Pagar na Entrega') { setFinalizeModalOpen(false); setPaymentModalOpen(false); } }
  };
  
  const handleOpenCashRegister = async (openingBalance: number) => {
    if (!user || openingBalance < 0) return;
    setIsProcessing(true);
    try {
      await api.openCashRegister(openingBalance, user.id, user.name);
      await fetchCashSession();
      setIsCashManagerOpen(false);
    } catch (error: any) { alert(`Erro ao abrir caixa: ${error.message}`);
    } finally { setIsProcessing(false); }
  };

  const handleRecordSangria = async () => {
    if (!cashSession || sangriaAmount <= 0) return;
    setIsProcessing(true);
    try {
      await api.recordSangria(cashSession.id, sangriaAmount, user?.name || 'N/A');
      await fetchCashSession();
      setSangriaAmount(0);
      alert("Sangria registrada com sucesso!");
    } catch (error: any) { alert(`Erro ao registrar sangria: ${error.message}`);
    } finally { setIsProcessing(false); }
  };

  const handleCloseCashRegister = async () => {
    if (!cashSession || closingAmount === undefined) return;
    setIsProcessing(true);
    try {
      await api.closeCashRegister(cashSession.id, closingAmount, closingNotes);
      await fetchCashSession();
      setIsCashManagerOpen(false);
      setClosingAmount(undefined);
      setClosingNotes('');
    } catch (error: any) { alert(`Erro ao fechar caixa: ${error.message}`);
    } finally { setIsProcessing(false); }
  };
  
  const handlePrintReceipt = () => {
      const receiptContent = receiptRef.current?.innerHTML;
      if (receiptContent) {
        const printWindow = window.open('', '_blank');
        printWindow?.document.write(`<html><head><title>NFC-e</title><style>body { font-family: monospace; font-size: 10px; } @media print { .no-print { display: none; } }</style></head><body>${receiptContent}</body></html>`);
        printWindow?.document.close();
        printWindow?.print();
      }
  };

  const formatAccessKey = (key: string | undefined) => key?.match(/.{1,4}/g)?.join(' ') ?? '';

  const CashRegisterOverlay = () => (
    <div className="absolute inset-0 bg-gray-800 bg-opacity-70 flex flex-col justify-center items-center z-20">
      <div className="text-center text-white p-8 bg-black/50 rounded-lg">
        <h2 className="text-4xl font-bold mb-4">Caixa Fechado</h2>
        <p className="mb-8">Você precisa abrir o caixa para iniciar as vendas.</p>
        <Button size="lg" onClick={() => setIsCashManagerOpen(true)}>Abrir Caixa</Button>
      </div>
    </div>
  );

  const OpenCashRegisterForm = () => {
    const [amount, setAmount] = useState(0);
    return (
      <div className="space-y-4">
        <Input label="Valor de Abertura (Suprimento)" type="number" value={String(amount)} onChange={e => setAmount(parseFloat(e.target.value))} placeholder="R$ 0,00" autoFocus/>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setIsCashManagerOpen(false)}>Cancelar</Button>
          <Button onClick={() => handleOpenCashRegister(amount)} isLoading={isProcessing}>Confirmar Abertura</Button>
        </div>
      </div>
    );
  };
  
  const ManageCashRegister = () => (
    <div className="space-y-6">
        <div className="space-y-3 p-4 border rounded-lg">
            <h4 className="font-semibold text-text-primary">Registrar Sangria (Retirada)</h4>
            <div className="flex items-center gap-3">
                <Input label="Valor da Retirada" type="number" value={String(sangriaAmount)} onChange={e => setSangriaAmount(parseFloat(e.target.value))} className="flex-1"/>
                <Button onClick={handleRecordSangria} isLoading={isProcessing} disabled={sangriaAmount <= 0} className="self-end">Registrar</Button>
            </div>
        </div>
        <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-semibold text-text-primary mb-2">Fechar Caixa</h4>
            <div className="text-sm space-y-2 p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between"><span>Abertura (Suprimento):</span> <span className="font-semibold">R$ {formatCurrency(closingReport?.openingBalance)}</span></div>
                <div className="flex justify-between"><span>(+) Vendas em Dinheiro:</span> <span className="font-semibold text-green-600">R$ {formatCurrency(closingReport?.salesSummary['Dinheiro'])}</span></div>
                <div className="flex justify-between"><span>(-) Total de Sangrias:</span> <span className="font-semibold text-red-600">R$ {formatCurrency(closingReport?.totalSangrias)}</span></div>
                <hr className="my-1"/>
                <div className="flex justify-between font-bold text-base"><span>(=) Valor Esperado em Caixa:</span> <span>R$ {formatCurrency(closingReport?.expected)}</span></div>
            </div>
             <Input label="Valor Contado em Caixa" type="number" placeholder="Digite o valor apurado" value={String(closingAmount ?? '')} onChange={e => setClosingAmount(parseFloat(e.target.value))}/>
            {closingAmount !== undefined && closingReport && (
                 <div className={`flex justify-between font-bold text-lg p-3 rounded-md ${closingReport.difference === 0 ? 'bg-gray-100' : (closingReport.difference > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}`}>
                    <span>Diferença:</span>
                    <span>{closingReport.difference > 0 ? `+ R$ ${formatCurrency(closingReport.difference)} (Sobra)` : `R$ ${formatCurrency(closingReport.difference)} (Falta)`}</span>
                </div>
            )}
            <Input label="Notas de Fechamento (Opcional)" value={closingNotes} onChange={e => setClosingNotes(e.target.value)} placeholder="Ex: Diferença por erro de troco."/>
            <Button onClick={handleCloseCashRegister} isLoading={isProcessing} disabled={closingAmount === undefined} className="w-full">Confirmar e Fechar Caixa</Button>
        </div>
    </div>
);

const IdentifyCustomerModal = () => {
    const [cpf, setCpf] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        setError('');
        try {
            const customer = await api.getCustomerByCpf(cpf);
            if(customer){
                setActiveCustomer(customer);
                setIdentifyCustomerModalOpen(false);
            } else {
                setError('Cliente não encontrado.');
            }
        } catch(err) { setError('Erro ao buscar cliente.'); }
        finally { setIsSearching(false); }
    };

    const handleNoIdentification = async () => {
        const consumer = await api.getCustomerByCpf(''); // Assuming empty CPF fetches final consumer
        setActiveCustomer(consumer);
        setIdentifyCustomerModalOpen(false);
    }
    
    return (
        <Modal isOpen={isIdentifyCustomerModalOpen} onClose={() => {}} title="Identificar Cliente">
            <form onSubmit={handleSearch}>
                <p className="text-text-secondary mb-4">Para iniciar a venda, identifique o cliente pelo CPF/CNPJ ou continue sem identificação.</p>
                <Input label="CPF / CNPJ do Cliente" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="Digite o número" autoFocus/>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="secondary" onClick={handleNoIdentification}>Continuar sem identificar</Button>
                    <Button type="submit" isLoading={isSearching}>Buscar Cliente</Button>
                </div>
            </form>
        </Modal>
    )
}

const FinalizeSaleModal = () => (
    <Modal isOpen={isFinalizeModalOpen} onClose={() => setFinalizeModalOpen(false)} title="Como deseja finalizar?">
        <div className="flex flex-col gap-4">
            <Button size="lg" className="w-full" onClick={() => { setFinalizeModalOpen(false); setPaymentModalOpen(true); }}>
                Finalizar Pagamento no Caixa
            </Button>
            <Button size="lg" variant="secondary" className="w-full"
                onClick={() => handleFinalizeSale('A Pagar na Entrega')}
                disabled={!activeCustomer?.address}
                isLoading={isProcessing}>
                Enviar para Entrega
            </Button>
            {!activeCustomer?.address && <p className="text-xs text-center text-red-500">A entrega está desabilitada pois este cliente não possui endereço cadastrado.</p>}
        </div>
    </Modal>
);

  return (
    <div className="relative flex flex-col h-full max-h-[calc(100vh-4rem)] bg-gray-200 font-sans">
      {cashSession === null && <CashRegisterOverlay />}
      {cashSession && !activeCustomer && <IdentifyCustomerModal />}
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 p-4">
        {/* Left Panel: The Receipt */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-md flex flex-col p-6">
            <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold text-text-primary">{settings?.companyName || "PDV Inteligente"}</h2>
                <p className="text-sm text-text-muted">CNPJ: {settings?.cnpj || '00.000.000/0001-00'}</p>
                 <div className="mt-2 text-sm font-semibold text-blue-600 bg-blue-50 p-2 rounded-md">
                   Cliente: {activeCustomer?.name || 'Não Identificado'}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto py-4 font-mono text-lg">
                {!activeCustomer ? (
                     <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                        <UserSearchIcon className="h-16 w-16 mb-4"/>
                        <p className="text-2xl">Identifique o cliente para iniciar</p>
                    </div>
                ) : cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                        <p className="text-2xl">Aguardando itens...</p>
                        <p className="text-sm mt-2">Use o leitor de código de barras ou digite o nome do produto abaixo.</p>
                    </div>
                ) : (
                    <>
                    <div className="grid grid-cols-12 text-sm font-bold text-text-secondary px-2 mb-2">
                        <div className="col-span-6">DESCRIÇÃO</div>
                        <div className="col-span-2 text-right">QTD</div>
                        <div className="col-span-2 text-right">VL. UN</div>
                        <div className="col-span-2 text-right">SUBTOTAL</div>
                    </div>
                    <div className="space-y-2">
                        {cart.map((item, index) => (
                            <div key={item.productId + index} className="grid grid-cols-12 items-center p-2 rounded-lg bg-gray-50 text-base">
                                <div className="col-span-6 font-semibold">{item.productName}</div>
                                <div className="col-span-2 text-right">{item.quantity}</div>
                                <div className="col-span-2 text-right">{formatCurrency(item.unitPrice)}</div>
                                <div className="col-span-2 text-right font-bold">{formatCurrency(item.totalPrice)}</div>
                            </div>
                        ))}
                    </div>
                    </>
                )}
            </div>
        </div>

        {/* Right Panel: The Summary */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md flex flex-col p-6 text-center">
             <div className={`font-bold text-3xl py-4 rounded-md mb-6 text-white transition-colors ${cart.length === 0 ? 'bg-green-500' : 'bg-blue-500'}`}>
                {cart.length === 0 ? "CAIXA LIVRE" : "COMPRA EM ANDAMENTO"}
            </div>
            
            <div className="flex-1 flex flex-col justify-center items-center p-4 min-h-[250px]">
                {lastAddedItem ? (
                    <>
                        <img src={lastAddedItem.imageUrl} alt={lastAddedItem.productName} className="max-h-32 rounded-lg mb-4 shadow-md"/>
                        <p className="text-3xl font-bold text-text-primary">{lastAddedItem.productName}</p>
                        <p className="text-2xl text-text-secondary mt-2">
                            {lastAddedItem.quantity} x {lastAddedItem.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} = 
                            <span className="font-bold ml-2">{lastAddedItem.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </p>
                    </>
                ) : (
                    <div className="text-gray-400">
                        <p className="text-2xl">Bem-vindo!</p>
                        <p>Passe o primeiro item para iniciar.</p>
                    </div>
                )}
            </div>

            <div className="mt-auto pt-6 border-t-2 border-dashed">
                <p className="text-4xl text-text-secondary font-semibold">TOTAL</p>
                <p className="text-8xl font-bold text-brand-primary tracking-tighter -mb-2">
                    {cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
            </div>
        </div>
      </div>

       {/* Bottom: The operator controls */}
      <div className="flex-shrink-0 bg-surface-card p-4 border-t-2 shadow-inner z-10">
        <div className="flex items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <Input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="Ler código de barras ou digitar nome do produto..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-12 text-lg h-14"
                    aria-label="Busca de produto"
                    disabled={!activeCustomer}
                />
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-7 w-7 text-text-muted" />
            </form>
            <Button variant="secondary" className="h-14 px-4" onClick={() => setIsCashManagerOpen(true)} disabled={!cashSession}>
                <CalculatorIcon className="h-6 w-6 mr-2" /> Gerenciar Caixa
            </Button>
            <Button variant="danger" className="h-14 w-14 p-0" onClick={() => dispatch({ type: 'CLEAR_CART' })} disabled={cart.length === 0} aria-label="Limpar carrinho">
                <Trash2Icon className="h-7 w-7"/>
            </Button>
            <Button onClick={() => setFinalizeModalOpen(true)} disabled={cart.length === 0} className="h-14 text-lg px-8">
                Finalizar Venda
            </Button>
        </div>
      </div>

      <Modal isOpen={isCashManagerOpen} onClose={() => setIsCashManagerOpen(false)} title={cashSession ? "Gerenciar Caixa" : "Abrir Caixa"}>
        {cashSession ? <ManageCashRegister /> : <OpenCashRegisterForm />}
      </Modal>

      <FinalizeSaleModal />

       <Modal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Finalizar Venda">
        <div>
            <div className="text-center mb-6">
                <p className="text-lg text-text-secondary">Total a Pagar</p>
                <p className="text-5xl font-bold text-brand-primary">{cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
            <div className="space-y-4">
                <h3 className="font-semibold">Método de pagamento:</h3>
                <div className="grid grid-cols-2 gap-4">
                    {(['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX'] as const).map(method => (
                        <button key={method} onClick={() => setPaymentMethod(method)}
                            className={`p-4 border rounded-lg text-center font-semibold transition-colors ${paymentMethod === method ? 'bg-brand-primary text-white border-brand-primary' : 'hover:border-brand-light'}`}>
                            {method}
                        </button>
                    ))}
                </div>
            </div>

            {paymentMethod === 'PIX' && pixBrCode && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                    <h4 className="font-semibold text-text-primary mb-2">Pagar com PIX</h4>
                    <p className="text-sm text-text-muted mb-4">Escaneie o QR Code com o app do seu banco.</p>
                    <div className="flex justify-center"><QRCode value={pixBrCode} /></div>
                </div>
            )}
            <div className="mt-8 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>Cancelar</Button>
                <Button onClick={() => handleFinalizeSale()} isLoading={isProcessing}>Confirmar Pagamento</Button>
            </div>
        </div>
       </Modal>
       
       <Modal isOpen={!!saleCompleted} onClose={startNewSale} title="NFC-e - Nota Fiscal de Consumidor Eletrônica">
        <div>
            <div ref={receiptRef} className="max-w-md mx-auto border-2 border-dashed border-gray-400 p-4 bg-white text-black font-mono text-xs">
              <div className="text-center">
                <h1 className="font-bold text-sm">{settings?.companyName}</h1>
                <p>CNPJ: {settings?.cnpj}</p>
                <p>{settings?.address}</p>
                <hr className="my-2 border-dashed border-gray-400"/>
                <h2 className="font-bold">DANFE NFC-e</h2>
                <h3 className="font-bold">Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</h3>
                <p>Não permite aproveitamento de crédito de ICMS</p>
                <hr className="my-2 border-dashed border-gray-400"/>
              </div>
              <div>
                <p className="font-bold"># COD DESC QTD UN VL.UNIT VL.TOTAL</p>
                {saleCompleted?.items.map((item, index) => (
                  <div key={item.productId} className="grid grid-cols-12 gap-1 leading-tight my-1">
                    <span className="col-span-1">{index+1}</span>
                    <span className="col-span-2">{item.productId}</span>
                    <span className="col-span-3 truncate">{item.productName}</span>
                    <span className="col-span-1 text-right">{item.quantity}</span>
                    <span className="col-span-2 text-right">{item.unitPrice.toFixed(2)}</span>
                    <span className="col-span-3 text-right font-bold">{item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <hr className="my-2 border-dashed border-gray-400"/>
              <div className="flex justify-between font-bold">
                <span>QTD. TOTAL DE ITENS</span>
                <span>{saleCompleted?.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-base">
                <span>VALOR TOTAL R$</span>
                <span>{saleCompleted?.totalAmount.toFixed(2)}</span>
              </div>
               <div className="flex justify-between">
                <span>Forma de Pagamento:</span>
                <span>{saleCompleted?.paymentMethod}</span>
              </div>
               <div className="flex justify-between font-bold">
                <span>VALOR PAGO R$</span>
                <span>{saleCompleted?.totalAmount.toFixed(2)}</span>
              </div>
              <hr className="my-2 border-dashed border-gray-400"/>
              <p className="text-center">{saleCompleted?.customerName ? saleCompleted.customerName.toUpperCase() : 'CONSUMIDOR NÃO IDENTIFICADO'}</p>
              <hr className="my-2 border-dashed border-gray-400"/>
              <div className="text-center my-4">
                  <div className="flex justify-center">
                    {saleCompleted?.nfceQrCodeUrl && <QRCode value={saleCompleted.nfceQrCodeUrl} size={120} />}
                  </div>
                  <p className="font-bold mt-2">Consulte pela Chave de Acesso em</p>
                  <p>https://www.sefaz.rs.gov.br/nfce/consulta</p>
              </div>
              <p className="text-center break-all font-bold">{formatAccessKey(saleCompleted?.nfceAccessKey)}</p>
              <hr className="my-2 border-dashed border-gray-400"/>
              <p className="text-center">Protocolo de autorização: 123456789012345</p>
              <p className="text-center">Data: {saleCompleted ? new Date(saleCompleted.date).toLocaleString('pt-BR') : ''}</p>
            </div>
            <div className="mt-6 flex justify-end gap-3 no-print">
                <Button variant="secondary" onClick={startNewSale}>Nova Venda</Button>
                <Button onClick={handlePrintReceipt}><PrinterIcon className="h-4 w-4 mr-2"/>Imprimir</Button>
            </div>
        </div>
       </Modal>
    </div>
  );
};

export default POS;