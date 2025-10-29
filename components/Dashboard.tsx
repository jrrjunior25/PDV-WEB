import { useMemo } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { Product, Sale, Customer, ChartData, Delivery, AccountPayable } from '../types';
import Card from './ui/Card';
import Chart from './ui/Chart';
import ErrorDisplay from './ui/ErrorDisplay';
import { DollarSignIcon, UsersIcon, PackageWarningIcon, ShoppingBagIcon, TruckIcon, ClipboardCheckIcon } from './icons/Icon';

const Dashboard = () => {
  const { data: sales, loading: loadingSales, error: salesError, refetch: refetchSales } = useMockApi<Sale[]>(api.getSales);
  const { data: products, loading: loadingProducts, error: productsError, refetch: refetchProducts } = useMockApi<Product[]>(api.getProducts);
  const { data: customers, loading: loadingCustomers, error: customersError, refetch: refetchCustomers } = useMockApi<Customer[]>(api.getCustomers);
  const { data: deliveries, loading: loadingDeliveries, error: deliveriesError, refetch: refetchDeliveries } = useMockApi<Delivery[]>(api.getDeliveries);
  const { data: accountsPayable, loading: loadingAccounts, error: accountsError, refetch: refetchAccounts } = useMockApi<AccountPayable[]>(api.getAccountsPayable);

  const loading = loadingSales || loadingProducts || loadingCustomers || loadingDeliveries || loadingAccounts;
  const error = salesError || productsError || customersError || deliveriesError || accountsError;

  const refetchAll = () => {
    refetchSales();
    refetchProducts();
    refetchCustomers();
    refetchDeliveries();
    refetchAccounts();
  };

  const stats = useMemo(() => {
    if (!sales || !products || !customers || !deliveries || !accountsPayable) return null;
    
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
  }, [sales, products, customers, deliveries, accountsPayable]);
  
  const salesChartData: ChartData[] = useMemo(() => {
    if (!sales) return [];
    const dailySales: { [key: string]: number } = {};
    sales.forEach(sale => {
      const date = new Date(sale.date).toLocaleDateString('pt-BR');
      dailySales[date] = (dailySales[date] || 0) + sale.totalAmount;
    });
    return Object.entries(dailySales).map(([name, value]) => ({ name, value })).reverse().slice(0, 7);
  }, [sales]);


  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-full p-4"><ErrorDisplay message={`Não foi possível carregar os dados do dashboard. ${error.message}`} onRetry={refetchAll} /></div>;
  }

  // FIX: Safely create the low stock product list to prevent a crash on initial render
  // when 'products' data is not yet available.
  const lowStockProductList = products?.filter(p => p.stock <= p.lowStockThreshold) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <Card title="Receita Total" value={stats?.totalRevenue ?? 'R$ 0,00'} icon={DollarSignIcon} />
        <Card title="Total de Vendas" value={(stats?.totalSales ?? 0).toString()} icon={ShoppingBagIcon} />
        <Card title="Entregas Pendentes" value={(stats?.pendingDeliveries ?? 0).toString()} icon={TruckIcon} />
        <Card title="Contas a Pagar" value={(stats?.dueAccounts ?? 0).toString()} icon={ClipboardCheckIcon} isWarning={(stats?.dueAccounts ?? 0) > 0}/>
        <Card title="Estoque Baixo" value={(stats?.lowStockProducts ?? 0).toString()} icon={PackageWarningIcon} isWarning={(stats?.lowStockProducts ?? 0) > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Vendas nos Últimos Dias</h2>
          <Chart data={salesChartData} />
        </div>
        <div className="bg-surface-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Produtos com Estoque Baixo</h2>
          <ul className="space-y-2">
            {lowStockProductList.map(p => (
              <li key={p.id} className="flex justify-between items-center text-sm">
                <span>{p.name}</span>
                <span className="font-bold text-red-500">{p.stock} un.</span>
              </li>
            ))}
            {lowStockProductList.length === 0 && (
                <p className="text-text-muted text-sm">Nenhum produto com estoque baixo.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;