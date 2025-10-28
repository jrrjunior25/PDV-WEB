import React, { useState, useMemo } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { Delivery } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { TruckIcon } from './icons/Icon';

const statusStyles: { [key in Delivery['status']]: string } = {
  Pendente: 'bg-yellow-100 text-yellow-800',
  'Em Trânsito': 'bg-blue-100 text-blue-800',
  Entregue: 'bg-green-100 text-green-800',
  Cancelada: 'bg-red-100 text-red-800',
};

// Simple map simulation component
const TrackingMap: React.FC<{ history: Delivery['trackingHistory'] }> = ({ history }) => {
    const [position, setPosition] = useState(0);

    React.useEffect(() => {
        if (!history || history.length === 0) return;
        const interval = setInterval(() => {
            setPosition(prev => (prev + 5) % 100);
        }, 1000);
        return () => clearInterval(interval);
    }, [history]);
    
    if(!history || history.length === 0) return <div className="text-center text-sm text-text-muted">Rastreamento indisponível.</div>

    return (
        <div className="h-48 bg-gray-200 rounded-lg relative overflow-hidden border">
            <div className="absolute top-2 left-2 text-xs font-semibold bg-white/70 px-2 py-1 rounded">
                <p>Origem: Centro de Distribuição</p>
            </div>
            <div className="absolute bottom-2 right-2 text-xs font-semibold bg-white/70 px-2 py-1 rounded">
                <p>Destino: Endereço do Cliente</p>
            </div>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-400"></div>
            <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear" style={{ left: `${position}%` }}>
                <TruckIcon className="h-6 w-6 text-brand-primary bg-white rounded-full p-1 shadow-lg" />
            </div>
        </div>
    );
};

const Deliveries: React.FC = () => {
  const { data: deliveries, loading, refetch } = useMockApi<Delivery[]>(api.getDeliveries);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async (id: string, status: Delivery['status']) => {
    setIsUpdating(true);
    await api.updateDeliveryStatus(id, status);
    refetch();
    setSelectedDelivery(prev => prev ? { ...prev, status } : null);
    setIsUpdating(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Gerenciamento de Entregas</h1>
      
      <div className="bg-surface-card rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-secondary">
            <thead className="text-xs text-text-muted uppercase bg-surface-main">
              <tr>
                <th scope="col" className="px-6 py-3">Data</th>
                <th scope="col" className="px-6 py-3">Cliente</th>
                <th scope="col" className="px-6 py-3">Endereço</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8">Carregando entregas...</td></tr>
              ) : (
                deliveries?.map(delivery => (
                  <tr key={delivery.id} className="bg-surface-card border-b hover:bg-surface-main/50">
                    <td className="px-6 py-4">{new Date(delivery.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 font-medium text-text-primary">{delivery.customerName}</td>
                    <td className="px-6 py-4 truncate max-w-xs">{delivery.address}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[delivery.status]}`}>
                        {delivery.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedDelivery(delivery)}>Ver Detalhes</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDelivery && (
        <Modal isOpen={!!selectedDelivery} onClose={() => setSelectedDelivery(null)} title={`Detalhes da Entrega - Venda #${selectedDelivery.saleId}`}>
          <div className="space-y-4">
            <div>
              <p><strong>Cliente:</strong> {selectedDelivery.customerName}</p>
              <p><strong>Endereço:</strong> {selectedDelivery.address}</p>
              <p><strong>Status Atual:</strong> {selectedDelivery.status}</p>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Rastreamento</h4>
              <TrackingMap history={selectedDelivery.trackingHistory} />
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-3">Atualizar Status</h4>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={selectedDelivery.status === 'Em Trânsito' ? 'primary' : 'secondary'} onClick={() => handleUpdateStatus(selectedDelivery.id, 'Em Trânsito')} isLoading={isUpdating} disabled={selectedDelivery.status !== 'Pendente'}>Marcar como "Em Trânsito"</Button>
                <Button size="sm" variant={selectedDelivery.status === 'Entregue' ? 'primary' : 'secondary'} onClick={() => handleUpdateStatus(selectedDelivery.id, 'Entregue')} isLoading={isUpdating} disabled={selectedDelivery.status !== 'Em Trânsito'}>Marcar como "Entregue"</Button>
                <Button size="sm" variant="danger" onClick={() => handleUpdateStatus(selectedDelivery.id, 'Cancelada')} isLoading={isUpdating} disabled={selectedDelivery.status === 'Entregue' || selectedDelivery.status === 'Cancelada'}>Cancelar Entrega</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Deliveries;
