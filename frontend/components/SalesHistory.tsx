import { useState, useMemo, Fragment } from 'react';
import { api } from '../../backend/api';
import { useMockApi } from '../hooks/useMockApi';
import { Sale, ReturnItem, User } from '../../shared/types';
import { ChevronDownIcon, ChevronUpIcon, Undo2Icon, DownloadIcon } from './icons/Icon';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import ErrorDisplay from './ui/ErrorDisplay';
import { useAuth } from '../auth/AuthContext';

const statusStyles: { [key in Sale['status']]: string } = {
  Completed: 'bg-green-100 text-green-800',
  'Partially Returned': 'bg-yellow-100 text-yellow-800',
  'Fully Returned': 'bg-gray-100 text-gray-800',
  'Pending Payment': 'bg-blue-100 text-blue-800'
};

interface ReturnModalProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
  onReturnProcessed: () => void;
  user: User | null;
}

const ReturnModal = ({ sale, isOpen, onClose, onReturnProcessed, user }: ReturnModalProps) => {
  const [itemsToReturn, setItemsToReturn] = useState<{ [productId: string]: number }>({});
  const [reason, setReason] = useState('');
  const [outcome, setOutcome] = useState<'Refund' | 'Store Credit'>('Store Credit');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuantityChange = (productId: string, quantity: number, maxQuantity: number) => {
    const newQuantity = Math.max(0, Math.min(quantity, maxQuantity));
    setItemsToReturn(prev => ({ ...prev, [productId]: newQuantity }));
  };

  const totalReturnValue = useMemo(() => {
    return sale.items.reduce((total, item) => {
      const quantityToReturn = itemsToReturn[item.productId] || 0;
      return total + (quantityToReturn * item.unitPrice);
    }, 0);
  }, [itemsToReturn, sale.items]);

  const handleSubmitReturn = async () => {
    const returnItemsList: ReturnItem[] = Object.entries(itemsToReturn)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const originalItem = sale.items.find(i => i.productId === productId)!;
        return {
          productId,
          productName: originalItem.productName,
          quantity,
          unitPrice: originalItem.unitPrice,
          totalPrice: quantity * originalItem.unitPrice,
        };
      });

    if (returnItemsList.length === 0) {
      alert("Selecione ao menos um item para devolver.");
      return;
    }
    if (!reason) {
      alert("Por favor, informe o motivo da devolução.");
      return;
    }
    if (outcome === 'Store Credit' && !sale.customerId) {
      alert("Não é possível gerar vale-crédito para 'Consumidor Final'. Identifique o cliente na venda ou processe como Reembolso.");
      return;
    }

    setIsProcessing(true);
    try {
      await api.processReturn(sale.id, returnItemsList, reason, outcome, user?.name || 'N/A');
      alert(`Devolução processada com sucesso como ${outcome === 'Refund' ? 'Reembolso' : 'Vale-Crédito'}!`);
      onReturnProcessed();
      onClose();
    } catch (error: any) {
      alert(`Erro ao processar devolução: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Devolução da Venda #${sale.id.substring(0, 8)}`}>
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-text-primary mb-2">Selecione os itens para devolver:</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {sale.items.filter(item => item.returnableQuantity > 0).map(item => (
              <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <span className="text-sm">{item.productName}</span>
                <div className="flex items-center gap-2">
                  <Input type="number" className="w-20 text-center"
                    value={String(itemsToReturn[item.productId] || 0)}
                    onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 0, item.returnableQuantity)}
                    max={item.returnableQuantity} min={0}
                  />
                  <span className="text-xs text-text-muted">/ {item.returnableQuantity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Input label="Motivo da Devolução" value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Produto com defeito" />
        <div>
          <h4 className="font-semibold text-text-primary mb-2">Ação a ser tomada:</h4>
          <div className="grid grid-cols-2 gap-2">
             <button onClick={() => setOutcome('Store Credit')} className={`p-3 border rounded-lg text-center font-semibold transition-colors ${outcome === 'Store Credit' ? 'bg-brand-primary text-white border-brand-primary' : 'hover:border-brand-light'}`}>
                Gerar Vale-Crédito
            </button>
             <button onClick={() => setOutcome('Refund')} className={`p-3 border rounded-lg text-center font-semibold transition-colors ${outcome === 'Refund' ? 'bg-brand-primary text-white border-brand-primary' : 'hover:border-brand-light'}`}>
                Reembolsar (Estorno)
            </button>
          </div>
        </div>
        <div className="pt-4 border-t text-right">
            <p className="text-lg font-bold">Total a devolver: {totalReturnValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmitReturn} isLoading={isProcessing}>Confirmar Devolução</Button>
        </div>
      </div>
    </Modal>
  );
};

const SalesHistory = () => {
  const { data: sales, loading, error, refetch } = useMockApi<Sale[]>(api.getSales);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const { user } = useAuth();
  const canReturn = user?.role === 'administrador' || user?.role === 'vendedor';

  const toggleSaleDetails = (saleId: string) => {
    setExpandedSaleId(expandedSaleId === saleId ? null : saleId);
  };
  
  const openReturnModal = (sale: Sale) => {
    setSelectedSale(sale);
    setReturnModalOpen(true);
  };
  
  const handleExportCSV = () => {
    if (!sales || sales.length === 0) {
        alert("Não há dados de vendas para exportar.");
        return;
    }

    const escapeCell = (cell: string | number | undefined): string => {
        const str = String(cell ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };
    
    const headers = [
        'ID da Venda', 'Data', 'Cliente', 'Total (R$)', 'Status', 'Método de Pagamento', 'Itens'
    ];
    
    const rows = sales.map(sale => {
        const itemsString = sale.items
            .map(item => `${item.productName} (Qtd: ${item.quantity}, Preço Un: ${item.unitPrice.toFixed(2)})`)
            .join('; ');

        return [
            sale.id,
            new Date(sale.date).toLocaleString('pt-BR'),
            sale.customerName || 'N/A',
            sale.totalAmount.toFixed(2),
            sale.status,
            sale.paymentMethod,
            itemsString
        ].map(escapeCell).join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'historico_vendas.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };
  
  const renderTableContent = () => {
    if (loading) {
      return <tr><td colSpan={canReturn ? 6 : 5} className="text-center py-8">Carregando histórico...</td></tr>;
    }
    if (error) {
      return <tr><td colSpan={canReturn ? 6 : 5} className="p-4"><ErrorDisplay message={error.message} onRetry={refetch} /></td></tr>;
    }
    return sales?.map(sale => {
      const isReturnable = sale.items.some(i => i.returnableQuantity > 0);
      return (
      <Fragment key={sale.id}>
        <tr className="bg-surface-card border-b hover:bg-surface-main/50">
          <td className="px-6 py-4 font-mono text-xs font-medium text-text-primary cursor-pointer" onClick={() => toggleSaleDetails(sale.id)}>{sale.id}</td>
          <td className="px-6 py-4 cursor-pointer" onClick={() => toggleSaleDetails(sale.id)}>{new Date(sale.date).toLocaleString('pt-BR')}</td>
          <td className="px-6 py-4 cursor-pointer" onClick={() => toggleSaleDetails(sale.id)}>{sale.customerName || 'N/A'}</td>
          <td className="px-6 py-4 font-semibold cursor-pointer" onClick={() => toggleSaleDetails(sale.id)}>{sale.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
          <td className="px-6 py-4 cursor-pointer" onClick={() => toggleSaleDetails(sale.id)}>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[sale.status]}`}>{sale.status}</span>
          </td>
          {canReturn && (
            <td className="px-6 py-4 text-right">
              {isReturnable ? (
                <Button variant="secondary" size="sm" onClick={() => openReturnModal(sale)}><Undo2Icon className="h-4 w-4 mr-1"/> Devolver/Trocar</Button>
              ) : (
                <ChevronDownIcon className="h-5 w-5 inline-block cursor-pointer" onClick={() => toggleSaleDetails(sale.id)} />
              )}
            </td>
          )}
        </tr>
        {expandedSaleId === sale.id && (
          <tr className="bg-gray-50">
            <td colSpan={canReturn ? 6 : 5} className="p-4">
              <div className="p-4 bg-white rounded-md shadow-inner">
                <h4 className="font-bold mb-2">Detalhes da Venda</h4>
                <ul>
                  {sale.items.map(item => (
                    <li key={item.productId} className="flex justify-between text-xs py-1 border-b">
                      <span>{item.productName}</span>
                      <span>{item.quantity} x {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      <span className="font-semibold">{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 text-xs text-right">
                  {sale.storeCreditAmountUsed && sale.storeCreditAmountUsed > 0 && (
                    <p>Pago com Vale-Crédito: <span className="font-semibold">{sale.storeCreditAmountUsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                  )}
                  <p>Pago com {sale.paymentMethod}: <span className="font-semibold">{(sale.totalAmount - (sale.storeCreditAmountUsed || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                  <p className="font-bold text-sm mt-1">Total: <span className="font-bold">{sale.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                </div>
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    )});
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-text-primary">Histórico de Vendas</h1>
            <Button onClick={handleExportCSV} variant="secondary">
                <DownloadIcon className="h-5 w-5 mr-2"/>
                Exportar CSV
            </Button>
        </div>
        
        <div className="bg-surface-card rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-text-secondary">
              <thead className="text-xs text-text-muted uppercase bg-surface-main">
                <tr>
                  <th scope="col" className="px-6 py-3">ID da Venda</th>
                  <th scope="col" className="px-6 py-3">Data</th>
                  <th scope="col" className="px-6 py-3">Cliente</th>
                  <th scope="col" className="px-6 py-3">Total</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  {canReturn && <th scope="col" className="px-6 py-3 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {renderTableContent()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selectedSale && canReturn && (
        <ReturnModal 
          isOpen={returnModalOpen}
          onClose={() => setReturnModalOpen(false)}
          sale={selectedSale}
          user={user}
          onReturnProcessed={refetch}
        />
      )}
    </>
  );
};

export default SalesHistory;