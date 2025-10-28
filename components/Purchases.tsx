import React, { useState, useMemo } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { PurchaseOrder, Supplier, Product, PurchaseOrderItem } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import { PlusIcon, SearchIcon, Trash2Icon } from './icons/Icon';

const statusStyles: { [key in PurchaseOrder['status']]: string } = {
  Pendente: 'bg-yellow-100 text-yellow-800',
  'Recebido Parcialmente': 'bg-blue-100 text-blue-800',
  Recebido: 'bg-green-100 text-green-800',
};

const PurchaseOrderModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: () => void; suppliers: Supplier[]; products: Product[]; }> = ({ isOpen, onClose, onSave, suppliers, products }) => {
    const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '');
    const [items, setItems] = useState<PurchaseOrderItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

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
        await api.savePurchaseOrder(newPO);
        onSave();
        onClose();
        setItems([]);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Novo Pedido de Compra">
            <div className="space-y-4">
                <div>
                    <label htmlFor="supplierId" className="block text-sm font-medium text-text-secondary mb-1">Fornecedor</label>
                    <select id="supplierId" value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                            <Input type="number" className="col-span-2" value={item.quantityOrdered} onChange={e => handleItemChange(item.productId, 'quantityOrdered', parseInt(e.target.value))} />
                            <Input type="number" className="col-span-2" value={item.costPrice} onChange={e => handleItemChange(item.productId, 'costPrice', parseFloat(e.target.value))} />
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

const ReceiveStockModal: React.FC<{ po: PurchaseOrder; isOpen: boolean; onClose: () => void; onSave: () => void; }> = ({ po, isOpen, onClose, onSave }) => {
    const [receivedItems, setReceivedItems] = useState<{ [productId: string]: number }>({});
    
    const handleQuantityChange = (productId: string, quantity: number, maxQuantity: number) => {
        setReceivedItems(prev => ({ ...prev, [productId]: Math.max(0, Math.min(quantity, maxQuantity)) }));
    };

    const handleReceive = async () => {
        if(Object.values(receivedItems).every(q => q === 0)) {
            alert("Informe a quantidade recebida para ao menos um item.");
            return;
        }
        await api.receiveStock(po.id, receivedItems);
        onSave();
        onClose();
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
                                    value={receivedItems[item.productId] || 0}
                                    onChange={e => handleQuantityChange(item.productId, parseInt(e.target.value), item.quantityOrdered - item.quantityReceived)}
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


const Purchases: React.FC = () => {
  const { data: purchaseOrders, loading, refetch } = useMockApi<PurchaseOrder[]>(api.getPurchaseOrders);
  const { data: suppliers } = useMockApi<Supplier[]>(api.getSuppliers);
  const { data: products } = useMockApi<Product[]>(api.getProducts);

  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);

  const handleOpenReceiveModal = (po: PurchaseOrder) => {
    setSelectedPo(po);
    setIsReceiveModalOpen(true);
  };
  
  const handleCloseReceiveModal = () => {
    setSelectedPo(null);
    setIsReceiveModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Pedidos de Compra</h1>
        <Button onClick={() => setIsPoModalOpen(true)}><PlusIcon className="h-5 w-5 mr-2"/>Novo Pedido</Button>
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
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8">Carregando...</td></tr>
              ) : (
                purchaseOrders?.map(po => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {suppliers && products && (
        <PurchaseOrderModal 
            isOpen={isPoModalOpen}
            onClose={() => setIsPoModalOpen(false)}
            onSave={refetch}
            suppliers={suppliers}
            products={products}
        />
      )}
      {selectedPo && (
        <ReceiveStockModal
            po={selectedPo}
            isOpen={isReceiveModalOpen}
            onClose={handleCloseReceiveModal}
            onSave={refetch}
        />
      )}
    </div>
  );
};

export default Purchases;
