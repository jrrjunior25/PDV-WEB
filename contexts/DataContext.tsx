import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { api } from '../services/api';
import { AccountPayable, CashRegisterSession, Customer, Delivery, Product, ProductCategory, PurchaseOrder, Return, Sale, StoreCredit, Supplier, SystemSettings } from '../types';

interface AppData {
  products: Product[] | null;
  categories: ProductCategory[] | null;
  sales: Sale[] | null;
  customers: Customer[] | null;
  settings: SystemSettings | null;
  suppliers: Supplier[] | null;
  accountsPayable: AccountPayable[] | null;
  deliveries: Delivery[] | null;
  cashSessions: CashRegisterSession[] | null;
  returns: Return[] | null;
  storeCredits: StoreCredit[] | null;
  purchaseOrders: PurchaseOrder[] | null;
}

interface DataContextType {
  data: AppData;
  loading: boolean;
  error: string | null;
  refetchAll: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<AppData>({
    products: null,
    categories: null,
    sales: null,
    customers: null,
    settings: null,
    suppliers: null,
    accountsPayable: null,
    deliveries: null,
    cashSessions: null,
    returns: null,
    storeCredits: null,
    purchaseOrders: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        products, categories, sales, customers, settings, 
        suppliers, accountsPayable, deliveries, cashSessions, 
        returns, storeCredits, purchaseOrders
      ] = await Promise.all([
        api.getProducts(),
        api.getProductCategories(),
        api.getSales(),
        api.getCustomers(),
        api.getSettings(),
        api.getSuppliers(),
        api.getAccountsPayable(),
        api.getDeliveries(),
        api.getCashRegisterSessions(),
        api.getReturns(),
        api.getStoreCredits(),
        api.getPurchaseOrders(),
      ]);
      
      setData({
        products, categories, sales, customers, settings,
        suppliers, accountsPayable, deliveries, cashSessions,
        returns, storeCredits, purchaseOrders
      });

    } catch (e: any) {
      setError(e.message || 'Failed to fetch data');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const value = useMemo(() => ({
    data,
    loading,
    error,
    refetchAll: fetchData
  }), [data, loading, error]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
