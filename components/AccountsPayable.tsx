import React, { useState } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { AccountPayable, Supplier } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import { useAuth } from '../auth/AuthContext';
import { PlusIcon } from './icons/Icon';

const AccountsPayable: React.FC = () => {
  const { data: accounts, loading, refetch } = useMockApi<AccountPayable[]>(api.getAccountsPayable);
  const { data: suppliers } = useMockApi<Supplier[]>(api.getSuppliers);
  const [isModalOpen, setModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<Omit<AccountPayable, 'id' | 'supplierName'>>>({});
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';

  const openModal = () => {
    setNewAccount({ description: '', amount: 0, dueDate: '', supplierId: suppliers?.[0]?.id, status: 'Pendente' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setNewAccount({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAccount(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
  };

  const handleSave = async () => {
    if (!newAccount.supplierId || !newAccount.description || !newAccount.amount || !newAccount.dueDate) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }
    await api.saveAccountPayable(newAccount as any);
    refetch();
    closeModal();
  };
  
  const handleMarkAsPaid = async (id: string) => {
    await api.updateAccountPayableStatus(id, 'Paga');
    refetch();
  };
  
  const isOverdue = (dueDate: string, status: string) => {
    return status === 'Pendente' && new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Contas a Pagar</h1>
        {isAdmin && (
          <Button onClick={openModal}><PlusIcon className="h-5 w-5 mr-2"/>Adicionar Conta</Button>
        )}
      </div>
      
      <div className="bg-surface-card rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-secondary">
            <thead className="text-xs text-text-muted uppercase bg-surface-main">
              <tr>
                <th scope="col" className="px-6 py-3">Fornecedor</th>
                <th scope="col" className="px-6 py-3">Descrição</th>
                <th scope="col" className="px-6 py-3">Vencimento</th>
                <th scope="col" className="px-6 py-3">Valor</th>
                <th scope="col" className="px-6 py-3">Status</th>
                {isAdmin && <th scope="col" className="px-6 py-3 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 6 : 5} className="text-center py-8">Carregando...</td></tr>
              ) : (
                accounts?.map(account => (
                  <tr key={account.id} className={`border-b ${isOverdue(account.dueDate, account.status) ? 'bg-red-50' : 'bg-surface-card hover:bg-surface-main/50'}`}>
                    <td className="px-6 py-4 font-medium text-text-primary">{account.supplierName}</td>
                    <td className="px-6 py-4">{account.description}</td>
                    <td className={`px-6 py-4 ${isOverdue(account.dueDate, account.status) ? 'font-bold text-red-600' : ''}`}>
                        {new Date(account.dueDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 font-semibold">{account.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${account.status === 'Paga' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {account.status}
                        </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        {account.status === 'Pendente' && (
                          <Button variant="ghost" size="sm" onClick={() => handleMarkAsPaid(account.id)}>
                            Marcar como Paga
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={closeModal} title="Adicionar Conta a Pagar">
          <div className="space-y-4">
            <div>
                <label htmlFor="supplierId" className="block text-sm font-medium text-text-secondary mb-1">Fornecedor</label>
                <select id="supplierId" name="supplierId" value={newAccount.supplierId} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent transition bg-white">
                  {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <Input name="description" label="Descrição" value={newAccount.description || ''} onChange={handleInputChange} />
            <Input name="amount" label="Valor" type="number" value={String(newAccount.amount || '')} onChange={handleInputChange} />
            <Input name="dueDate" label="Data de Vencimento" type="date" value={newAccount.dueDate?.split('T')[0] || ''} onChange={handleInputChange} />
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AccountsPayable;