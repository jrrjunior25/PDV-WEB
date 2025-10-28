import React, { useState, useMemo, useReducer, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { Product, SaleItem, Sale, SystemSettings, CashRegisterSession, Customer, StoreCredit } from '../types';
import { useAuth } from '../auth/AuthContext';
import { generatePixBrCode } from '../services/pixService';
import Input from './ui/Input';
import Button from './ui/Button';
import Modal from './ui/Modal';
import QRCode from './ui/QRCode';
import { Trash2Icon, SearchIcon, PrinterIcon, CalculatorIcon, UserSearchIcon, TruckIcon, TicketIcon } from './icons/Icon';

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

// FIX: Helper function to robustly extract the city from an address string.
const getCityFromAddress = (address: string | undefined): string => {
    const defaultCity = 'SAO PAULO';
    if (!address) return defaultCity;

    const parts = address.split(',').map(p => p.trim());
    
    // Most reliable is the last part, which might contain "City - State"
    if (parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        const cityInLastPart = lastPart.split('-')[0].trim();
        if (cityInLastPart && cityInLastPart.length > 2) { // Check if it's not just a state code
            return cityInLastPart;
        }
    }

    // If the above fails, try the second to last part
    if (parts.length > 1) {
        const potentialCity = parts[parts.length - 2];
        if (potentialCity && potentialCity.length > 2) {
             return potentialCity;
        }
    }
    
    return defaultCity; // Return a default if no valid city can be found.
};

const POS = () => {
  const { user } = useAuth();
  const { data: products, refetch: refetchProducts } = useMockApi<Product[]>(api.getProducts);
  const { data: settings } = useMockApi<SystemSettings>(api.getSettings);
  const { data: storeCredits, refetch: refetchCredits } = useMockApi<StoreCredit[]>(api.getStoreCredits);
  
  const [cashSession, setCashSession] = useState<CashRegisterSession | null | undefined>(undefined);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [lastAddedItem, setLastAddedItem] = useState<SaleItem | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [customerCredits, setCustomerCredits] = useState<StoreCredit[]>([]);

  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('PIX');
  const [pixBrCode, setPixBrCode] = useState<string | null>(null);
  const [appliedCredit, setAppliedCredit] = useState(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState<Sale | null>(null);

  const [isCashManagerOpen, setIsCashManagerOpen] = useState(false);
  const [sangriaAmount, setSangriaAmount] = useState(0);
  const [closingAmount, setClosingAmount] = useState<number | undefined>(undefined);
  const [closingNotes, setClosingNotes] = useState('');
  
  const [isIdentifyCustomerModalOpen, setIdentifyCustomerModalOpen] = useState(true);

  const receiptRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cartTotal = useMemo(() => cart.reduce((total, item) => total + item.totalPrice, 0), [cart]);
  const amountDue = useMemo(() => Math.max(0, cartTotal - appliedCredit), [cartTotal, appliedCredit]);

  const fetchCashSession = useCallback(async () => {
    const session = await api.getCurrentCashRegisterSession();
    setCashSession(session);
    if(session){
        setIdentifyCustomerModalOpen(true);
    }
  }, []);
  
  useEffect(() => {
    fetchCashSession();
  }, [fetchCashSession]);
  
  useEffect(() => {
    if(cashSession && !activeCustomer) {
        setIdentifyCustomerModalOpen(true);
    }
    if (activeCustomer && storeCredits) {
        const credits = storeCredits.filter(c => c.customerId === activeCustomer.id && c.status === 'Active');
        setCustomerCredits(credits);
    } else {
        setCustomerCredits([]);
    }
  }, [cashSession, activeCustomer, storeCredits]);

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
    if (isPaymentModalOpen && paymentMethod === 'PIX' && settings && amountDue > 0) {
        const brCode = generatePixBrCode({
            pixKey: settings.pixKey,
            recipientName: settings.companyName,
            city: getCityFromAddress(settings.address),
            amount: isNaN(amountDue) ? 0 : amountDue, // Extra safety check
            txid: `SALE${Date.now()}`
        });
        setPixBrCode(brCode);
    } else {
        setPixBrCode(null);
    }
  }, [isPaymentModalOpen, paymentMethod, settings, amountDue]);
  

  const formatCurrency = (value: number | undefined) => (value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const handleAddProduct = (product: Product) => {
    if (product.stock > 0) {
        dispatch({ type: 'ADD_ITEM', payload: { product, quantity: 1 } });
        setSearchTerm('');
        searchInputRef.current?.focus();
    } else {
        alert(`Produto "${product.name}" sem estoque.`);
    }
  };


  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || !activeCustomer) return;
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    // Prioritize exact barcode match, then partial name match
    const product = products?.find(p => p.barcode === searchTerm || p.name.toLowerCase().includes(lowerCaseSearchTerm));
    
    if (product) {
      handleAddProduct(product);
    } else {
      alert('Produto não encontrado.');
    }
  };

  const startNewSale = () => {
    dispatch({ type: 'CLEAR_CART' });
    setSaleCompleted(null);
    setPaymentModalOpen(false);
    setIdentifyCustomerModalOpen(true);
    setActiveCustomer(null);
    setAppliedCredit(0);
    refetchProducts();
    refetchCredits();
  };

  const handleFinalizeSale = async () => {
    setIsProcessing(true);
    try {
        let finalPaymentMethod: Sale['paymentMethod'] = paymentMethod;
        if (amountDue <= 0 && appliedCredit > 0) {
            finalPaymentMethod = 'Troca / Vale-Crédito';
        }

        const saleData = { 
            items: cart, 
            totalAmount: cartTotal, 
            paymentMethod: finalPaymentMethod, 
            customerId: activeCustomer?.id,
            customerName: activeCustomer?.name,
        };
        
        const creditPayment = appliedCredit > 0 ? {
            creditIds: customerCredits.map(c => c.id),
            amount: appliedCredit,
        } : undefined;

        const completedSale = await api.processSale(saleData, creditPayment);
        setSaleCompleted(completedSale);

    } catch (error) {
        console.error("Erro ao processar venda:", error);
        alert("Falha ao processar a venda.");
    } finally { setIsProcessing(false); setPaymentModalOpen(false); }
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
  
  const handleCreateDelivery = async () => {
    if(!saleCompleted || !saleCompleted.customerId || !activeCustomer?.address) return;
    setIsProcessing(true);
    try {
        const newDelivery = await api.createDeliveryForSale(saleCompleted.id, activeCustomer.name, activeCustomer.address);
        alert("Entrega registrada com sucesso!");
        setSaleCompleted(prevSale => prevSale ? { ...prevSale, deliveryId: newDelivery.id } : null);
    } catch (error) {
        console.error("Erro ao criar entrega:", error);
        alert("Falha ao registrar entrega.");
    } finally {
        setIsProcessing(false);
    }
  }

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
        <Input label="Valor de Abertura (Suprimento)" type="number" value={String(amount)} onChange={e => setAmount(parseFloat(e.target.value) || 0)} placeholder="R$ 0,00" autoFocus/>
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
                <Input label="Valor da Retirada" type="number" value={String(sangriaAmount)} onChange={e => setSangriaAmount(parseFloat(e.target.value) || 0)} className="flex-1"/>
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
             <Input label="Valor Contado em Caixa" type="number" placeholder="Digite o valor apurado" value={String(closingAmount ?? '')} onChange={e => { const val = parseFloat(e.target.value); setClosingAmount(isNaN(val) ? undefined : val); }}/>
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

const PaymentModal = () => {
    const totalCreditBalance = useMemo(() => customerCredits.reduce((acc, credit) => acc + credit.balance, 0), [customerCredits]);

    const handleApplyCredit = () => {
        const amountToApply = Math.min(totalCreditBalance, cartTotal);
        setAppliedCredit(amountToApply);
    };

    return (
        <Modal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Finalizar Venda">
            <div>
                <div className="text-center mb-6">
                    <p className="text-lg text-text-secondary">Total da Compra</p>
                    <p className="text-5xl font-bold text-text-primary">{cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    {appliedCredit > 0 && (
                        <>
                         <p className="text-lg font-semibold text-green-600 mt-2">- {appliedCredit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (Vale-Crédito)</p>
                         <hr className="my-2"/>
                         <p className="text-lg text-text-secondary">Total a Pagar</p>
                         <p className="text-5xl font-bold text-brand-primary">{amountDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </>
                    )}
                </div>

                {totalCreditBalance > 0 && appliedCredit === 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6 flex items-center justify-between">
                        <div className="flex items-center">
                            <TicketIcon className="h-6 w-6 text-green-700 mr-3"/>
                            <div>
                                <h4 className="font-semibold text-green-800">Vale-Crédito Disponível</h4>
                                <p className="text-xl font-bold text-green-700">{totalCreditBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            </div>
                        </div>
                        <Button size="sm" onClick={handleApplyCredit}>Aplicar Crédito</Button>
                    </div>
                )}
                
                {amountDue > 0 && (
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
                )}

                {paymentMethod === 'PIX' && pixBrCode && amountDue > 0 &&(
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                        <h4 className="font-semibold text-text-primary mb-2">Pagar com PIX</h4>
                        <p className="text-sm text-text-muted mb-4">Escaneie o QR Code com o app do seu banco.</p>
                        <div className="flex justify-center"><QRCode value={pixBrCode} /></div>
                    </div>
                )}
                <div className="mt-8 flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => {setPaymentModalOpen(false); setAppliedCredit(0);}}>Cancelar</Button>
                    <Button onClick={handleFinalizeSale} isLoading={isProcessing}>
                        {amountDue <= 0 ? 'Finalizar com Vale-Crédito' : 'Confirmar Pagamento'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

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
            <Button onClick={() => setPaymentModalOpen(true)} disabled={cart.length === 0} className="h-14 text-lg px-8">
                Finalizar Venda
            </Button>
        </div>
      </div>

      <Modal isOpen={isCashManagerOpen} onClose={() => setIsCashManagerOpen(false)} title={cashSession ? "Gerenciar Caixa" : "Abrir Caixa"}>
        {cashSession ? <ManageCashRegister /> : <OpenCashRegisterForm />}
      </Modal>

       <PaymentModal />
       
       <Modal isOpen={!!saleCompleted} onClose={startNewSale} title="Venda Finalizada com Sucesso!">
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
               <hr className="my-1 border-dashed border-gray-400"/>
               <div className="flex justify-between">
                <span>Forma de Pagamento:</span>
                <span>{saleCompleted?.paymentMethod}</span>
              </div>
              {saleCompleted?.storeCreditAmountUsed && saleCompleted.storeCreditAmountUsed > 0 && (
                <div className="flex justify-between">
                    <span>(Valor em Vale-Crédito):</span>
                    <span>{saleCompleted.storeCreditAmountUsed.toFixed(2)}</span>
                </div>
              )}
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
            <div className="mt-6 flex justify-between items-center no-print">
                <div>
                {activeCustomer?.address && (
                    <Button 
                        id="delivery-btn"
                        variant="secondary" 
                        onClick={handleCreateDelivery} 
                        isLoading={isProcessing}
                        disabled={!!saleCompleted?.deliveryId}
                    >
                        <TruckIcon className="h-4 w-4 mr-2"/>
                        {saleCompleted?.deliveryId ? 'Entrega Registrada' : 'Enviar para Entrega'}
                    </Button>
                )}
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={startNewSale}>Nova Venda</Button>
                    <Button onClick={handlePrintReceipt}><PrinterIcon className="h-4 w-4 mr-2"/>Imprimir</Button>
                </div>
            </div>
        </div>
       </Modal>
    </div>
  );
};

export default POS;