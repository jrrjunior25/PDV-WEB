import React, { useState, useMemo, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { PurchaseOrder, Supplier, Product, PurchaseOrderItem } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import ErrorDisplay from './ui/ErrorDisplay';
import { PlusIcon, SearchIcon, Trash2Icon, UploadCloudIcon } from './icons/Icon';
import ImportXmlModal from './ImportXmlModal';

const statusStyles: { [key in PurchaseOrder['status']]: string } = {
  Pendente: 'bg-yellow-100 text-yellow-800',
  'Recebido Parcialmente': 'bg-blue-100 text-blue-800',
  Recebido: 'bg-green-100 text-green-800',
};

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  suppliers: Supplier[];
  products: Product[];
}

const PurchaseOrderModal = ({ isOpen, onClose, onSave, suppliers, products }: PurchaseOrderModalProps) => {
    const [supplierId, setSupplierId] = useState<string>('');
    const [items, setItems] = useState<PurchaseOrderItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Set default supplier when modal opens and suppliers are loaded
        if (isOpen && suppliers && suppliers.length > 0 && !supplierId) {
            setSupplierId(suppliers[0].id);
        }
        // Reset state when modal closes
        if (!isOpen) {
            setSupplierId('');
            setItems([]);
            setSearchTerm('');
        }
    }, [isOpen, suppliers, supplierId]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return [];
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !items.some(i => i.productId === p.id));
    }, [searchTerm, products, items]);

    const handleAddItem = (product: Product) => {
        setItems(prev => [...prev, {
            productId: product.id,
            productName: product.name,
            quantityOrdered: 1,
            quantityReceived: 0,
            costPrice: product.costPrice,
            totalCost: product.costPrice,
        }]);
        setSearchTerm('');
    };

    const handleItemChange = (productId: string, field: 'quantityOrdered' | 'costPrice', value: number) => {
        setItems(prev => prev.map(item => {
            if (item.productId === productId) {
                const newItem = { ...item, [field]: value };
                newItem.totalCost = newItem.quantityOrdered * newItem.costPrice;
                return newItem;
            }
            return item;
        }));
    };

    const handleRemoveItem = (productId: string) => {
        setItems(prev => prev.filter(item => item.productId !== productId));
    };

    const totalAmount = useMemo(() => items.reduce((acc, item) => acc + item.totalCost, 0), [items]);

    const handleSave = async () => {
        if (!supplierId || items.length === 0) {
            alert("Selecione um fornecedor e adicione ao menos um item.");
            return;
        }
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) return;

        const newPO = { supplierId, supplierName: supplier.name, items, totalAmount };
        try {
            await api.savePurchaseOrder(newPO);
            onSave();
            onClose();
            setItems([]);
        } catch (e: any) {
            alert(`Erro ao salvar pedido de compra: ${e.message}`);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Novo Pedido de Compra">
            <div className="space-y-4">
                <div>
                    <label htmlFor="supplierId" className="block text-sm font-medium text-text-secondary mb-1">Fornecedor</label>
                    <select id="supplierId" value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                        {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                
                <div className="relative">
                    <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar produto para adicionar..."/>
                    {filteredProducts.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                            {filteredProducts.map(p => <li key={p.id} onClick={() => handleAddItem(p)} className="p-2 hover:bg-gray-100 cursor-pointer">{p.name}</li>)}
                        </ul>
                    )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 border-t pt-4">
                    {items.map(item => (
                        <div key={item.productId} className="grid grid-cols-12 gap-2 items-center">
                            <span className="col-span-4 text-sm truncate">{item.productName}</span>
                            <Input type="number" className="col-span-2" value={String(item.quantityOrdered)} onChange={e => handleItemChange(item.productId, 'quantityOrdered', parseInt(e.target.value) || 0)} />
                            <Input type="number" className="col-span-2" value={String(item.costPrice)} onChange={e => handleItemChange(item.productId, 'costPrice', parseFloat(e.target.value) || 0)} />
                            <span className="col-span-3 text-right text-sm font-semibold">{item.totalCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                            <Button variant="danger" size="sm" className="col-span-1 p-1 h-7" onClick={() => handleRemoveItem(item.productId)}><Trash2Icon className="h-4 w-4"/></Button>
                        </div>
                    ))}
                </div>

                <div className="text-right font-bold text-lg pt-4 border-t">Total: {totalAmount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</div>
                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar Pedido</Button>
                </div>
            </div>
        </Modal>
    );
};

interface ReceiveStockModalProps {
  po: PurchaseOrder;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ReceiveStockModal = ({ po, isOpen, onClose, onSave }: ReceiveStockModalProps) => {
    const [receivedItems, setReceivedItems] = useState<{ [productId: string]: number }>({});
    
    const handleQuantityChange = (productId: string, quantity: number, maxQuantity: number) => {
        setReceivedItems(prev => ({ ...prev, [productId]: Math.max(0, Math.min(quantity, maxQuantity)) }));
    };

    const handleReceive = async () => {
        if(Object.values(receivedItems).every(q => q === 0)) {
            alert("Informe a quantidade recebida para ao menos um item.");
            return;
        }
        try {
            await api.receiveStock(po.id, receivedItems);
            onSave();
            onClose();
        } catch (e: any) {
            alert(`Erro ao receber estoque: ${e.message}`);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Receber Estoque - Pedido #${po.id.substring(0,8)}`}>
            <div className="space-y-4">
                <p className="text-sm">Confirme a quantidade recebida para cada item. O estoque será atualizado e uma conta a pagar será gerada automaticamente.</p>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {po.items.filter(i => i.quantityOrdered > i.quantityReceived).map(item => (
                        <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <span className="text-sm">{item.productName}</span>
                            <div className="flex items-center gap-2">
                                <Input type="number" className="w-20 text-center"
                                    value={String(receivedItems[item.productId] || 0)}
                                    onChange={e => handleQuantityChange(item.productId, parseInt(e.target.value) || 0, item.quantityOrdered - item.quantityReceived)}
                                />
                                <span className="text-xs text-text-muted">/ {item.quantityOrdered - item.quantityReceived} pendente</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleReceive}>Confirmar Recebimento</Button>
                </div>
            </div>
        </Modal>
    );
};


const Purchases = () => {
  const { data: purchaseOrders, loading: loadingPO, error: poError, refetch: refetchPO } = useMockApi<PurchaseOrder[]>(api.getPurchaseOrders);
  const { data: suppliers, loading: loadingSuppliers, error: suppliersError, refetch: refetchSuppliers } = useMockApi<Supplier[]>(api.getSuppliers);
  const { data: products, loading: loadingProducts, error: productsError, refetch: refetchProducts } = useMockApi<Product[]>(api.getProducts);

  const loading = loadingPO || loadingSuppliers || loadingProducts;
  const error = poError || suppliersError || productsError;
  const refetchAll = () => {
    refetchPO();
    refetchSuppliers();
    refetchProducts();
  };

  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [xmlData, setXmlData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const xmlString = e.target?.result as string;
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(xmlString, "application/xml");

              if (xmlDoc.querySelector("parsererror")) {
                  throw new Error("Arquivo XML inválido ou mal formatado.");
              }

              const getText = (selector: string, parent: Element | Document = xmlDoc) => parent.querySelector(selector)?.textContent || '';

              const emit = xmlDoc.querySelector('emit');
              if (!emit) throw new Error("Não foi possível encontrar os dados do emitente na NF-e.");
              
              const supplier = {
                  cnpj: getText('CNPJ', emit),
                  name: getText('xNome', emit),
              };

              const items: any[] = [];
              xmlDoc.querySelectorAll('det').forEach(det => {
                  const prod = det.querySelector('prod');
                  if (!prod) return;
                  // FIX: Safely parse numbers from XML to prevent NaN values, even if the content is non-numeric text.
                  const costPrice = parseFloat(getText('vUnCom', prod)) || 0;
                  const item = {
                      name: getText('xProd', prod),
                      quantity: parseFloat(getText('qCom', prod)) || 0,
                      costPrice: costPrice,
                      barcode: getText('cEAN', prod) || getText('cProd', prod),
                      ncm: getText('NCM', prod),
                      cfop: getText('CFOP', prod),
                      description: '',
                      price: costPrice * 1.5, // Sugere preço de venda com 50% de margem
                      stock: 0,
                      lowStockThreshold: 10,
                      categoryId: '',
                      imageUrl: `https://picsum.photos/seed/${getText('cProd', prod)}/400/400`,
                      origin: getText('orig', prod),
                      cest: getText('CEST', prod),
                  };
                  items.push(item);
              });

              if (items.length === 0) {
                throw new Error("Nenhum produto encontrado no arquivo XML.");
              }

              const totalAmount = parseFloat(getText('total > ICMSTot > vNF')) || 0;

              setXmlData({ supplier, items, totalAmount });
              setIsImportModalOpen(true);

          } catch (error: any) {
              alert(`Erro ao processar o arquivo XML: ${error.message}`);
          } finally {
            if(event.target) event.target.value = '';
          }
      };
      reader.readAsText(file);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleOpenReceiveModal = (po: PurchaseOrder) => {
    setSelectedPo(po);
    setIsReceiveModalOpen(true);
  };
  
  const handleCloseReceiveModal = () => {
    setSelectedPo(null);
    setIsReceiveModalOpen(false);
  }
  
  const renderTableContent = () => {
    if (loading) {
      return <tr><td colSpan={5} className="text-center py-8">Carregando...</td></tr>;
    }
    if (error) {
      return <tr><td colSpan={5} className="p-4"><ErrorDisplay message={`Não foi possível carregar os dados de compras. ${error.message}`} onRetry={refetchAll} /></td></tr>;
    }
    return purchaseOrders?.map(po => (
      <tr key={po.id} className="bg-surface-card border-b hover:bg-surface-main/50">
        <td className="px-6 py-4">{new Date(po.createdAt).toLocaleDateString('pt-BR')}</td>
        <td className="px-6 py-4 font-medium text-text-primary">{po.supplierName}</td>
        <td className="px-6 py-4 font-semibold">{po.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        <td className="px-6 py-4">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[po.status]}`}>
            {po.status}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          {po.status !== 'Recebido' && (
            <Button variant="secondary" size="sm" onClick={() => handleOpenReceiveModal(po)}>Receber Estoque</Button>
          )}
        </td>
      </tr>
    ));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Pedidos de Compra</h1>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={handleImportClick}><UploadCloudIcon className="h-5 w-5 mr-2"/>Importar XML da NF-e</Button>
            <Button onClick={() => setIsPoModalOpen(true)}><PlusIcon className="h-5 w-5 mr-2"/>Novo Pedido</Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xml" style={{ display: 'none' }} />
        </div>
      </div>

      <div className="bg-surface-card rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-secondary">
            <thead className="text-xs text-text-muted uppercase bg-surface-main">
              <tr>
                <th scope="col" className="px-6 py-3">Data</th>
                <th scope="col" className="px-6 py-3">Fornecedor</th>
                <th scope="col" className="px-6 py-3">Total</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {renderTableContent()}
            </tbody>
          </table>
        </div>
      </div>

      {suppliers && products && (
        <PurchaseOrderModal 
            isOpen={isPoModalOpen}
            onClose={() => setIsPoModalOpen(false)}
            onSave={refetchPO}
            suppliers={suppliers}
            products={products}
        />
      )}
      {selectedPo && (
        <ReceiveStockModal
            po={selectedPo}
            isOpen={isReceiveModalOpen}
            onClose={handleCloseReceiveModal}
            onSave={refetchPO}
        />
      )}
      {isImportModalOpen && xmlData && products && (
        <ImportXmlModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            xmlData={xmlData}
            allProducts={products}
            onImportSuccess={() => {
                refetchAll();
            }}
        />
      )}
    </div>
  );
};

export default Purchases;