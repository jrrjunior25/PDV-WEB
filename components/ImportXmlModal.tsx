import { useState, useEffect, useMemo, useRef } from 'react';
import { Product } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { api } from '../services/api';

// This interface should align with what's expected from the XML parsing logic
interface XmlData {
  supplier: {
    cnpj: string;
    name: string;
  };
  items: any[]; // The items parsed from XML
  totalAmount: number;
}

// This represents an item after being compared with existing products.
// It accurately reflects the data parsed from XML plus processing status.
interface ProcessedItem {
    name: string;
    quantity: number;
    costPrice: number;
    barcode: string;
    ncm: string;
    cfop: string;
    description: string;
    price: number;
    stock: number;
    lowStockThreshold: number;
    categoryId: string;
    imageUrl: string;
    origin: string;
    cest: string;
    status: 'new' | 'match';
    existingProductId?: string;
    existingProductName?: string;
}

interface ImportXmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  xmlData: XmlData;
  allProducts: Product[];
  onImportSuccess: () => void;
}

const ImportXmlModal = ({ isOpen, onClose, xmlData, allProducts, onImportSuccess }: ImportXmlModalProps) => {
    const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    useEffect(() => {
        if (!isOpen || !xmlData) return;
        if (isMountedRef.current) {
            setIsLoading(true);
        }
        
        const timer = setTimeout(() => {
            const matchedItems = xmlData.items.map(xmlItem => {
                // Try to match by barcode (EAN), then by name
                const match = allProducts.find(p => p.barcode && p.barcode !== '' && p.barcode === xmlItem.barcode) || 
                              allProducts.find(p => p.name.toLowerCase() === xmlItem.name.toLowerCase());
                
                if (match) {
                    return { ...xmlItem, status: 'match', existingProductId: match.id, existingProductName: match.name };
                } else {
                    return { ...xmlItem, status: 'new' };
                }
            });

            if (isMountedRef.current) {
                setProcessedItems(matchedItems as ProcessedItem[]);
                setIsLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [isOpen, xmlData, allProducts]);

    const handleConfirmImport = async () => {
        setIsProcessing(true);
        try {
            // Remove UI-specific properties before sending to the API
            const apiItems = processedItems.map(({ existingProductName, ...rest }) => rest);
            
            const importPayload = {
                supplier: xmlData.supplier,
                items: apiItems,
                totalAmount: xmlData.totalAmount
            };

            await api.processNfeXmlImport(importPayload);
            alert('Importação da NF-e concluída com sucesso! O estoque e as contas a pagar foram atualizados.');
            onImportSuccess();
            onClose();
        } catch (error) {
            alert('Falha na importação. Verifique o console para mais detalhes.');
            console.error("Erro ao importar NF-e:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const summary = useMemo(() => {
        if (isLoading) return { newCount: 0, updateCount: 0 };
        const newCount = processedItems.filter(item => item.status === 'new').length;
        const updateCount = processedItems.filter(item => item.status === 'match').length;
        return { newCount, updateCount };
    }, [processedItems, isLoading]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Entrada de Estoque via NF-e">
            <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold">Fornecedor</h4>
                    <p className="text-sm">{xmlData.supplier.name} - CNPJ: {xmlData.supplier.cnpj}</p>
                    <h4 className="font-semibold mt-2">Resumo da Nota</h4>
                    <p className="text-sm">
                        {xmlData.items.length} tipo(s) de produto | Total de 
                        <span className="font-bold"> {xmlData.items.reduce((acc, i) => acc + i.quantity, 0)} </span> 
                        unidades | Valor Total: 
                        <span className="font-bold"> {xmlData.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold mb-2">Itens a serem importados:</h4>
                    {isLoading ? (
                         <div className="flex justify-center items-center h-40">
                             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
                         </div>
                    ) : (
                        <div className="max-h-64 overflow-y-auto border rounded-md">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="p-2 text-left">Produto na NF-e</th>
                                        <th className="p-2 text-center">Qtd.</th>
                                        <th className="p-2 text-right">Custo Un.</th>
                                        <th className="p-2 text-left">Status no Sistema</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedItems.map((item, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="p-2">{item.name}</td>
                                            <td className="p-2 text-center font-semibold">{item.quantity}</td>
                                            <td className="p-2 text-right">{item.costPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                            <td className="p-2">
                                                {item.status === 'new' ? (
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Novo Produto</span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800" title={`Produto associado: ${item.existingProductName}`}>Atualizar Estoque</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-900 text-sm rounded-lg">
                    <p className="font-bold">Atenção:</p>
                    <p>Ao confirmar, <strong>{summary.newCount} novo(s) produto(s)</strong> serão cadastrados e <strong>{summary.updateCount} produto(s) existente(s)</strong> terão seu estoque e preço de custo atualizados. Um pedido de compra e uma conta a pagar serão gerados automaticamente.</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
                    <Button onClick={handleConfirmImport} isLoading={isProcessing} disabled={isLoading}>
                        Confirmar e Dar Entrada
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ImportXmlModal;