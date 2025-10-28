import React, { useState, useMemo, useReducer, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { Product, SaleItem, Sale, SystemSettings, Customer } from '../types';
import { generatePixBrCode } from '../services/pixService';
import Input from './ui/Input';
import Button from './ui/Button';
import Modal from './ui/Modal';
import QRCode from './ui/QRCode';
import { PlusCircleIcon, MinusCircleIcon, Trash2Icon, SearchIcon, ShoppingCartIcon, PrinterIcon } from './icons/Icon';

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const cartReducer = (state: SaleItem[], action: CartAction): SaleItem[] => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.find(item => item.productId === action.payload.id);
      if (existingItem) {
        return state.map(item =>
          item.productId === action.payload.id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [
        ...state,
        {
          productId: action.payload.id,
          productName: action.payload.name,
          quantity: 1,
          unitPrice: action.payload.price,
          totalPrice: action.payload.price,
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
  const { data: products, loading, refetch: refetchProducts } = useMockApi<Product[]>(api.getProducts);
  const { data: settings } = useMockApi<SystemSettings>(api.getSettings);
  const { data: customers } = useMockApi<Customer[]>(api.getCustomers);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX'>('PIX');
  const [pixBrCode, setPixBrCode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState<Sale | null>(null);
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  }, [cart]);

  useEffect(() => {
    if (isPaymentModalOpen && paymentMethod === 'PIX' && settings && cartTotal > 0) {
        const brCode = generatePixBrCode({
            pixKey: settings.pixKey,
            recipientName: settings.companyName,
            city: settings.address.split(',')[1]?.trim()?.split('-')[0]?.trim() || 'SAO PAULO',
            amount: cartTotal,
            txid: `SALE${Date.now()}`
        });
        setPixBrCode(brCode);
    } else {
        setPixBrCode(null);
    }
  }, [isPaymentModalOpen, paymentMethod, settings, cartTotal]);


  const filteredProducts = useMemo(() => {
    return products?.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm)
    ) ?? [];
  }, [products, searchTerm]);

  const handleFinalizeSale = async () => {
    if (isDelivery && !deliveryAddress) {
      alert("Por favor, informe o endereço de entrega.");
      return;
    }
    setIsProcessing(true);
    try {
        const saleData = { items: cart, totalAmount: cartTotal, paymentMethod, customerName };
        const deliveryInfo = isDelivery ? { address: deliveryAddress, customerName: customerName || 'Cliente Balcão' } : undefined;
        const completedSale = await api.processSale(saleData, deliveryInfo);
        setSaleCompleted(completedSale);
        dispatch({ type: 'CLEAR_CART' });
        refetchProducts(); // Atualiza a lista de produtos para refletir o novo estoque
        // Reset delivery state
        setIsDelivery(false);
        setDeliveryAddress('');
        setCustomerName('');
    } catch (error) {
        console.error("Erro ao processar venda:", error);
        alert("Falha ao processar a venda.");
    } finally {
        setIsProcessing(false);
        setPaymentModalOpen(false);
    }
  };
  
  const handlePrintReceipt = () => {
      const receiptContent = receiptRef.current?.innerHTML;
      if (receiptContent) {
        const printWindow = window.open('', '_blank');
        printWindow?.document.write(`
            <html>
                <head>
                    <title>NFC-e</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body class="font-mono text-xs">${receiptContent}</body>
            </html>
        `);
        printWindow?.document.close();
        printWindow?.print();
      }
  };

  const formatAccessKey = (key: string | undefined) => {
    return key?.match(/.{1,4}/g)?.join(' ') ?? '';
  };

  return (
    <div className="flex flex-col lg:flex-row h-full max-h-[calc(100vh-4rem)] gap-6">
      {/* Product List */}
      <div className="flex-1 lg:w-3/5 flex flex-col bg-surface-card rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <div className="relative">
            <Input 
                type="text" 
                placeholder="Buscar por nome ou código de barras..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
          </div>
        </div>
        <div className="overflow-y-auto p-4">
          {loading ? (
             <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} onClick={() => dispatch({ type: 'ADD_ITEM', payload: product })}
                  className="border rounded-lg p-2 text-center cursor-pointer hover:shadow-md hover:border-brand-primary transition-all duration-200 flex flex-col justify-between">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-24 object-cover rounded-md mb-2" />
                  <p className="text-sm font-semibold text-text-primary flex-grow">{product.name}</p>
                  <p className="text-lg font-bold text-brand-light">{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="lg:w-2/5 flex flex-col bg-surface-card rounded-lg shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-text-primary flex items-center"><ShoppingCartIcon className="mr-2"/> Carrinho</h2>
            <Button variant="danger" size="sm" onClick={() => dispatch({ type: 'CLEAR_CART' })} disabled={cart.length === 0}><Trash2Icon className="h-4 w-4"/></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-center text-text-muted mt-8">O carrinho está vazio.</p>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-text-primary">{item.productName}</p>
                  <p className="text-sm text-text-muted">{item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => dispatch({ type: 'UPDATE_QUANTITY', payload: { productId: item.productId, quantity: item.quantity - 1 } })}>
                    <MinusCircleIcon className="h-5 w-5 text-red-500" />
                  </button>
                  <span className="font-bold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => dispatch({ type: 'UPDATE_QUANTITY', payload: { productId: item.productId, quantity: item.quantity + 1 } })}>
                    <PlusCircleIcon className="h-5 w-5 text-green-500" />
                  </button>
                </div>
                <p className="font-bold w-20 text-right">{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t mt-auto">
          <div className="flex justify-between items-center text-2xl font-bold mb-4">
            <span className="text-text-primary">Total:</span>
            <span className="text-brand-primary">{cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
          <Button onClick={() => setPaymentModalOpen(true)} disabled={cart.length === 0} className="w-full">
            Finalizar Venda
          </Button>
        </div>
      </div>
      
      {/* Payment Modal */}
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

            <div className="mt-6 pt-4 border-t">
                 <div className="flex items-center mb-4">
                    <input type="checkbox" id="delivery" checked={isDelivery} onChange={e => setIsDelivery(e.target.checked)} className="h-4 w-4 text-brand-primary focus:ring-brand-light border-gray-300 rounded" />
                    <label htmlFor="delivery" className="ml-2 block text-sm font-medium text-text-primary">Marcar como entrega</label>
                </div>
                {isDelivery && (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <Input label="Nome do Cliente (Opcional)" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome para identificação"/>
                        <Input label="Endereço de Entrega" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Rua, Número, Bairro, Cidade" required={isDelivery}/>
                    </div>
                )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleFinalizeSale} isLoading={isProcessing}>Confirmar Pagamento</Button>
            </div>
        </div>
       </Modal>

        {/* NFC-e Receipt Modal */}
       <Modal isOpen={!!saleCompleted} onClose={() => setSaleCompleted(null)} title="NFC-e - Nota Fiscal de Consumidor Eletrônica">
        <div>
            <div ref={receiptRef} className="max-w-md mx-auto border-2 border-dashed border-gray-400 p-4 bg-white text-black">
              <div className="text-center">
                <h1 className="font-bold text-lg">{settings?.companyName}</h1>
                <p>CNPJ: {settings?.cnpj}</p>
                <p>{settings?.address}</p>
                <hr className="my-2 border-dashed border-gray-400"/>
                <h2 className="font-bold">DANFE NFC-e</h2>
                <h3 className="font-bold text-[10px]">Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</h3>
                <p className="text-[10px]">Não permite aproveitamento de crédito de ICMS</p>
                <hr className="my-2 border-dashed border-gray-400"/>
              </div>
              <div>
                <p className="font-bold"># COD DESC QTD UN VL.UNIT VL.TOTAL</p>
                {saleCompleted?.items.map((item, index) => (
                  <div key={item.productId} className="grid grid-cols-12 gap-1 text-[10px] leading-tight my-1">
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
              <div className="flex justify-between font-bold text-lg">
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
                  <p className="text-[10px]">https://www.sefaz.rs.gov.br/nfce/consulta</p>
              </div>
              <p className="text-center text-[10px] break-all font-mono font-bold">{formatAccessKey(saleCompleted?.nfceAccessKey)}</p>
              <hr className="my-2 border-dashed border-gray-400"/>
              <p className="text-center text-[10px]">Protocolo de autorização: 123456789012345</p>
              <p className="text-center text-[10px]">Data: {saleCompleted ? new Date(saleCompleted.date).toLocaleString('pt-BR') : ''}</p>
            </div>
            <div className="mt-6 flex justify-end gap-3 no-print">
                <Button variant="secondary" onClick={() => setSaleCompleted(null)}>Fechar</Button>
                <Button onClick={handlePrintReceipt}><PrinterIcon className="h-4 w-4 mr-2"/>Imprimir</Button>
            </div>
        </div>
       </Modal>
    </div>
  );
};

export default POS;
