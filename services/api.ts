import { Product, Sale, Customer, SystemSettings, User } from '../types';

// Simula um banco de dados em memória
let mockProducts: Product[] = [
  { id: 'p1', name: 'Café Especial Grão 250g', description: 'Café arábica de alta qualidade, torra média.', price: 25.50, stock: 50, lowStockThreshold: 10, category: 'Cafés', barcode: '789000000001', imageUrl: 'https://picsum.photos/seed/coffee/400/400', ncm: '0901.21.00', cest: '17.099.00', cfop: '5102', origin: 'Nacional' },
  { id: 'p2', name: 'Notebook Pro X1', description: 'Processador i7, 16GB RAM, 512GB SSD.', price: 7500.00, stock: 8, lowStockThreshold: 5, category: 'Eletrônicos', barcode: '789000000002', imageUrl: 'https://picsum.photos/seed/laptop/400/400', ncm: '8471.30.19', cest: '21.031.00', cfop: '5102', origin: 'Estrangeira' },
  { id: 'p3', name: 'Livro: A Arte da Programação', description: 'Um clássico da ciência da computação.', price: 120.00, stock: 15, lowStockThreshold: 5, category: 'Livros', barcode: '789000000003', imageUrl: 'https://picsum.photos/seed/book/400/400', ncm: '4901.99.00', cest: '', cfop: '5102', origin: 'Nacional' },
  { id: 'p4', name: 'Mouse Sem Fio Ergonômico', description: 'Conforto e precisão para o dia a dia.', price: 150.00, stock: 3, lowStockThreshold: 10, category: 'Eletrônicos', barcode: '789000000004', imageUrl: 'https://picsum.photos/seed/mouse/400/400', ncm: '8471.60.53', cest: '21.036.00', cfop: '5102', origin: 'Estrangeira' },
  { id: 'p5', name: 'Teclado Mecânico RGB', description: 'Switches blue para uma digitação precisa.', price: 350.00, stock: 20, lowStockThreshold: 8, category: 'Eletrônicos', barcode: '789000000005', imageUrl: 'https://picsum.photos/seed/keyboard/400/400', ncm: '8471.60.52', cest: '21.035.00', cfop: '5102', origin: 'Estrangeira' },
  { id: 'p6', name: 'Garrafa Térmica Inox 1L', description: 'Mantém sua bebida quente por até 12 horas.', price: 89.90, stock: 40, lowStockThreshold: 15, category: 'Utilidades', barcode: '789000000006', imageUrl: 'https://picsum.photos/seed/bottle/400/400', ncm: '9617.00.10', cest: '28.029.00', cfop: '5102', origin: 'Nacional' },
];

let mockSales: Sale[] = [
    { id: 's1', date: new Date(Date.now() - 86400000 * 2).toISOString(), items: [{ productId: 'p1', productName: 'Café Especial Grão 250g', quantity: 2, unitPrice: 25.50, totalPrice: 51.00 }], totalAmount: 51.00, paymentMethod: 'PIX', customerId: 'c1', customerName: 'João Silva', nfceAccessKey: '43211234567890123456789012345678901234567890', nfceQrCodeUrl: 'https://www.sefaz.rs.gov.br/nfce/consulta?p=432112...|2|1|1|...'},
    { id: 's2', date: new Date(Date.now() - 86400000).toISOString(), items: [{ productId: 'p2', productName: 'Notebook Pro X1', quantity: 1, unitPrice: 7500.00, totalPrice: 7500.00 }, { productId: 'p4', productName: 'Mouse Sem Fio Ergonômico', quantity: 1, unitPrice: 150.00, totalPrice: 150.00 }], totalAmount: 7650.00, paymentMethod: 'Cartão de Crédito', customerId: 'c2', customerName: 'Maria Oliveira' },
    { id: 's3', date: new Date().toISOString(), items: [{ productId: 'p3', productName: 'Livro: A Arte da Programação', quantity: 1, unitPrice: 120.00, totalPrice: 120.00 }], totalAmount: 120.00, paymentMethod: 'Dinheiro' },
];

let mockCustomers: Customer[] = [
    { id: 'c1', name: 'João Silva', cpfCnpj: '111.222.333-44', email: 'joao.silva@example.com', phone: '(11) 98765-4321' },
    { id: 'c2', name: 'Maria Oliveira', cpfCnpj: '55.666.777/0001-88', email: 'maria.o@example.com', phone: '(21) 91234-5678' },
];

let mockSettings: SystemSettings = {
    companyName: 'PDV Inteligente LTDA',
    cnpj: '00.000.000/0001-00',
    address: 'Rua Exemplo, 123 - Centro, São Paulo - SP',
    phone: '(11) 5555-4444',
    taxRegime: 'Simples Nacional',
    pixKey: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', // Chave PIX aleatória (UUID)
};

const mockUsers: User[] = [
  { id: 'u1', name: 'Admin', email: 'admin@pdv.com', role: 'administrador', password: '123' },
  { id: 'u2', name: 'Caixa', email: 'caixa@pdv.com', role: 'caixa', password: '123' },
];

const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Simula a geração de uma chave de acesso de 44 dígitos para a NFC-e
const generateNfceAccessKey = () => {
    return Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('');
};

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

  getProducts: async (): Promise<Product[]> => {
    await simulateDelay(500);
    return [...mockProducts];
  },
  
  getSales: async (): Promise<Sale[]> => {
    await simulateDelay(700);
    return [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  
  getCustomers: async (): Promise<Customer[]> => {
    await simulateDelay(400);
    return [...mockCustomers];
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
    await simulateDelay(200);
    return mockProducts.find(p => p.id === id);
  },

  saveProduct: async (product: Omit<Product, 'id'> & { id?: string }): Promise<Product> => {
    await simulateDelay(600);
    if (product.id) {
      const index = mockProducts.findIndex(p => p.id === product.id);
      if (index !== -1) {
        mockProducts[index] = { ...mockProducts[index], ...product } as Product;
        return mockProducts[index];
      }
    }
    const newProduct: Product = { ...(product as Omit<Product, 'id'>), id: `p${Date.now()}` };
    mockProducts.push(newProduct);
    return newProduct;
  },
  
  processSale: async (sale: Omit<Sale, 'id' | 'date'>): Promise<Sale> => {
    await simulateDelay(1000);
    const accessKey = generateNfceAccessKey();
    const newSale: Sale = {
      ...sale,
      id: `s${Date.now()}`,
      date: new Date().toISOString(),
      nfceAccessKey: accessKey,
      nfceQrCodeUrl: `https://www.sefaz.rs.gov.br/nfce/consulta?p=${accessKey}|2|1|1|${btoa(String(sale.totalAmount))}` // URL simplificada
    };

    // Atualiza o estoque
    newSale.items.forEach(item => {
      const productIndex = mockProducts.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        mockProducts[productIndex].stock -= item.quantity;
      }
    });

    mockSales.push(newSale);
    return newSale;
  },

  getSettings: async (): Promise<SystemSettings> => {
    await simulateDelay(300);
    return { ...mockSettings };
  },

  saveSettings: async (settings: SystemSettings): Promise<SystemSettings> => {
    await simulateDelay(500);
    mockSettings = { ...settings };
    return { ...mockSettings };
  },
};