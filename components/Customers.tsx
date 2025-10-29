import { useState, useMemo } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { Customer, Sale, StoreCredit } from '../types';
import Button from './ui/Button';
import { PlusIcon, TicketIcon } from './icons/Icon';
import Modal from './ui/Modal';
import ErrorDisplay from './ui/ErrorDisplay';
import { useAuth } from '../auth/AuthContext';

interface CustomerDetailModalProps {
  customer: Customer;
  sales: Sale[];
  storeCredits: StoreCredit[];
  isOpen: boolean;
  onClose: () => void;
}

const CustomerDetailModal = ({ customer, sales, storeCredits, isOpen, onClose }: CustomerDetailModalProps) => {
    // FIX: Made the component more robust by safely handling potentially null props,
    // preventing crashes from race conditions during data loading.
    const customerSales = useMemo(() => (sales || []).filter(s => s.customerId === customer.id), [sales, customer.id]);
    const customerCredits = useMemo(() => (storeCredits || []).filter(c => c.customerId === customer.id && c.status === 'Active'), [storeCredits, customer.id]);
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes de ${customer.name}`}>
            <div className="space-y-6">
                <div>
                    <h4 className="font-semibold text-text-primary">Informações de Contato</h4>
                    <p className="text-sm"><strong>CPF/CNPJ:</strong> {customer.cpfCnpj}</p>
                    <p className="text-sm"><strong>Email:</strong> {customer.email}</p>
                    <p className="text-sm"><strong>Telefone:</strong> {customer.phone}</p>
                    <p className="text-sm"><strong>Endereço:</strong> {customer.address || 'Não cadastrado'}</p>
                </div>
                {customerCredits.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2 flex items-center"><TicketIcon className="h-5 w-5 mr-2"/> Vales-Crédito Disponíveis</h4>
                        <ul className="space-y-1">
                            {customerCredits.map(credit => (
                                <li key={credit.id} className="flex justify-between text-sm text-green-700">
                                    <span>Crédito de {new Date(credit.createdAt).toLocaleDateString('pt-BR')}</span>
                                    <span className="font-bold">{credit.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div>
                    <h4 className="font-semibold text-text-primary">Histórico de Compras</h4>
                    <div className="max-h-60 overflow-y-auto mt-2 border rounded-md">
                         {customerSales.length > 0 ? (
                            <ul className="divide-y">
                                {customerSales.map(sale => (
                                    <li key={sale.id} className="p-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Venda de {new Date(sale.date).toLocaleString('pt-BR')}</span>
                                            <span className="font-semibold">{sale.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                         ) : <p className="p-4 text-sm text-center text-text-muted">Nenhuma compra registrada.</p>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const Customers = () => {
  const { user } = useAuth();
  const { data: customers, loading: loadingCustomers, error: customersError, refetch: refetchCustomers } = useMockApi<Customer[]>(api.getCustomers);
  const { data: sales, loading: loadingSales, error: salesError, refetch: refetchSales } = useMockApi<Sale[]>(api.getSales);
  const { data: storeCredits, loading: loadingCredits, error: creditsError, refetch: refetchCredits } = useMockApi<StoreCredit[]>(api.getStoreCredits);
  
  const loading = loadingCustomers || loadingSales || loadingCredits;
  const error = customersError || salesError || creditsError;
  const refetchAll = () => {
    refetchCustomers();
    refetchSales();
    refetchCredits();
  };

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const renderTableContent = () => {
    if (loading) {
      return <tr><td colSpan={4} className="text-center py-8">Carregando clientes...</td></tr>;
    }
    if (error) {
      return <tr><td colSpan={4} className="p-4"><ErrorDisplay message={`Não foi possível carregar os dados dos clientes. ${error.message}`} onRetry={refetchAll} /></td></tr>;
    }
    return customers?.filter(c => c.name !== 'Consumidor Final').map(customer => (
      <tr key={customer.id} className="bg-surface-card border-b hover:bg-surface-main/50 cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
          <td className="px-6 py-4 font-medium text-text-primary">{customer.name}</td>
          <td className="px-6 py-4">{customer.cpfCnpj}</td>
          <td className="px-6 py-4">{customer.email}</td>
          <td className="px-6 py-4">{customer.phone}</td>
      </tr>
    ));
  }

  return (
    <>
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-text-primary">Clientes</h1>
            {user?.role !== 'caixa' && (
              <Button onClick={() => alert('Funcionalidade de adicionar cliente a ser implementada.')}>
                  <PlusIcon className="h-5 w-5 mr-2"/> Adicionar Cliente
              </Button>
            )}
        </div>
      
        <div className="bg-surface-card rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-text-secondary">
                    <thead className="text-xs text-text-muted uppercase bg-surface-main">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nome</th>
                            <th scope="col" className="px-6 py-3">CPF/CNPJ</th>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">Telefone</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderTableContent()}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    {selectedCustomer && sales && storeCredits && (
        <CustomerDetailModal 
            customer={selectedCustomer}
            sales={sales}
            storeCredits={storeCredits}
            isOpen={!!selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
        />
    )}
    </>
  );
};

export default Customers;