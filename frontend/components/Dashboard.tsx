import { useMemo } from 'react';
import Card from './ui/Card';
import Chart from './ui/Chart';
import ErrorDisplay from './ui/ErrorDisplay';
import { DollarSignIcon, ShoppingBagIcon, TruckIcon, ClipboardCheckIcon, PackageWarningIcon } from './icons/Icon';
import { useData } from '../contexts/DataContext';
import SkeletonLoader from './ui/SkeletonLoader';
import { Page } from '../../shared/types';

interface DashboardProps {
  setCurrentPage: (page: Page) => void;
}

const Dashboard = ({ setCurrentPage }: DashboardProps) => {
  const { data, loading, error, refetchAll } = useData();
  const { sales, products, deliveries, accountsPayable } = data;

  const stats = useMemo(() => {
    if (!sales || !products || !deliveries || !accountsPayable) return null;
    
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold).length;
    const pendingDeliveries = deliveries.filter(d => d.status === 'Pendente' || d.status === 'Em Trânsito').length;
    const dueAccounts = accountsPayable.filter(a => a.status === 'Pendente' && new Date(a.dueDate) <= new Date(Date.now() + 86400000 * 7)).length;

    return {
      totalRevenue: totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      totalSales: sales.length,
      pendingDeliveries: pendingDeliveries,
      dueAccounts: dueAccounts,
      lowStockProducts,
    };
  }, [sales, products, deliveries, accountsPayable]);
  
  const salesChartData = useMemo(() => {
    if (!sales) return [];
    const dailySales: { [key: string]: number } = {};
    sales.forEach(sale => {
      const date = new Date(sale.date).toLocaleDateString('pt-BR');
      dailySales[date] = (dailySales[date] || 0) + sale.totalAmount;
    });
    return Object.entries(dailySales).map(([name, value]) => ({ name, value })).reverse().slice(0, 7);
  }, [sales]);

  const paymentMethodChartData = useMemo(() => {
    if (!sales) return [];
    const salesByMethod: { [key: string]: number } = {};
    sales.forEach(sale => {
      const paymentMethod = sale.paymentMethod;
      salesByMethod[paymentMethod] = (salesByMethod[paymentMethod] || 0) + sale.totalAmount;
    });
    return Object.entries(salesByMethod).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const topSellingProducts = useMemo(() => {
    if (!sales || !products) return [];
    const productSales: { [key: string]: { name: string, quantity: number, revenue: number, imageUrl: string } } = {};

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          const product = products.find(p => p.id === item.productId);
          productSales[item.productId] = { 
            name: item.productName, 
            quantity: 0, 
            revenue: 0, 
            imageUrl: product?.imageUrl || '' 
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.totalPrice;
      });
    });

    return Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [sales, products]);


  if (loading) {
    return (
        <div className="space-y-6">
            <SkeletonLoader className="h-10 w-1/3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <SkeletonLoader className="h-28" />
                <SkeletonLoader className="h-28" />
                <SkeletonLoader className="h-28" />
                <SkeletonLoader className="h-28" />
                <SkeletonLoader className="h-28" />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <SkeletonLoader className="h-80 lg:col-span-3" />
                <SkeletonLoader className="h-80 lg:col-span-2" />
            </div>
            <SkeletonLoader className="h-64" />
        </div>
    );
  }

  if (error) {
    return <div className="flex justify-center items-center h-full p-4"><ErrorDisplay message={`Não foi possível carregar os dados do dashboard. ${error}`} onRetry={refetchAll} /></div>;
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <Card title="Receita Total" value={stats?.totalRevenue ?? 'R$ 0,00'} icon={DollarSignIcon} />
        <Card title="Total de Vendas" value={(stats?.totalSales ?? 0).toString()} icon={ShoppingBagIcon} onClick={() => setCurrentPage('sales')} />
        <Card title="Entregas Pendentes" value={(stats?.pendingDeliveries ?? 0).toString()} icon={TruckIcon} onClick={() => setCurrentPage('deliveries')} isWarning={(stats?.pendingDeliveries ?? 0) > 0}/>
        <Card title="Contas a Pagar" value={(stats?.dueAccounts ?? 0).toString()} icon={ClipboardCheckIcon} isWarning={(stats?.dueAccounts ?? 0) > 0} onClick={() => setCurrentPage('accountsPayable')} />
        <Card title="Estoque Baixo" value={(stats?.lowStockProducts ?? 0).toString()} icon={PackageWarningIcon} isWarning={(stats?.lowStockProducts ?? 0) > 0} onClick={() => setCurrentPage('products')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-surface-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Vendas nos Últimos Dias</h2>
          <Chart data={salesChartData} />
        </div>
        <div className="lg:col-span-2 bg-surface-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Vendas por Pagamento</h2>
          <Chart data={paymentMethodChartData} type="pie" />
        </div>
      </div>
       <div className="bg-surface-card p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-text-primary">Top 5 Produtos Mais Vendidos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {topSellingProducts?.map(p => (
                <tr key={p.name} className="border-b last:border-0">
                  <td className="py-3 pr-4">
                    <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded object-cover" />
                  </td>
                  <td className="py-3 px-4 font-semibold text-text-primary">{p.name}</td>
                  <td className="py-3 px-4 text-text-secondary text-center">{p.quantity} un.</td>
                  <td className="py-3 pl-4 font-bold text-green-600 text-right">{p.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {topSellingProducts?.length === 0 && (
              <p className="text-text-muted text-sm text-center py-4">Nenhuma venda registrada para exibir produtos.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;