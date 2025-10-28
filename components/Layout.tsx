import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Page } from '../types';
import Dashboard from './Dashboard';
import POS from './POS';
import Products from './Products';
import SalesHistory from './SalesHistory';
import Customers from './Customers';
import Settings from './Settings';
import Deliveries from './Deliveries';
import Suppliers from './Suppliers';
import AccountsPayable from './AccountsPayable';
import Reports from './Reports';
import ReturnsHistory from './ReturnsHistory';
import Purchases from './Purchases';
import { useAuth } from '../auth/AuthContext';


const Layout = () => {
  const { user } = useAuth();

  const getInitialPage = (): Page => {
    if (user?.role === 'caixa') {
      return 'pos';
    }
    return 'dashboard';
  };
  
  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage());

  // Função para renderizar o componente da página atual
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POS />;
      case 'products':
        return <Products />;
      case 'sales':
        return <SalesHistory />;
      case 'customers':
        return <Customers />;
      case 'settings':
        return <Settings />;
      case 'deliveries':
        return <Deliveries />;
      case 'suppliers':
        return <Suppliers />;
      case 'accountsPayable':
        return <AccountsPayable />;
      case 'reports':
        return <Reports />;
      case 'returns':
        return <ReturnsHistory />;
      case 'purchases':
        return <Purchases />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-surface-main">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
};

export default Layout;