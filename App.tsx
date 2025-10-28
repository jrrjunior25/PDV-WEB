import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Products from './components/Products';
import SalesHistory from './components/SalesHistory';
import Customers from './components/Customers';
import Settings from './components/Settings';
import { Page } from './types';

// O componente principal que gerencia a navegação entre as telas.
const App: React.FC = () => {
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
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

export default App;
