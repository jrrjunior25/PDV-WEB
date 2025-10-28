import React, { useState } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { Supplier } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import { useAuth } from '../auth/AuthContext';
import { PlusIcon, EditIcon } from './icons/Icon';

const Suppliers: React.FC = () => {
  const { data: suppliers, loading, refetch } = useMockApi<Supplier[]>(api.getSuppliers);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';

  const openModal = (supplier: Partial<Supplier> | null = null) => {
    setEditingSupplier(supplier ? { ...supplier } : { name: '', cnpj: '', contactPerson: '', phone: '', email: '' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSupplier(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingSupplier) return;
    const { name, value } = e.target;
    setEditingSupplier({ ...editingSupplier, [name]: value });
  };

  const handleSave = async () => {
    if (!editingSupplier) return;
    await api.saveSupplier(editingSupplier as Supplier);
    refetch();
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Fornecedores</h1>
        {isAdmin && (
          <Button onClick={() => openModal()}><PlusIcon className="h-5 w-5 mr-2"/>Adicionar Fornecedor</Button>
        )}
      </div>
      
      <div className="bg-surface-card rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-secondary">
            <thead className="text-xs text-text-muted uppercase bg-surface-main">
              <tr>
                <th scope="col" className="px-6 py-3">Nome</th>
                <th scope="col" className="px-6 py-3">CNPJ</th>
                <th scope="col" className="px-6 py-3">Contato</th>
                <th scope="col" className="px-6 py-3">Telefone</th>
                {isAdmin && <th scope="col" className="px-6 py-3 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 5 : 4} className="text-center py-8">Carregando...</td></tr>
              ) : (
                suppliers?.map(supplier => (
                  <tr key={supplier.id} className="bg-surface-card border-b hover:bg-surface-main/50">
                    <td className="px-6 py-4 font-medium text-text-primary">{supplier.name}</td>
                    <td className="px-6 py-4">{supplier.cnpj}</td>
                    <td className="px-6 py-4">{supplier.contactPerson}</td>
                    <td className="px-6 py-4">{supplier.phone}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openModal(supplier)}>
                          <EditIcon className="h-4 w-4"/>
                        </Button>
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
        <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSupplier?.id ? 'Editar Fornecedor' : 'Adicionar Fornecedor'}>
          <div className="space-y-4">
            <Input name="name" label="Nome do Fornecedor" value={editingSupplier?.name || ''} onChange={handleInputChange} />
            <Input name="cnpj" label="CNPJ" value={editingSupplier?.cnpj || ''} onChange={handleInputChange} />
            <Input name="contactPerson" label="Pessoa de Contato" value={editingSupplier?.contactPerson || ''} onChange={handleInputChange} />
            <Input name="phone" label="Telefone" value={editingSupplier?.phone || ''} onChange={handleInputChange} />
            <Input name="email" label="Email" type="email" value={editingSupplier?.email || ''} onChange={handleInputChange} />
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

export default Suppliers;
