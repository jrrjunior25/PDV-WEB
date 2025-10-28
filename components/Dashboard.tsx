
import React, { useMemo } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { Product, Sale, Customer, ChartData } from '../types';
import Card from './ui/Card';
import Chart from './ui/Chart';
import { DollarSignIcon, UsersIcon, PackageWarningIcon, ShoppingBagIcon } from './icons/Icon';

const Dashboard: React.FC = () => {
  const { data: sales, loading: loadingSales } = useMockApi<Sale[]>(api.getSales);
  const { data: products, loading: loadingProducts } = useMockApi<Product[]>(api.getProducts);
  const { data: customers, loading: loadingCustomers } = useMockApi<Customer[]>(api.getCustomers);

  const loading = loadingSales || loadingProducts || loadingCustomers;

  const stats = useMemo(() => {
    if (!sales || !products || !customers) return null;
    
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold).length;
    
    return {
      totalRevenue: totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      totalSales: sales.length,
      totalCustomers: customers.length,
      lowStockProducts,
    };
  }, [sales, products, customers]);
  
  const salesChartData: ChartData[] = useMemo(() => {
    if (!sales) return [];
    const dailySales: { [key: string]: number } = {};
    sales.forEach(sale => {
      const date = new Date(sale.date).toLocaleDateString('pt-BR');
      dailySales[date] = (dailySales[date] || 0) + sale.totalAmount;
    });
    return Object.entries(dailySales).map(([name, value]) => ({ name, value })).reverse();
  }, [sales]);


  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Receita Total" value={stats?.totalRevenue ?? 'R$ 0,00'} icon={DollarSignIcon} />
        <Card title="Total de Vendas" value={stats?.totalSales.toString() ?? '0'} icon={ShoppingBagIcon} />
        <Card title="Clientes" value={stats?.totalCustomers.toString() ?? '0'} icon={UsersIcon} />
        <Card title="Estoque Baixo" value={stats?.lowStockProducts.toString() ?? '0'} icon={PackageWarningIcon} isWarning={stats?.lowStockProducts > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Vendas nos Últimos Dias</h2>
          <Chart data={salesChartData} />
        </div>
        <div className="bg-surface-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Produtos com Estoque Baixo</h2>
          <ul className="space-y-2">
            {products?.filter(p => p.stock <= p.lowStockThreshold).map(p => (
              <li key={p.id} className="flex justify-between items-center text-sm">
                <span>{p.name}</span>
                <span className="font-bold text-red-500">{p.stock} un.</span>
              </li>
            ))}
            {products?.filter(p => p.stock <= p.lowStockThreshold).length === 0 && (
                <p className="text-text-muted text-sm">Nenhum produto com estoque baixo.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
