import { useState, useMemo } from 'react';
import { api } from '../../backend/api';
import { Customer, Sale, StoreCredit } from '../../shared/types';
import Button from './ui/Button';
import { PlusIcon, TicketIcon, EditIcon } from './icons/Icon';
import Modal from './ui/Modal';
import ErrorDisplay from './ui/ErrorDisplay';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNotifications } from '../contexts/NotificationContext';
import Input from './ui/Input';
import SkeletonLoader from './ui/SkeletonLoader';

// The Detail Modal remains the same
interface CustomerDetailModalProps {
  customer: Customer;
  sales: Sale[] | null; // Can be null during loading
  storeCredits: StoreCredit[] | null; // Can be null during loading
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
  const { addNotification } = useNotifications();
  const { data, loading, error, refetchAll } = useData();
  const { customers, sales, storeCredits } = data;
  
  const isAdmin = user?.role === 'administrador' || user?.role === 'vendedor';

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openModal = (customer: Partial<Customer> | null = null) => {
    setEditingCustomer(customer ? { ...customer } : { name: '', cpfCnpj: '', email: '', phone: '', address: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingCustomer) return;
    const { name, value } = e.target;
    setEditingCustomer({ ...editingCustomer, [name]: value });
  };

  const handleSave = async () => {
    if (!editingCustomer || !editingCustomer.name) {
      addNotification('O nome do cliente é obrigatório.', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      await api.saveCustomer(editingCustomer as Customer);
      addNotification('Cliente salvo com sucesso!', 'success');
      refetchAll();
      closeModal();
    } catch (e: any) {
      addNotification(`Erro ao salvar cliente: ${e.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTableContent = () => {
    if (loading) {
      return Array.from({ length: 4 }).map((_, index) => (
        <tr key={index} className="bg-surface-card border-b">
          <td className="px-6 py-4"><SkeletonLoader className="h-5 w-3/4" /></td>
          <td className="px-6 py-4"><SkeletonLoader className="h-5 w-1/2" /></td>
          <td className="px-6 py-4"><SkeletonLoader className="h-5 w-3/4" /></td>
          <td className="px-6 py-4"><SkeletonLoader className="h-5 w-1/2" /></td>
          {isAdmin && <td className="px-6 py-4 text-right"><SkeletonLoader className="h-8 w-8 rounded-md" /></td>}
        </tr>
      ));
    }
    if (error) {
      return <tr><td colSpan={isAdmin ? 5 : 4} className="p-4"><ErrorDisplay message={`Não foi possível carregar os dados dos clientes. ${error}`} onRetry={refetchAll} /></td></tr>;
    }
    return customers?.filter(c => c.name !== 'Consumidor Final').map(customer => (
      <tr key={customer.id} className="bg-surface-card border-b hover:bg-surface-main/50">
          <td className="px-6 py-4 font-medium text-text-primary cursor-pointer" onClick={() => setSelectedCustomer(customer)}>{customer.name}</td>
          <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedCustomer(customer)}>{customer.cpfCnpj}</td>
          <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedCustomer(customer)}>{customer.email}</td>
          <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedCustomer(customer)}>{customer.phone}</td>
          {isAdmin && (
            <td className="px-6 py-4 text-right">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openModal(customer); }}>
                <EditIcon className="h-4 w-4"/>
              </Button>
            </td>
          )}
      </tr>
    ));
  }

  return (
    <>
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-text-primary">Clientes</h1>
            {isAdmin && (
              <Button onClick={() => openModal()}>
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
                            {isAdmin && <th scope="col" className="px-6 py-3 text-right">Ações</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {renderTableContent()}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    {selectedCustomer && (
        <CustomerDetailModal 
            customer={selectedCustomer}
            sales={sales}
            storeCredits={storeCredits}
            isOpen={!!selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
        />
    )}
     {isAdmin && isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCustomer?.id ? 'Editar Cliente' : 'Adicionar Cliente'}>
            <div className="space-y-4">
                <Input name="name" label="Nome Completo" value={editingCustomer?.name || ''} onChange={handleInputChange} required autoFocus/>
                <Input name="cpfCnpj" label="CPF/CNPJ" value={editingCustomer?.cpfCnpj || ''} onChange={handleInputChange} />
                <Input name="email" label="Email" type="email" value={editingCustomer?.email || ''} onChange={handleInputChange} />
                <Input name="phone" label="Telefone" value={editingCustomer?.phone || ''} onChange={handleInputChange} />
                <Input name="address" label="Endereço" value={editingCustomer?.address || ''} onChange={handleInputChange} />
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
                    <Button onClick={handleSave} isLoading={isSaving}>Salvar</Button>
                </div>
            </div>
        </Modal>
    )}
    </>
  );
};

export default Customers;