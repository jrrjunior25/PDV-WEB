// types.ts

// Define os tipos de página para navegação
export type Page = 'dashboard' | 'pos' | 'products' | 'sales' | 'customers' | 'settings' | 'deliveries' | 'suppliers' | 'accountsPayable' | 'reports' | 'returns';

// Representa uma categoria de produto
export interface ProductCategory {
  id: string;
  name: string;
}

// Representa um produto no sistema
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  categoryId: string; // Alterado de 'category' para 'categoryId'
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
  id:string;
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  address?: string; // Endereço para entregas
}

// Representa um item em uma venda
export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  returnableQuantity: number; // Quantidade que ainda pode ser devolvida
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

// Representa uma venda completa
export interface Sale {
  id:string;
  date: string; // ISO string format
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX' | 'A Pagar na Entrega' | 'Troca / Vale-Crédito';
  customerId?: string;
  customerName?: string;
  deliveryId?: string; // ID da entrega associada
  status: 'Completed' | 'Partially Returned' | 'Fully Returned' | 'Pending Payment';
  // Dados da NFC-e
  nfceAccessKey?: string;
  nfceQrCodeUrl?: string;
}

// Representa um item devolvido
export interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Representa uma devolução
export interface Return {
  id: string;
  saleId: string;
  date: string; // ISO string
  items: ReturnItem[];
  totalAmount: number;
  reason: string;
  outcome: 'Refund' | 'Store Credit';
  operatorName: string;
}

// Representa um vale-crédito
export interface StoreCredit {
  id: string;
  customerId: string;
  customerName: string;
  initialAmount: number;
  balance: number;
  createdAt: string; // ISO string
  expiresAt: string; // ISO string
  status: 'Active' | 'Used';
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
// FIX: Added index signature to be compatible with recharts library
export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
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

// Representa um fornecedor
export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  contactPerson: string;
  phone: string;
  email: string;
}

// Representa uma conta a pagar
export interface AccountPayable {
  id: string;
  supplierId: string;
  supplierName: string;
  description: string;
  amount: number;
  dueDate: string; // ISO string
  status: 'Pendente' | 'Paga';
}

// Representa uma entrega
export interface Delivery {
  id: string;
  saleId: string;
  customerName: string;
  address: string;
  status: 'Pendente' | 'Em Trânsito' | 'Entregue' | 'Cancelada';
  deliveryPerson?: string;
  trackingHistory?: { lat: number; lng: number; timestamp: string }[];
  createdAt: string; // ISO string
}

// Representa uma retirada de dinheiro do caixa (sangria)
export interface Sangria {
  id: string;
  sessionId: string;
  amount: number;
  timestamp: string; // ISO string
  operatorName: string;
}

// Representa uma sessão de caixa (abertura e fechamento)
export interface CashRegisterSession {
  id: string;
  openingTime: string; // ISO string
  closingTime?: string; // ISO string
  openingBalance: number; // Valor de abertura (suprimento)
  closingBalance?: number; // Valor contado no fechamento
  calculatedClosingBalance?: number; // Valor que deveria estar no caixa
  status: 'aberto' | 'fechado';
  operatorId: string;
  operatorName: string;
  salesSummary: { [key in Sale['paymentMethod']]?: number };
  totalSangrias: number;
  notes?: string;
}