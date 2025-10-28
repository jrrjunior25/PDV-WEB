import React from 'react';
import { Page } from '../types';
import { HomeIcon, ShoppingCartIcon, PackageIcon, BarChart3Icon, UsersIcon, SettingsIcon } from './icons/Icon';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'pos', label: 'PDV (Caixa)', icon: ShoppingCartIcon },
    { id: 'products', label: 'Produtos', icon: PackageIcon },
    { id: 'sales', label: 'Vendas', icon: BarChart3Icon },
    { id: 'customers', label: 'Clientes', icon: UsersIcon },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
  ];

  return (
    <aside className="w-16 md:w-64 bg-brand-primary text-white flex flex-col transition-all duration-300">
      <div className="p-4 border-b border-brand-secondary flex items-center justify-center md:justify-start">
        <ShoppingCartIcon className="h-8 w-8 text-white" />
        <h1 className="text-xl font-bold ml-2 hidden md:block">POS System</h1>
      </div>
      <nav className="flex-1 mt-4">
        <ul>
          {navItems.map(item => (
            <li key={item.id} className="px-2">
              <button
                onClick={() => setCurrentPage(item.id as Page)}
                className={`w-full flex items-center justify-center md:justify-start p-3 my-1 rounded-md text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-brand-secondary'
                    : 'hover:bg-brand-secondary/50'
                }`}
              >
                <item.icon className="h-6 w-6" />
                <span className="ml-3 hidden md:block">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-brand-secondary text-center">
        <p className="text-xs hidden md:block">© 2024 PDV Inteligente</p>
      </div>
    </aside>
  );
};

export default Sidebar;
