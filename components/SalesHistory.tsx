
import React, { useState } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { Sale } from '../types';
import { ChevronDownIcon, ChevronUpIcon } from './icons/Icon';

const SalesHistory: React.FC = () => {
  const { data: sales, loading } = useMockApi<Sale[]>(api.getSales);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const toggleSaleDetails = (saleId: string) => {
    setExpandedSaleId(expandedSaleId === saleId ? null : saleId);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Histórico de Vendas</h1>
      
      <div className="bg-surface-card rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-secondary">
            <thead className="text-xs text-text-muted uppercase bg-surface-main">
              <tr>
                <th scope="col" className="px-6 py-3">ID da Venda</th>
                <th scope="col" className="px-6 py-3">Data</th>
                <th scope="col" className="px-6 py-3">Cliente</th>
                <th scope="col" className="px-6 py-3">Total</th>
                <th scope="col" className="px-6 py-3">Pagamento</th>
                <th scope="col" className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">Carregando histórico...</td></tr>
              ) : (
                sales?.map(sale => (
                  <React.Fragment key={sale.id}>
                    <tr className="bg-surface-card border-b hover:bg-surface-main/50 cursor-pointer" onClick={() => toggleSaleDetails(sale.id)}>
                      <td className="px-6 py-4 font-mono text-xs font-medium text-text-primary">{sale.id}</td>
                      <td className="px-6 py-4">{new Date(sale.date).toLocaleString('pt-BR')}</td>
                      <td className="px-6 py-4">{sale.customerName || 'N/A'}</td>
                      <td className="px-6 py-4 font-semibold">{sale.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-6 py-4">{sale.paymentMethod}</td>
                      <td className="px-6 py-4 text-right">
                        {expandedSaleId === sale.id ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                      </td>
                    </tr>
                    {expandedSaleId === sale.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="p-4">
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
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesHistory;
