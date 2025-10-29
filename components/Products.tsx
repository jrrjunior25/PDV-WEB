import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { Product, ProductCategory } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import ErrorDisplay from './ui/ErrorDisplay';
import { generateProductDescription } from '../services/geminiService';
import { useAuth } from '../auth/AuthContext';
import { PlusIcon, EditIcon, SparklesIcon, MinusCircleIcon, PlusCircleIcon } from './icons/Icon';

const Products = () => {
  const { data: products, loading: loadingProducts, error: productsError, refetch: refetchProducts } = useMockApi<Product[]>(api.getProducts);
  const { data: categories, loading: loadingCategories, error: categoriesError, refetch: refetchCategories } = useMockApi<ProductCategory[]>(api.getProductCategories);
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isUpdatingStock, setIsUpdatingStock] = useState<string | null>(null);
  
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<ProductCategory> | null>(null);

  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';

  const loading = loadingProducts || loadingCategories;
  const error = productsError || categoriesError;
  const refetchAll = () => {
      refetchProducts();
      refetchCategories();
  };

  // --- Product Modal Logic ---
  const openProductModal = (product: Partial<Product> | null = null) => {
    setEditingProduct(product ? { ...product } : {
      name: '', description: '', price: 0, costPrice: 0, stock: 0, lowStockThreshold: 10,
      categoryId: categories?.[0]?.id || '', barcode: '',
      imageUrl: `https://picsum.photos/seed/${Date.now()}/400/400`,
      ncm: '', cest: '', cfop: '5102', origin: 'Nacional',
    });
    setModalOpen(true);
  };

  const closeProductModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleProductInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingProduct) return;
    const { name, value } = e.target;
    const numericFields = ['price', 'costPrice', 'stock', 'lowStockThreshold'];
    setEditingProduct({ 
      ...editingProduct, 
      [name]: numericFields.includes(name) ? (parseFloat(value) || 0) : value 
    });
  };
  
  const handleGenerateDescription = async () => {
    if (!editingProduct || !editingProduct.name || !editingProduct.categoryId) {
        alert("Por favor, preencha o nome e a categoria do produto para gerar uma descrição.");
        return;
    }
    const categoryName = categories?.find(c => c.id === editingProduct.categoryId)?.name || '';
    setIsGeneratingDesc(true);
    try {
        const description = await generateProductDescription(editingProduct.name, categoryName);
        setEditingProduct({ ...editingProduct, description });
    } finally {
        setIsGeneratingDesc(false);
    }
  };

  const handleProductSave = async () => {
    if (!editingProduct) return;
    try {
        await api.saveProduct(editingProduct as Product);
        refetchProducts();
        closeProductModal();
    } catch (e: any) {
        alert(`Erro ao salvar produto: ${e.message}`);
    }
  };
  
  const handleStockChange = async (productId: string, newStock: number) => {
    if (newStock < 0 || isUpdatingStock) return;
    setIsUpdatingStock(productId);
    try {
      await api.updateProductStock(productId, newStock);
      refetchProducts();
    } catch (error) {
      console.error("Failed to update stock", error);
      alert("Erro ao atualizar o estoque.");
    } finally {
      setIsUpdatingStock(null);
    }
  };

  // --- Category Modal Logic ---
  const openCategoryModal = (category: Partial<ProductCategory> | null = null) => {
    setEditingCategory(category ? { ...category } : { name: '' });
    setCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const handleCategorySave = async () => {
    if (!editingCategory?.name) return;
    try {
        await api.saveProductCategory(editingCategory as ProductCategory);
        refetchCategories();
        closeCategoryModal();
    } catch (e: any) {
        alert(`Erro ao salvar categoria: ${e.message}`);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.name || 'Sem Categoria';
  };
  
  const tableContent = () => {
    if (loading) return <tr><td colSpan={isAdmin ? 5 : 4} className="text-center py-8">Carregando produtos...</td></tr>;
    if (error) return <tr><td colSpan={isAdmin ? 5 : 4} className="p-4"><ErrorDisplay message={`Não foi possível carregar os produtos. ${error.message}`} onRetry={refetchAll} /></td></tr>;
    return products?.map(product => (
        <tr key={product.id} className="bg-surface-card border-b hover:bg-surface-main/50">
            <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap">{product.name}</td>
            <td className="px-6 py-4">{getCategoryName(product.categoryId)}</td>
            <td className="px-6 py-4">{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td className="px-6 py-4">
              <div className={`flex items-center justify-start font-semibold ${product.stock <= product.lowStockThreshold ? 'text-red-500' : 'text-green-600'}`}>
                {isAdmin ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-6 w-6 disabled:opacity-50"
                      onClick={() => handleStockChange(product.id, product.stock - 1)}
                      disabled={!!isUpdatingStock}
                    >
                      <MinusCircleIcon className="h-5 w-5" />
                    </Button>
                    <span className="w-10 text-center tabular-nums">
                      {isUpdatingStock === product.id ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400 mx-auto"></div> : product.stock}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-6 w-6 disabled:opacity-50"
                      onClick={() => handleStockChange(product.id, product.stock + 1)}
                      disabled={!!isUpdatingStock}
                    >
                      <PlusCircleIcon className="h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <span className="tabular-nums">{product.stock}</span>
                )}
              </div>
            </td>
            {isAdmin && (
                <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openProductModal(product)}>
                        <EditIcon className="h-4 w-4"/>
                    </Button>
                </td>
            )}
        </tr>
    ));
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Gerenciamento de Produtos</h1>
        {isAdmin && (
          <Button onClick={() => openProductModal()}><PlusIcon className="h-5 w-5 mr-2"/>Adicionar Produto</Button>
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
                    {tableContent()}
                </tbody>
            </table>
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      {isAdmin && isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={closeProductModal} title={editingProduct?.id ? 'Editar Produto' : 'Adicionar Produto'}>
            <div className="space-y-4">
            <Input name="name" label="Nome do Produto" value={editingProduct?.name || ''} onChange={handleProductInputChange} />
            
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-text-secondary mb-1">Categoria</label>
              <div className="flex gap-2">
                <select id="categoryId" name="categoryId" value={editingProduct?.categoryId || ''} onChange={handleProductInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent transition bg-white">
                  {categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <Button variant="secondary" onClick={() => openCategoryModal()}>Gerenciar</Button>
              </div>
            </div>

            <div className="relative">
                <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                <textarea id="description" name="description" rows={3} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent transition" value={editingProduct?.description || ''} onChange={handleProductInputChange}/>
                <Button variant="ghost" size="sm" className="absolute top-0 right-0 mt-1 mr-1" onClick={handleGenerateDescription} isLoading={isGeneratingDesc}>
                    <SparklesIcon className="h-4 w-4 mr-1"/> Gerar com IA
                </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <Input name="costPrice" label="Preço de Custo" type="number" value={String(editingProduct?.costPrice || '')} onChange={handleProductInputChange} />
                <Input name="price" label="Preço de Venda" type="number" value={String(editingProduct?.price || '')} onChange={handleProductInputChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input name="barcode" label="Código de Barras" value={editingProduct?.barcode || ''} onChange={handleProductInputChange} />
                 <Input name="stock" label="Estoque" type="number" value={String(editingProduct?.stock || '')} onChange={handleProductInputChange} />
            </div>
             <Input name="lowStockThreshold" label="Alerta de Estoque Baixo" type="number" value={String(editingProduct?.lowStockThreshold || '')} onChange={handleProductInputChange} />

            <div className="pt-4 mt-4 border-t">
                <h4 className="text-md font-semibold text-text-primary mb-3">Dados Fiscais</h4>
                <div className="grid grid-cols-2 gap-4">
                    <Input name="ncm" label="NCM" value={editingProduct?.ncm || ''} onChange={handleProductInputChange} placeholder="ex: 0901.21.00"/>
                    <Input name="cest" label="CEST" value={editingProduct?.cest || ''} onChange={handleProductInputChange} placeholder="ex: 17.099.00"/>
                    <Input name="cfop" label="CFOP (Padrão)" value={editingProduct?.cfop || ''} onChange={handleProductInputChange} placeholder="ex: 5102"/>
                    <Input name="origin" label="Origem" value={editingProduct?.origin || ''} onChange={handleProductInputChange} placeholder="ex: Nacional"/>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={closeProductModal}>Cancelar</Button>
                <Button onClick={handleProductSave}>Salvar</Button>
            </div>
            </div>
        </Modal>
      )}

      {/* Category Management Modal */}
      {isAdmin && isCategoryModalOpen && (
        <Modal isOpen={isCategoryModalOpen} onClose={closeCategoryModal} title="Gerenciar Categorias">
            <div className="space-y-4">
                <h4 className="font-semibold">Categorias Existentes</h4>
                <ul className="max-h-40 overflow-y-auto space-y-2 border p-2 rounded-md">
                    {categories?.map(cat => (
                        <li key={cat.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span>{cat.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => openCategoryModal(cat)}><EditIcon className="h-4 w-4"/></Button>
                        </li>
                    ))}
                </ul>
                <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">{editingCategory?.id ? 'Editar Categoria' : 'Adicionar Nova Categoria'}</h4>
                    <div className="flex gap-2">
                        <Input name="name" placeholder="Nome da categoria" value={editingCategory?.name || ''} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} />
                        <Button onClick={handleCategorySave}>{editingCategory?.id ? 'Salvar' : 'Adicionar'}</Button>
                    </div>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default Products;
