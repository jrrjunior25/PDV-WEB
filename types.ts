// types.ts

// Define os tipos de página para navegação
export type Page = 'dashboard' | 'pos' | 'products' | 'sales' | 'customers' | 'settings';

// Representa um produto no sistema
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  category: string;
  barcode: string;
  imageUrl: string;
  // Dados fiscais
  ncm: string;
  cest: string;
  cfop: string;
  origin: string;
}

// Representa um cliente
export interface Customer {
  id: string;
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
}

// Representa um item em uma venda
export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Representa uma venda completa
export interface Sale {
  id:string;
  date: string; // ISO string format
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX';
  customerId?: string;
  customerName?: string;
  // Dados da NFC-e
  nfceAccessKey?: string;
  nfceQrCodeUrl?: string;
}

// Representa um usuário do sistema
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'administrador' | 'vendedor' | 'caixa';
  password?: string; // Adicionado para a simulação de login
}

// Usado para dados de gráficos
export interface ChartData {
  name: string;
  value: number;
}

// Representa as configurações do sistema
export interface SystemSettings {
  companyName: string;
  cnpj: string;
  address: string;
  phone: string;
  taxRegime: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real';
  pixKey: string;
}