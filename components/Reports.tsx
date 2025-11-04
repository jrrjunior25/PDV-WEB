import { useMemo, useState, Fragment } from 'react';
import { api } from '../services/api';
import { useMockApi } from '../hooks/useMockApi';
import { Product, Sale, ProductCategory, ChartData, CashRegisterSession } from '../types';
import Card from './ui/Card';
import Chart from './ui/Chart';
import ErrorDisplay from './ui/ErrorDisplay';
import { DollarSignIcon, ShoppingBagIcon, PackageIcon, BarChart3Icon, ChevronDownIcon, ChevronUpIcon } from './icons/Icon';
import Button from './ui/Button';

const Reports = () => {
  const { data: sales, loading: loadingSales, error: salesError, refetch: refetchSales } = useMockApi<Sale[]>(api.getSales);
  const { data: products, loading: loadingProducts, error: productsError, refetch: refetchProducts } = useMockApi<Product[]>(api.getProducts);
  const { data: categories, loading: loadingCategories, error: categoriesError, refetch: refetchCategories } = useMockApi<ProductCategory[]>(api.getProductCategories);
  const { data: cashSessions, loading: loadingCashSessions, error: cashSessionsError, refetch: refetchCashSessions } = useMockApi<CashRegisterSession[]>(api.getCashRegisterSessions);

  const [filter, setFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const loading = loadingSales || loadingProducts || loadingCategories || loadingCashSessions;
  const error = salesError || productsError || categoriesError || cashSessionsError;
  const refetchAll = () => {
    refetchSales();
    refetchProducts();
    refetchCategories();
    refetchCashSessions();
  };

  const reportData = useMemo(() => {
    if (!sales || !products || !categories) return null;

    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      if (filter === 'today') {
        return saleDate.toDateString() === new Date().toDateString();
      }
      if (filter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return saleDate.toDateString() === yesterday.toDateString();
      }
      if (filter === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return saleDate >= start && saleDate <= end;
      }
      return true;
    });

    const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const totalItemsSold = filteredSales.flatMap(s => s.items).reduce((acc, item) => acc + item.quantity, 0);

    const salesByCategory: { [key: string]: number } = {};
    filteredSales.forEach(sale => {
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
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!salesByProduct[item.productId]) {
          salesByProduct[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        salesByProduct[item.productId].quantity += item.quantity;
        salesByProduct[item.productId].revenue += item.totalPrice;
      });
    });
    const topProducts = Object.values(salesByProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return {
      totalRevenue: totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      totalSales: filteredSales.length,
      averageTicket: filteredSales.length > 0 ? (totalRevenue / filteredSales.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00',
      totalItemsSold: totalItemsSold,
      categoryChartData,
      topProducts,
    };
  }, [sales, products, categories, filter, startDate, endDate]);

  const formatCurrency = (value: number | undefined) => (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div></div>;
  }
  
  if (error) {
    return <div className="flex justify-center items-center h-full p-4"><ErrorDisplay message={`Não foi possível carregar os dados para os relatórios. ${error.message}`} onRetry={refetchAll} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Relatórios Gerenciais</h1>
        <div className="flex items-center gap-2">
          <Button variant={filter === 'all' ? 'primary' : 'secondary'} onClick={() => setFilter('all')}>Tudo</Button>
          <Button variant={filter === 'today' ? 'primary' : 'secondary'} onClick={() => setFilter('today')}>Hoje</Button>
          <Button variant={filter === 'yesterday' ? 'primary' : 'secondary'} onClick={() => setFilter('yesterday')}>Ontem</Button>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md" />
          <Button variant={filter === 'custom' ? 'primary' : 'secondary'} onClick={() => setFilter('custom')}>Filtrar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Receita Total" value={reportData?.totalRevenue ?? 'R$ 0,00'} icon={DollarSignIcon} />
        <Card title="Total de Vendas" value={(reportData?.totalSales ?? 0).toString()} icon={ShoppingBagIcon} />
        <Card title="Ticket Médio" value={reportData?.averageTicket ?? 'R$ 0,00'} icon={BarChart3Icon} />
        <Card title="Itens Vendidos" value={(reportData?.totalItemsSold ?? 0).toString()} icon={PackageIcon} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Vendas por Categoria</h2>
          <Chart data={reportData?.categoryChartData ?? []} type="pie" />
        </div>
        <div className="bg-surface-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Top 5 Produtos Mais Vendidos (por receita)</h2>
           <ul className="space-y-3">
            {(reportData?.topProducts ?? []).map(p => (
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
      
      <div className="bg-surface-card rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold p-6 text-text-primary">Histórico de Sessões de Caixa</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-secondary">
            <thead className="text-xs text-text-muted uppercase bg-surface-main">
              <tr>
                <th className="px-6 py-3">Data Abertura</th>
                <th className="px-6 py-3">Operador</th>
                <th className="px-6 py-3">Valor Abertura</th>
                <th className="px-6 py-3">Valor Fechamento</th>
                <th className="px-6 py-3">Diferença</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {cashSessions?.map(session => {
                  const difference = session.closingBalance !== undefined && session.calculatedClosingBalance !== undefined
                    ? session.closingBalance - session.calculatedClosingBalance
                    : 0;
                  return (
                    <Fragment key={session.id}>
                        <tr className="border-b cursor-pointer hover:bg-surface-main/50" onClick={() => setExpandedSessionId(prev => prev === session.id ? null : session.id)}>
                            <td className="px-6 py-4">{new Date(session.openingTime).toLocaleString('pt-BR')}</td>
                            <td className="px-6 py-4">{session.operatorName}</td>
                            <td className="px-6 py-4">{formatCurrency(session.openingBalance)}</td>
                            <td className="px-6 py-4">{formatCurrency(session.closingBalance)}</td>
                            <td className={`px-6 py-4 font-bold ${difference === 0 ? '' : difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(difference)}
                            </td>
                            <td className="px-6 py-4 text-right">
                                {expandedSessionId === session.id ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                            </td>
                        </tr>
                        {expandedSessionId === session.id && (
                            <tr className="bg-gray-50">
                                <td colSpan={6} className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white rounded shadow-inner">
                                        <div>
                                            <h4 className="font-bold mb-2">Resumo da Sessão</h4>
                                            <ul className="text-xs space-y-1">
                                                <li className="flex justify-between"><span>Fechamento:</span> <span>{session.closingTime ? new Date(session.closingTime).toLocaleString('pt-BR') : 'N/A'}</span></li>
                                                <li className="flex justify-between"><span>(+) Vendas Dinheiro:</span> <span>{formatCurrency(session.salesSummary['Dinheiro'])}</span></li>
                                                <li className="flex justify-between"><span>(+) Vendas PIX:</span> <span>{formatCurrency(session.salesSummary['PIX'])}</span></li>
                                                <li className="flex justify-between"><span>(+) Vendas Cartão Crédito:</span> <span>{formatCurrency(session.salesSummary['Cartão de Crédito'])}</span></li>
                                                <li className="flex justify-between"><span>(+) Vendas Cartão Débito:</span> <span>{formatCurrency(session.salesSummary['Cartão de Débito'])}</span></li>
                                                <li className="flex justify-between"><span>(+) Vendas Vale-Crédito:</span> <span>{formatCurrency(session.salesSummary['Troca / Vale-Crédito'])}</span></li>
                                                <li className="flex justify-between"><span>(-) Sangrias:</span> <span>{formatCurrency(session.totalSangrias)}</span></li>
                                                <li className="flex justify-between font-bold pt-1 border-t mt-1"><span>(=) Valor Esperado (Dinheiro):</span> <span>{formatCurrency(session.calculatedClosingBalance)}</span></li>
                                            </ul>
                                        </div>
                                         <div>
                                            <h4 className="font-bold mb-2">Notas</h4>
                                            <p className="text-xs p-2 bg-gray-100 rounded min-h-[50px]">{session.notes || 'Nenhuma nota.'}</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </Fragment>
                  )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Reports;