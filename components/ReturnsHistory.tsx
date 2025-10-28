import React, { useState } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { Return } from '../types';
import { ChevronDownIcon, ChevronUpIcon } from './icons/Icon';

const ReturnsHistory: React.FC = () => {
  const { data: returns, loading } = useMockApi<Return[]>(api.getReturns);
  const [expandedReturnId, setExpandedReturnId] = useState<string | null>(null);

  const toggleReturnDetails = (returnId: string) => {
    setExpandedReturnId(expandedReturnId === returnId ? null : returnId);
  };
  
  const outcomeStyles = {
    'Refund': 'bg-blue-100 text-blue-800',
    'Store Credit': 'bg-green-100 text-green-800'
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Histórico de Devoluções</h1>
      
      <div className="bg-surface-card rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-secondary">
            <thead className="text-xs text-text-muted uppercase bg-surface-main">
              <tr>
                <th scope="col" className="px-6 py-3">ID Devolução</th>
                <th scope="col" className="px-6 py-3">ID Venda Original</th>
                <th scope="col" className="px-6 py-3">Data</th>
                <th scope="col" className="px-6 py-3">Valor Devolvido</th>
                <th scope="col" className="px-6 py-3">Resultado</th>
                <th scope="col" className="px-6 py-3">Operador</th>
                <th scope="col" className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Carregando devoluções...</td></tr>
              ) : (
                returns?.map(ret => (
                  <React.Fragment key={ret.id}>
                    <tr className="bg-surface-card border-b hover:bg-surface-main/50 cursor-pointer" onClick={() => toggleReturnDetails(ret.id)}>
                      <td className="px-6 py-4 font-mono text-xs font-medium text-text-primary">{ret.id}</td>
                      <td className="px-6 py-4 font-mono text-xs">{ret.saleId}</td>
                      <td className="px-6 py-4">{new Date(ret.date).toLocaleString('pt-BR')}</td>
                      <td className="px-6 py-4 font-semibold">{ret.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                       <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${outcomeStyles[ret.outcome]}`}>
                            {ret.outcome === 'Refund' ? 'Reembolso' : 'Vale-Crédito'}
                          </span>
                       </td>
                      <td className="px-6 py-4">{ret.operatorName}</td>
                      <td className="px-6 py-4 text-right">
                        {expandedReturnId === ret.id ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                      </td>
                    </tr>
                    {expandedReturnId === ret.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="p-4">
                          <div className="p-4 bg-white rounded-md shadow-inner grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-bold mb-2">Itens Devolvidos</h4>
                                <ul>
                                {ret.items.map(item => (
                                    <li key={item.productId} className="flex justify-between text-xs py-1 border-b">
                                    <span>{item.productName}</span>
                                    <span>{item.quantity} x {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    <span className="font-semibold">{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </li>
                                ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold mb-2">Motivo</h4>
                                <p className="text-xs p-2 bg-gray-100 rounded min-h-[40px]">{ret.reason}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
               {returns?.length === 0 && !loading && (
                    <tr><td colSpan={7} className="text-center py-8 text-text-muted">Nenhuma devolução registrada.</td></tr>
               )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReturnsHistory;