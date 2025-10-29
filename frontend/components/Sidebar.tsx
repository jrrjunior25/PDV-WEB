

import { Page, User } from '../../shared/types';
import { useAuth } from '../auth/AuthContext';
import { HomeIcon, ShoppingCartIcon, PackageIcon, BarChart3Icon, UsersIcon, SettingsIcon, LogOutIcon, TruckIcon, Building2Icon, ClipboardCheckIcon, FileTextIcon, Undo2Icon, ArchiveIcon } from './icons/Icon';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const Sidebar = ({ currentPage, setCurrentPage }: SidebarProps) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, roles: ['administrador', 'vendedor'] },
    { id: 'pos', label: 'PDV (Caixa)', icon: ShoppingCartIcon, roles: ['administrador', 'vendedor', 'caixa'] },
    { id: 'products', label: 'Produtos', icon: PackageIcon, roles: ['administrador', 'vendedor', 'caixa'] },
    { id: 'sales', label: 'Vendas', icon: BarChart3Icon, roles: ['administrador', 'vendedor'] },
    { id: 'returns', label: 'Devoluções', icon: Undo2Icon, roles: ['administrador', 'vendedor'] },
    { id: 'deliveries', label: 'Entregas', icon: TruckIcon, roles: ['administrador', 'vendedor'] },
    { id: 'customers', label: 'Clientes', icon: UsersIcon, roles: ['administrador', 'vendedor', 'caixa'] },
    { id: 'suppliers', label: 'Fornecedores', icon: Building2Icon, roles: ['administrador'] },
    { id: 'purchases', label: 'Compras', icon: ArchiveIcon, roles: ['administrador'] },
    { id: 'accountsPayable', label: 'Contas a Pagar', icon: ClipboardCheckIcon, roles: ['administrador'] },
    { id: 'reports', label: 'Relatórios', icon: FileTextIcon, roles: ['administrador'] },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon, roles: ['administrador'] },
  ];
  
  const availableNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-16 md:w-64 bg-brand-primary text-white flex flex-col transition-all duration-300">
      <div className="p-4 border-b border-brand-secondary flex items-center justify-center md:justify-start">
        <ShoppingCartIcon className="h-8 w-8 text-white" />
        <h1 className="text-xl font-bold ml-2 hidden md:block">POS System</h1>
      </div>
      <nav className="flex-1 mt-4">
        <ul>
          {availableNavItems.map(item => (
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
      <div className="p-2 border-t border-brand-secondary">
        <div className="p-2 hidden md:block">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-text-muted capitalize">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center md:justify-start p-3 my-1 rounded-md text-sm font-medium transition-colors hover:bg-red-500/80"
        >
          <LogOutIcon className="h-6 w-6" />
          <span className="ml-3 hidden md:block">Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;