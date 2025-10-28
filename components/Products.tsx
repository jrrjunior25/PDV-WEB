import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { Product } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import { generateProductDescription } from '../services/geminiService';
import { useAuth } from '../auth/AuthContext';
import { PlusIcon, EditIcon, SparklesIcon } from './icons/Icon';

const Products: React.FC = () => {
  const { data: products, loading, refetch } = useMockApi<Product[]>(api.getProducts);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';

  const openModal = (product: Partial<Product> | null = null) => {
    setEditingProduct(product ? { ...product } : {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      lowStockThreshold: 10,
      category: '',
      barcode: '',
      imageUrl: `https://picsum.photos/seed/${Date.now()}/400/400`,
      ncm: '',
      cest: '',
      cfop: '5102',
      origin: 'Nacional',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingProduct) return;
    const { name, value } = e.target;
    setEditingProduct({ ...editingProduct, [name]: name === 'price' || name === 'stock' || name === 'lowStockThreshold' ? parseFloat(value) : value });
  };
  
  const handleGenerateDescription = async () => {
    if (!editingProduct || !editingProduct.name || !editingProduct.category) {
        alert("Por favor, preencha o nome e a categoria do produto para gerar uma descrição.");
        return;
    }
    setIsGeneratingDesc(true);
    try {
        const description = await generateProductDescription(editingProduct.name, editingProduct.category);
        setEditingProduct({ ...editingProduct, description });
    } finally {
        setIsGeneratingDesc(false);
    }
  };

  const handleSave = async () => {
    if (!editingProduct) return;
    await api.saveProduct(editingProduct as Product);
    refetch();
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Gerenciamento de Produtos</h1>
        {isAdmin && (
          <Button onClick={() => openModal()}><PlusIcon className="h-5 w-5 mr-2"/>Adicionar Produto</Button>
        )}
      </div>
      
      <div className="bg-surface-card rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-text-secondary">
                <thead className="text-xs text-text-muted uppercase bg-surface-main">
                    <tr>
                        <th scope="col" className="px-6 py-3">Produto</th>
                        <th scope="col" className="px-6 py-3">Categoria</th>
                        <th scope="col" className="px-6 py-3">Preço</th>
                        <th scope="col" className="px-6 py-3">Estoque</th>
                        {isAdmin && <th scope="col" className="px-6 py-3 text-right">Ações</th>}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={isAdmin ? 5 : 4} className="text-center py-8">Carregando...</td></tr>
                    ) : (
                        products?.map(product => (
                            <tr key={product.id} className="bg-surface-card border-b hover:bg-surface-main/50">
                                <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap">{product.name}</td>
                                <td className="px-6 py-4">{product.category}</td>
                                <td className="px-6 py-4">{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className={`px-6 py-4 font-semibold ${product.stock <= product.lowStockThreshold ? 'text-red-500' : 'text-green-600'}`}>
                                    {product.stock}
                                </td>
                                {isAdmin && (
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => openModal(product)}>
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
        <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProduct?.id ? 'Editar Produto' : 'Adicionar Produto'}>
            <div className="space-y-4">
            <Input name="name" label="Nome do Produto" value={editingProduct?.name || ''} onChange={handleInputChange} />
            <Input name="category" label="Categoria" value={editingProduct?.category || ''} onChange={handleInputChange} />
            
            <div className="relative">
                <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                    value={editingProduct?.description || ''}
                    onChange={handleInputChange}
                />
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-0 right-0 mt-1 mr-1" 
                    onClick={handleGenerateDescription} 
                    isLoading={isGeneratingDesc}>
                    <SparklesIcon className="h-4 w-4 mr-1"/> Gerar com IA
                </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <Input name="price" label="Preço" type="number" value={String(editingProduct?.price || '')} onChange={handleInputChange} />
                <Input name="barcode" label="Código de Barras" value={editingProduct?.barcode || ''} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input name="stock" label="Estoque" type="number" value={String(editingProduct?.stock || '')} onChange={handleInputChange} />
                <Input name="lowStockThreshold" label="Alerta de Estoque Baixo" type="number" value={String(editingProduct?.lowStockThreshold || '')} onChange={handleInputChange} />
            </div>

            <div className="pt-4 mt-4 border-t">
                <h4 className="text-md font-semibold text-text-primary mb-3">Dados Fiscais</h4>
                <div className="grid grid-cols-2 gap-4">
                <Input name="ncm" label="NCM" value={editingProduct?.ncm || ''} onChange={handleInputChange} placeholder="ex: 0901.21.00"/>
                <Input name="cest" label="CEST" value={editingProduct?.cest || ''} onChange={handleInputChange} placeholder="ex: 17.099.00"/>
                <Input name="cfop" label="CFOP (Padrão)" value={editingProduct?.cfop || ''} onChange={handleInputChange} placeholder="ex: 5102"/>
                <Input name="origin" label="Origem" value={editingProduct?.origin || ''} onChange={handleInputChange} placeholder="ex: Nacional"/>
                </div>
            </div>

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

export default Products;