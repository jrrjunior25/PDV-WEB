
import React from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { Customer } from '../types';
import Button from './ui/Button';
import { PlusIcon } from './icons/Icon';

const Customers: React.FC = () => {
  const { data: customers, loading } = useMockApi<Customer[]>(api.getCustomers);

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-text-primary">Clientes</h1>
            <Button onClick={() => alert('Funcionalidade de adicionar cliente a ser implementada.')}>
                <PlusIcon className="h-5 w-5 mr-2"/> Adicionar Cliente
            </Button>
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
                        {loading ? (
                            <tr><td colSpan={4} className="text-center py-8">Carregando clientes...</td></tr>
                        ) : (
                            customers?.map(customer => (
                                <tr key={customer.id} className="bg-surface-card border-b hover:bg-surface-main/50">
                                    <td className="px-6 py-4 font-medium text-text-primary">{customer.name}</td>
                                    <td className="px-6 py-4">{customer.cpfCnpj}</td>
                                    <td className="px-6 py-4">{customer.email}</td>
                                    <td className="px-6 py-4">{customer.phone}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default Customers;
