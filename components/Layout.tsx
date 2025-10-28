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


const Layout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

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
