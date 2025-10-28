import React, { useMemo } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { Product, Sale, ProductCategory, ChartData } from '../types';
import Card from './ui/Card';
import Chart from './ui/Chart';
import { DollarSignIcon, ShoppingBagIcon, PackageIcon, BarChart3Icon } from './icons/Icon';

const Reports: React.FC = () => {
  const { data: sales, loading: loadingSales } = useMockApi<Sale[]>(api.getSales);
  const { data: products, loading: loadingProducts } = useMockApi<Product[]>(api.getProducts);
  const { data: categories, loading: loadingCategories } = useMockApi<ProductCategory[]>(api.getProductCategories);

  const loading = loadingSales || loadingProducts || loadingCategories;

  const reportData = useMemo(() => {
    if (!sales || !products || !categories) return null;

    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const totalItemsSold = sales.flatMap(s => s.items).reduce((acc, item) => acc + item.quantity, 0);

    const salesByCategory: { [key: string]: number } = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'Outros';
          salesByCategory[categoryName] = (salesByCategory[categoryName] || 0) + item.totalPrice;
        }
      });
    });
    const categoryChartData = Object.entries(salesByCategory).map(([name, value]) => ({ name, value }));
    
    const salesByProduct: { [key: string]: { name: string, quantity: number, revenue: number } } = {};
    sales.forEach(sale => {
        sale.items.forEach(item => {
            if (!salesByProduct[item.productId]) {
                salesByProduct[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
            }
            salesByProduct[item.productId].quantity += item.quantity;
            salesByProduct[item.productId].revenue += item.totalPrice;
        });
    });
    const topProducts = Object.values(salesByProduct).sort((a,b) => b.revenue - a.revenue).slice(0, 5);


    return {
      totalRevenue: totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      totalSales: sales.length,
      averageTicket: sales.length > 0 ? (totalRevenue / sales.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00',
      totalItemsSold: totalItemsSold,
      categoryChartData,
      topProducts,
    };
  }, [sales, products, categories]);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Relatórios Gerenciais</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Receita Total" value={reportData?.totalRevenue ?? 'R$ 0,00'} icon={DollarSignIcon} />
        <Card title="Total de Vendas" value={reportData?.totalSales.toString() ?? '0'} icon={ShoppingBagIcon} />
        <Card title="Ticket Médio" value={reportData?.averageTicket ?? 'R$ 0,00'} icon={BarChart3Icon} />
        <Card title="Itens Vendidos" value={reportData?.totalItemsSold.toString() ?? '0'} icon={PackageIcon} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Vendas por Categoria</h2>
          <Chart data={reportData?.categoryChartData ?? []} type="pie" />
        </div>
        <div className="bg-surface-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Top 5 Produtos Mais Vendidos (por receita)</h2>
           <ul className="space-y-3">
            {reportData?.topProducts.map(p => (
              <li key={p.name} className="flex justify-between items-center text-sm">
                <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-text-muted">{p.quantity} unidades vendidas</p>
                </div>
                <span className="font-bold text-brand-primary text-base">{p.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Reports;