import { Product, Sale, Customer, SystemSettings, User, ProductCategory, Supplier, AccountPayable, Delivery, CashRegisterSession, Sangria, Return, StoreCredit, ReturnItem } from '../types';

// --- MOCK DATABASE ---

let mockProductCategories: ProductCategory[] = [
  { id: 'cat1', name: 'Cafés' },
  { id: 'cat2', name: 'Eletrônicos' },
  { id: 'cat3', name: 'Livros' },
  { id: 'cat4', name: 'Utilidades' },
];

let mockProducts: Product[] = [
  { id: 'p1', name: 'Café Especial Grão 250g', description: 'Café arábica de alta qualidade, torra média.', price: 25.50, stock: 50, lowStockThreshold: 10, categoryId: 'cat1', barcode: '789000000001', imageUrl: 'https://picsum.photos/seed/coffee/400/400', ncm: '0901.21.00', cest: '17.099.00', cfop: '5102', origin: 'Nacional' },
  { id: 'p2', name: 'Notebook Pro X1', description: 'Processador i7, 16GB RAM, 512GB SSD.', price: 7500.00, stock: 8, lowStockThreshold: 5, categoryId: 'cat2', barcode: '789000000002', imageUrl: 'https://picsum.photos/seed/laptop/400/400', ncm: '8471.30.19', cest: '21.031.00', cfop: '5102', origin: 'Estrangeira' },
  { id: 'p3', name: 'Livro: A Arte da Programação', description: 'Um clássico da ciência da computação.', price: 120.00, stock: 15, lowStockThreshold: 5, categoryId: 'cat3', barcode: '789000000003', imageUrl: 'https://picsum.photos/seed/book/400/400', ncm: '4901.99.00', cest: '', cfop: '5102', origin: 'Nacional' },
  { id: 'p4', name: 'Mouse Sem Fio Ergonômico', description: 'Conforto e precisão para o dia a dia.', price: 150.00, stock: 3, lowStockThreshold: 10, categoryId: 'cat2', barcode: '789000000004', imageUrl: 'https://picsum.photos/seed/mouse/400/400', ncm: '8471.60.53', cest: '21.036.00', cfop: '5102', origin: 'Estrangeira' },
  { id: 'p5', name: 'Teclado Mecânico RGB', description: 'Switches blue para uma digitação precisa.', price: 350.00, stock: 20, lowStockThreshold: 8, categoryId: 'cat2', barcode: '789000000005', imageUrl: 'https://picsum.photos/seed/keyboard/400/400', ncm: '8471.60.52', cest: '21.035.00', cfop: '5102', origin: 'Estrangeira' },
  { id: 'p6', name: 'Garrafa Térmica Inox 1L', description: 'Mantém sua bebida quente por até 12 horas.', price: 89.90, stock: 40, lowStockThreshold: 15, categoryId: 'cat4', barcode: '789000000006', imageUrl: 'https://picsum.photos/seed/bottle/400/400', ncm: '9617.00.10', cest: '28.029.00', cfop: '5102', origin: 'Nacional' },
];

let mockSales: Sale[] = [
    { id: 's1', status: 'Completed', date: new Date(Date.now() - 86400000 * 2).toISOString(), items: [{ productId: 'p1', productName: 'Café Especial Grão 250g', quantity: 2, returnableQuantity: 2, unitPrice: 25.50, totalPrice: 51.00 }], totalAmount: 51.00, paymentMethod: 'PIX', customerId: 'c1', customerName: 'João Silva', nfceAccessKey: '43211234567890123456789012345678901234567890', nfceQrCodeUrl: 'https://www.sefaz.rs.gov.br/nfce/consulta?p=432112...|2|1|1|...', deliveryId: 'd1' },
    { id: 's2', status: 'Completed', date: new Date(Date.now() - 86400000).toISOString(), items: [{ productId: 'p2', productName: 'Notebook Pro X1', quantity: 1, returnableQuantity: 1, unitPrice: 7500.00, totalPrice: 7500.00 }, { productId: 'p4', productName: 'Mouse Sem Fio Ergonômico', quantity: 1, returnableQuantity: 1, unitPrice: 150.00, totalPrice: 150.00 }], totalAmount: 7650.00, paymentMethod: 'Cartão de Crédito', customerId: 'c2', customerName: 'Maria Oliveira' },
    { id: 's3', status: 'Completed', date: new Date().toISOString(), items: [{ productId: 'p3', productName: 'Livro: A Arte da Programação', quantity: 1, returnableQuantity: 1, unitPrice: 120.00, totalPrice: 120.00 }], totalAmount: 120.00, paymentMethod: 'Dinheiro' },
];

let mockCustomers: Customer[] = [
    { id: 'c1', name: 'João Silva', cpfCnpj: '111.222.333-44', email: 'joao.silva@example.com', phone: '(11) 98765-4321', address: 'Rua das Flores, 123, São Paulo, SP' },
    { id: 'c2', name: 'Maria Oliveira', cpfCnpj: '55.666.777/0001-88', email: 'maria.o@example.com', phone: '(21) 91234-5678', address: 'Avenida Copacabana, 456, Rio de Janeiro, RJ' },
    { id: 'c0', name: 'Consumidor Final', cpfCnpj: '', email: '', phone: '' },
];

let mockSuppliers: Supplier[] = [
  { id: 'sup1', name: 'Distribuidora de Eletrônicos Alpha', cnpj: '12.345.678/0001-99', contactPerson: 'Carlos Andrade', phone: '(11) 5555-1111', email: 'contato@alpha.com' },
  { id: 'sup2', name: 'Café Sol Nascente Fazendas', cnpj: '98.765.432/0001-11', contactPerson: 'Ana Pereira', phone: '(35) 5555-2222', email: 'ana.p@cafesol.com' },
];

let mockAccountsPayable: AccountPayable[] = [
  { id: 'ap1', supplierId: 'sup1', supplierName: 'Distribuidora de Eletrônicos Alpha', description: 'Compra de 20 mouses', amount: 1800.00, dueDate: new Date(Date.now() + 86400000 * 10).toISOString(), status: 'Pendente' },
  { id: 'ap2', supplierId: 'sup2', supplierName: 'Café Sol Nascente Fazendas', description: 'Saca de café especial', amount: 850.00, dueDate: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'Pendente' },
  { id: 'ap3', supplierId: 'sup1', supplierName: 'Distribuidora de Eletrônicos Alpha', description: 'Compra de 15 teclados', amount: 3250.00, dueDate: new Date(Date.now() - 86400000 * 20).toISOString(), status: 'Paga' },
];

let mockDeliveries: Delivery[] = [
  { id: 'd1', saleId: 's1', customerName: 'João Silva', address: 'Rua das Flores, 123, São Paulo, SP', status: 'Entregue', deliveryPerson: 'Marcos', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
];

let mockSettings: SystemSettings = {
    companyName: 'PDV Inteligente LTDA',
    cnpj: '00.000.000/0001-00',
    address: 'Rua Exemplo, 123 - Centro, São Paulo - SP',
    phone: '(11) 5555-4444',
    taxRegime: 'Simples Nacional',
    pixKey: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
};

const mockUsers: User[] = [
  { id: 'u1', name: 'Admin', email: 'admin@pdv.com', role: 'administrador', password: 'admin 123' },
  { id: 'u2', name: 'Caixa Teste', email: 'caixa@pdv.com', role: 'caixa', password: '123' },
];

let mockCashRegisterSessions: CashRegisterSession[] = [
    { id: 'crs1', openingTime: new Date(Date.now() - 86400000).toISOString(), closingTime: new Date(Date.now() - 86400000 + 8 * 3600000).toISOString(), openingBalance: 200.00, closingBalance: 1550.50, calculatedClosingBalance: 1551.00, status: 'fechado', operatorId: 'u2', operatorName: 'Caixa Teste', salesSummary: { 'Dinheiro': 1201.00, 'PIX': 150.00 }, totalSangrias: 0, totalStoreCreditUsed: 0, notes: 'Pequena diferença no troco.' }
];
let mockSangrias: Sangria[] = [];
let mockReturns: Return[] = [];
let mockStoreCredits: StoreCredit[] = [
    { id: 'sc1', customerId: 'c1', customerName: 'João Silva', initialAmount: 50.00, balance: 30.50, createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), expiresAt: new Date(Date.now() + 360 * 24 * 60 * 60 * 1000).toISOString(), status: 'Active' },
    { id: 'sc2', customerId: 'c2', customerName: 'Maria Oliveira', initialAmount: 120.00, balance: 120.00, createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), expiresAt: new Date(Date.now() + 355 * 24 * 60 * 60 * 1000).toISOString(), status: 'Active' },
];

const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));
const generateNfceAccessKey = () => Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('');


// --- API FUNCTIONS ---

export const api = {
  login: async (email: string, password: string): Promise<User> => {
    await simulateDelay(1000);
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    throw new Error('Credenciais inválidas. Verifique seu e-mail e senha.');
  },

  // Products
  getProducts: async (): Promise<Product[]> => { await simulateDelay(500); return [...mockProducts]; },
  getProductById: async (id: string): Promise<Product | undefined> => { await simulateDelay(200); return mockProducts.find(p => p.id === id); },
  saveProduct: async (product: Omit<Product, 'id'> & { id?: string }): Promise<Product> => {
    await simulateDelay(600);
    if (product.id) {
      const index = mockProducts.findIndex(p => p.id === product.id);
      if (index !== -1) { mockProducts[index] = { ...mockProducts[index], ...product } as Product; return mockProducts[index]; }
    }
    const newProduct: Product = { ...(product as Omit<Product, 'id'>), id: `p${Date.now()}` };
    mockProducts.push(newProduct);
    return newProduct;
  },
  updateProductStock: async (productId: string, newStock: number): Promise<Product> => {
    await simulateDelay(300);
    const index = mockProducts.findIndex(p => p.id === productId);
    if (index === -1) throw new Error("Produto não encontrado");
    mockProducts[index].stock = newStock >= 0 ? newStock : 0; // Ensure stock is not negative
    return mockProducts[index];
  },

  // Categories
  getProductCategories: async (): Promise<ProductCategory[]> => { await simulateDelay(200); return [...mockProductCategories]; },
  saveProductCategory: async (category: Omit<ProductCategory, 'id'> & { id?: string }): Promise<ProductCategory> => {
    await simulateDelay(400);
    if (category.id) {
      const index = mockProductCategories.findIndex(c => c.id === category.id);
      if (index !== -1) { mockProductCategories[index] = { ...mockProductCategories[index], ...category } as ProductCategory; return mockProductCategories[index]; }
    }
    const newCategory = { ...category, id: `cat${Date.now()}` } as ProductCategory;
    mockProductCategories.push(newCategory);
    return newCategory;
  },

  // Sales
  getSales: async (): Promise<Sale[]> => { await simulateDelay(700); return [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); },
  
  processSale: async (
      sale: Omit<Sale, 'id' | 'date' | 'status' | 'items' | 'storeCreditAmountUsed'> & { items: Omit<Sale['items'][0], 'returnableQuantity'>[] },
      storeCreditPayment?: { creditIds: string[], amount: number }
  ): Promise<Sale> => {
    await simulateDelay(1000);

    // Process store credit payment
    if (storeCreditPayment && storeCreditPayment.amount > 0) {
      let amountToDeduct = storeCreditPayment.amount;
      for (const creditId of storeCreditPayment.creditIds) {
        if (amountToDeduct <= 0) break;
        const creditIndex = mockStoreCredits.findIndex(c => c.id === creditId && c.status === 'Active');
        if (creditIndex !== -1) {
          const credit = mockStoreCredits[creditIndex];
          const deduction = Math.min(credit.balance, amountToDeduct);
          credit.balance -= deduction;
          amountToDeduct -= deduction;
          if (credit.balance <= 0) {
            credit.status = 'Used';
          }
        }
      }
    }

    const accessKey = generateNfceAccessKey();
    const newSale: Sale = {
      ...sale,
      id: `s${Date.now()}`,
      date: new Date().toISOString(),
      items: sale.items.map(item => ({...item, returnableQuantity: item.quantity})),
      status: 'Completed',
      nfceAccessKey: accessKey,
      nfceQrCodeUrl: `https://www.sefaz.rs.gov.br/nfce/consulta?p=${accessKey}|2|1|1|${btoa(String(sale.totalAmount))}`,
      storeCreditAmountUsed: storeCreditPayment?.amount,
    };

    newSale.items.forEach(item => {
      const productIndex = mockProducts.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) { mockProducts[productIndex].stock -= item.quantity; }
    });

    mockSales.push(newSale);
    return newSale;
  },

  createDeliveryForSale: async (saleId: string, customerName: string, address: string): Promise<Delivery> => {
    await simulateDelay(500);
    const saleIndex = mockSales.findIndex(s => s.id === saleId);
    if(saleIndex === -1) throw new Error("Venda não encontrada para criar entrega.");

    const newDelivery: Delivery = {
        id: `d${Date.now()}`,
        saleId: saleId,
        customerName: customerName,
        address: address,
        status: 'Pendente',
        createdAt: new Date().toISOString(),
    };
    mockDeliveries.push(newDelivery);
    mockSales[saleIndex].deliveryId = newDelivery.id;
    return newDelivery;
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => { await simulateDelay(400); return [...mockCustomers]; },
  getCustomerByCpf: async (cpf: string): Promise<Customer | null> => {
    await simulateDelay(300);
    return mockCustomers.find(c => c.cpfCnpj === cpf) || null;
  },

  // Settings
  getSettings: async (): Promise<SystemSettings> => { await simulateDelay(300); return { ...mockSettings }; },
  saveSettings: async (settings: SystemSettings): Promise<SystemSettings> => { await simulateDelay(500); mockSettings = { ...settings }; return { ...mockSettings }; },

  // Suppliers
  getSuppliers: async (): Promise<Supplier[]> => { await simulateDelay(400); return [...mockSuppliers]; },
  saveSupplier: async (supplier: Omit<Supplier, 'id'> & { id?: string }): Promise<Supplier> => {
    await simulateDelay(500);
    if (supplier.id) {
        const index = mockSuppliers.findIndex(s => s.id === supplier.id);
        if (index !== -1) { mockSuppliers[index] = { ...supplier } as Supplier; return mockSuppliers[index]; }
    }
    const newSupplier = { ...supplier, id: `sup${Date.now()}` } as Supplier;
    mockSuppliers.push(newSupplier);
    return newSupplier;
  },

  // Accounts Payable
  getAccountsPayable: async (): Promise<AccountPayable[]> => { await simulateDelay(600); return [...mockAccountsPayable].sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()); },
  saveAccountPayable: async (account: Omit<AccountPayable, 'id' | 'supplierName'> & { id?: string }): Promise<AccountPayable> => {
    await simulateDelay(500);
    const supplier = mockSuppliers.find(s => s.id === account.supplierId);
    if (!supplier) throw new Error("Fornecedor não encontrado");

    if (account.id) {
        const index = mockAccountsPayable.findIndex(a => a.id === account.id);
        if (index !== -1) {
            mockAccountsPayable[index] = { ...mockAccountsPayable[index], ...account, supplierName: supplier.name };
            return mockAccountsPayable[index];
        }
    }
    const newAccount = { ...account, id: `ap${Date.now()}`, supplierName: supplier.name, status: 'Pendente' } as AccountPayable;
    mockAccountsPayable.push(newAccount);
    return newAccount;
  },
  updateAccountPayableStatus: async (id: string, status: 'Pendente' | 'Paga'): Promise<AccountPayable> => {
    await simulateDelay(300);
    const index = mockAccountsPayable.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Conta não encontrada");
    mockAccountsPayable[index].status = status;
    return mockAccountsPayable[index];
  },

  // Deliveries
  getDeliveries: async (): Promise<Delivery[]> => { await simulateDelay(800); return [...mockDeliveries].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); },
  updateDeliveryStatus: async (id: string, status: Delivery['status']): Promise<Delivery> => {
    await simulateDelay(400);
    const index = mockDeliveries.findIndex(d => d.id === id);
    if (index === -1) throw new Error("Entrega não encontrada");
    mockDeliveries[index].status = status;
    if (status === 'Em Trânsito' && !mockDeliveries[index].trackingHistory) {
      mockDeliveries[index].trackingHistory = [{ lat: -23.5505, lng: -46.6333, timestamp: new Date().toISOString() }];
    }
    return mockDeliveries[index];
  },
  
  // Cash Register
  getCurrentCashRegisterSession: async (): Promise<CashRegisterSession | null> => {
    await simulateDelay(400);
    return mockCashRegisterSessions.find(s => s.status === 'aberto') || null;
  },
  openCashRegister: async (openingBalance: number, operatorId: string, operatorName: string): Promise<CashRegisterSession> => {
    await simulateDelay(600);
    if (mockCashRegisterSessions.some(s => s.status === 'aberto')) {
      throw new Error("Já existe um caixa aberto.");
    }
    const newSession: CashRegisterSession = {
      id: `crs${Date.now()}`,
      openingTime: new Date().toISOString(),
      openingBalance,
      operatorId,
      operatorName,
      status: 'aberto',
      salesSummary: {},
      totalSangrias: 0,
      totalStoreCreditUsed: 0,
    };
    mockCashRegisterSessions.push(newSession);
    return newSession;
  },
  recordSangria: async (sessionId: string, amount: number, operatorName: string): Promise<Sangria> => {
    await simulateDelay(500);
    const sessionIndex = mockCashRegisterSessions.findIndex(s => s.id === sessionId && s.status === 'aberto');
    if (sessionIndex === -1) throw new Error("Nenhuma sessão de caixa aberta encontrada.");
    
    const newSangria: Sangria = {
      id: `sg${Date.now()}`,
      sessionId,
      amount,
      timestamp: new Date().toISOString(),
      operatorName,
    };
    mockSangrias.push(newSangria);
    mockCashRegisterSessions[sessionIndex].totalSangrias += amount;
    return newSangria;
  },
  closeCashRegister: async (sessionId: string, closingBalance: number, notes: string): Promise<CashRegisterSession> => {
    await simulateDelay(1200);
    const sessionIndex = mockCashRegisterSessions.findIndex(s => s.id === sessionId && s.status === 'aberto');
    if (sessionIndex === -1) throw new Error("Sessão de caixa não encontrada ou já fechada.");

    const session = mockCashRegisterSessions[sessionIndex];
    const salesInSession = mockSales.filter(sale => new Date(sale.date) >= new Date(session.openingTime));
    
    const salesSummary: { [key in Sale['paymentMethod']]?: number } = {};
    let totalStoreCreditUsedInSession = 0;

    salesInSession.forEach(sale => {
      // Add to total store credit used
      if (sale.storeCreditAmountUsed) {
        totalStoreCreditUsedInSession += sale.storeCreditAmountUsed;
      }
      
      // Calculate the amount for the primary payment method
      const amountForPaymentMethod = sale.totalAmount - (sale.storeCreditAmountUsed || 0);

      if (amountForPaymentMethod > 0.009) { // Check for amounts greater than a cent
        salesSummary[sale.paymentMethod] = (salesSummary[sale.paymentMethod] || 0) + amountForPaymentMethod;
      } else if (sale.paymentMethod === 'Troca / Vale-Crédito') { // Full payment with credit
        salesSummary[sale.paymentMethod] = (salesSummary[sale.paymentMethod] || 0) + sale.totalAmount;
      }
    });

    const totalSangrias = mockSangrias
      .filter(s => s.sessionId === sessionId)
      .reduce((acc, s) => acc + s.amount, 0);
      
    const cashIn = salesSummary['Dinheiro'] || 0;
    const calculatedClosingBalance = session.openingBalance + cashIn - totalSangrias;

    session.closingTime = new Date().toISOString();
    session.status = 'fechado';
    session.closingBalance = closingBalance;
    session.calculatedClosingBalance = calculatedClosingBalance;
    session.salesSummary = salesSummary;
    session.totalSangrias = totalSangrias;
    session.totalStoreCreditUsed = totalStoreCreditUsedInSession;
    session.notes = notes;

    mockCashRegisterSessions[sessionIndex] = session;
    return session;
  },
  getCashRegisterSessions: async (): Promise<CashRegisterSession[]> => {
    await simulateDelay(700);
    return [...mockCashRegisterSessions].sort((a,b) => new Date(b.openingTime).getTime() - new Date(a.openingTime).getTime());
  },

  // Returns & Store Credits
  getReturns: async (): Promise<Return[]> => {
    await simulateDelay(500);
    return [...mockReturns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  getStoreCredits: async (): Promise<StoreCredit[]> => {
    await simulateDelay(400);
    return [...mockStoreCredits];
  },
  processReturn: async (saleId: string, itemsToReturn: ReturnItem[], reason: string, outcome: 'Refund' | 'Store Credit', operatorName: string): Promise<Return> => {
    await simulateDelay(1000);
    const saleIndex = mockSales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) throw new Error("Venda original não encontrada.");
    
    const sale = mockSales[saleIndex];
    let totalReturnedValue = 0;
    
    // Validate and process items
    itemsToReturn.forEach(returnItem => {
      const originalItemIndex = sale.items.findIndex(i => i.productId === returnItem.productId);
      if (originalItemIndex === -1) throw new Error(`Produto ${returnItem.productName} não encontrado na venda original.`);
      
      const originalItem = sale.items[originalItemIndex];
      if (returnItem.quantity > originalItem.returnableQuantity) {
        throw new Error(`Quantidade a devolver de ${returnItem.productName} é maior que a permitida.`);
      }
      
      originalItem.returnableQuantity -= returnItem.quantity;
      totalReturnedValue += returnItem.totalPrice;
      
      // Update stock
      const productIndex = mockProducts.findIndex(p => p.id === returnItem.productId);
      if (productIndex !== -1) {
        mockProducts[productIndex].stock += returnItem.quantity;
      }
    });

    // Update sale status
    const totalReturnableItemsLeft = sale.items.reduce((acc, item) => acc + item.returnableQuantity, 0);
    sale.status = totalReturnableItemsLeft === 0 ? 'Fully Returned' : 'Partially Returned';
    
    // Create return record
    const newReturn: Return = {
      id: `ret${Date.now()}`,
      saleId,
      date: new Date().toISOString(),
      items: itemsToReturn,
      totalAmount: totalReturnedValue,
      reason,
      outcome,
      operatorName,
    };
    mockReturns.push(newReturn);

    // Create store credit if applicable
    if (outcome === 'Store Credit' && sale.customerId) {
      const customer = mockCustomers.find(c => c.id === sale.customerId);
      if (customer) {
        const newCredit: StoreCredit = {
          id: `sc${Date.now()}`,
          customerId: sale.customerId,
          customerName: customer.name,
          initialAmount: totalReturnedValue,
          balance: totalReturnedValue,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
          status: 'Active',
        };
        mockStoreCredits.push(newCredit);
      }
    }

    return newReturn;
  },
};