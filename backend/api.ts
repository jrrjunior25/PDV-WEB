import { Product, Sale, Customer, SystemSettings, User, ProductCategory, Supplier, AccountPayable, Delivery, CashRegisterSession, Sangria, Return, StoreCredit, ReturnItem, PurchaseOrder, PurchaseOrderItem, SaleItem } from './shared/types';

// Interface para os dados extraídos do XML da NF-e para importação.
interface NfeImportData {
  supplier: {
    cnpj: string;
    name: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    costPrice: number;
    barcode: string;
    ncm: string;
    cfop: string;
    description: string;
    price: number;
    stock: number;
    lowStockThreshold: number;
    categoryId: string;
    imageUrl: string;
    origin: string;
    cest: string;
    existingProductId?: string; 
    status: 'new' | 'match';
  }>;
  totalAmount: number;
}

import db from './database.js';

// This function encapsulates the entire mock database and API logic,
// preventing mutable global state at the module level.
const createMockApi = () => {
  // --- MOCK DATABASE ---
  let mockProductCategories: ProductCategory[] = [
    { id: 'cat1', name: 'Cafés' },
    { id: 'cat2', name: 'Eletrônicos' },
    { id: 'cat3', name: 'Livros' },
    { id: 'cat4', name: 'Utilidades' },
  ];

  let mockProducts: Product[] = [
    { id: 'p1', name: 'Café Especial Grão 250g', description: 'Café arábica de alta qualidade, torra média.', price: 25.50, costPrice: 15.00, stock: 50, lowStockThreshold: 10, categoryId: 'cat1', barcode: '789000000001', imageUrl: 'https://picsum.photos/seed/coffee/400/400', ncm: '0901.21.00', cest: '17.099.00', cfop: '5102', origin: 'Nacional' },
    { id: 'p2', name: 'Notebook Pro X1', description: 'Processador i7, 16GB RAM, 512GB SSD.', price: 7500.00, costPrice: 5800.00, stock: 8, lowStockThreshold: 5, categoryId: 'cat2', barcode: '789000000002', imageUrl: 'https://picsum.photos/seed/laptop/400/400', ncm: '8471.30.19', cest: '21.031.00', cfop: '5102', origin: 'Estrangeira' },
    { id: 'p3', name: 'Livro: A Arte da Programação', description: 'Um clássico da ciência da computação.', price: 120.00, costPrice: 70.00, stock: 15, lowStockThreshold: 5, categoryId: 'cat3', barcode: '789000000003', imageUrl: 'https://picsum.photos/seed/book/400/400', ncm: '4901.99.00', cest: '', cfop: '5102', origin: 'Nacional' },
    { id: 'p4', name: 'Mouse Sem Fio Ergonômico', description: 'Conforto e precisão para o dia a dia.', price: 150.00, costPrice: 95.00, stock: 3, lowStockThreshold: 10, categoryId: 'cat2', barcode: '789000000004', imageUrl: 'https://picsum.photos/seed/mouse/400/400', ncm: '8471.60.53', cest: '21.036.00', cfop: '5102', origin: 'Estrangeira' },
    { id: 'p5', name: 'Teclado Mecânico RGB', description: 'Switches blue para uma digitação precisa.', price: 350.00, costPrice: 210.00, stock: 20, lowStockThreshold: 8, categoryId: 'cat2', barcode: '789000000005', imageUrl: 'https://picsum.photos/seed/keyboard/400/400', ncm: '8471.60.52', cest: '21.035.00', cfop: '5102', origin: 'Estrangeira' },
    { id: 'p6', name: 'Garrafa Térmica Inox 1L', description: 'Mantém sua bebida quente por até 12 horas.', price: 89.90, costPrice: 45.00, stock: 40, lowStockThreshold: 15, categoryId: 'cat4', barcode: '789000000006', imageUrl: 'https://picsum.photos/seed/bottle/400/400', ncm: '9617.00.10', cest: '28.029.00', cfop: '5102', origin: 'Nacional' },
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

  let mockPurchaseOrders: PurchaseOrder[] = [
      { id: 'po1', supplierId: 'sup1', supplierName: 'Distribuidora de Eletrônicos Alpha', items: [ { productId: 'p5', productName: 'Teclado Mecânico RGB', quantityOrdered: 10, quantityReceived: 0, costPrice: 210.00, totalCost: 2100.00 } ], totalAmount: 2100.00, status: 'Pendente', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
      { id: 'po2', supplierId: 'sup2', supplierName: 'Café Sol Nascente Fazendas', items: [ { productId: 'p1', productName: 'Café Especial Grão 250g', quantityOrdered: 50, quantityReceived: 50, costPrice: 15.00, totalCost: 750.00 } ], totalAmount: 750.00, status: 'Recebido', createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), receivedAt: new Date(Date.now() - 86400000 * 8).toISOString() }
  ];


  let mockSettings: SystemSettings = {
      companyName: 'JR INFORMATICA LTDA',
      cnpj: '00.000.000/0001-00',
      address: 'Rua Exemplo, 123 - Centro, São Paulo - SP',
      phone: '(11) 5555-4444',
      taxRegime: 'Simples Nacional',
      pixKey: '001.586.775-79',
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

  const apiObject = {
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
    getProducts: (): Promise<Product[]> => {
      return new Promise((resolve, reject) => {
        db.all("SELECT * FROM products", [], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as Product[]);
          }
        });
      });
    },
    getProductById: (id: string): Promise<Product | undefined> => {
      return new Promise((resolve, reject) => {
        db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row as Product | undefined);
          }
        });
      });
    },
    saveProduct: (product: Omit<Product, 'id'> & { id?: string }): Promise<Product> => {
      return new Promise((resolve, reject) => {
        if (product.id) {
          const { id, ...rest } = product;
          const fields = Object.keys(rest).map(k => `${k} = ?`).join(', ');
          const values = Object.values(rest);
          db.run(`UPDATE products SET ${fields} WHERE id = ?`, [...values, id], function (err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...product } as Product);
            }
          });
        } else {
          const newProduct: Product = { ...(product as Omit<Product, 'id'>), id: `p${Date.now()}` };
          const { id, ...rest } = newProduct;
          const fields = Object.keys(rest).join(', ');
          const placeholders = Object.keys(rest).map(() => '?').join(', ');
          const values = Object.values(rest);
          db.run(`INSERT INTO products (id, ${fields}) VALUES (?, ${placeholders})`, [id, ...values], function (err) {
            if (err) {
              reject(err);
            } else {
              resolve(newProduct);
            }
          });
        }
      });
    },
    updateProductStock: (productId: string, newStock: number): Promise<Product> => {
      return new Promise((resolve, reject) => {
        db.run("UPDATE products SET stock = ? WHERE id = ?", [newStock, productId], function (err) {
          if (err) {
            reject(err);
          } else {
            db.get("SELECT * FROM products WHERE id = ?", [productId], (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row as Product);
              }
            });
          }
        });
      });
    },

    // Categories
    getProductCategories: (): Promise<ProductCategory[]> => {
      return new Promise((resolve, reject) => {
        db.all("SELECT * FROM product_categories", [], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as ProductCategory[]);
          }
        });
      });
    },
    saveProductCategory: (category: Omit<ProductCategory, 'id'> & { id?: string }): Promise<ProductCategory> => {
      return new Promise((resolve, reject) => {
        if (category.id) {
          db.run("UPDATE product_categories SET name = ? WHERE id = ?", [category.name, category.id], function (err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...category } as ProductCategory);
            }
          });
        } else {
          const newCategory = { ...category, id: `cat${Date.now()}` } as ProductCategory;
          db.run("INSERT INTO product_categories (id, name) VALUES (?, ?)", [newCategory.id, newCategory.name], function (err) {
            if (err) {
              reject(err);
            } else {
              resolve(newCategory);
            }
          });
        }
      });
    },

    // Sales
    getSales: (): Promise<Sale[]> => {
      return new Promise((resolve, reject) => {
        db.all("SELECT * FROM sales ORDER BY date DESC", [], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const sales = rows as Sale[];
            const promises = sales.map(sale => {
              return new Promise<void>((resolve, reject) => {
                db.all("SELECT * FROM sale_items WHERE sale_id = ?", [sale.id], (err, items) => {
                  if (err) {
                    reject(err);
                  } else {
                    sale.items = items as SaleItem[];
                    resolve();
                  }
                });
              });
            });
            Promise.all(promises).then(() => resolve(sales));
          }
        });
      });
    },
    
    processSale: (
        sale: Omit<Sale, 'id' | 'date' | 'status' | 'items' | 'storeCreditAmountUsed'> & { items: Omit<Sale['items'][0], 'returnableQuantity'>[] },
        storeCreditPayment?: { creditIds: string[], amount: number }
    ): Promise<Sale> => {
        return new Promise((resolve, reject) => {
            if (storeCreditPayment && storeCreditPayment.amount > 0) {
                let amountToDeduct = storeCreditPayment.amount;
                for (const creditId of storeCreditPayment.creditIds) {
                    if (amountToDeduct <= 0) break;
                    db.get("SELECT * FROM store_credits WHERE id = ? AND status = 'Active'", [creditId], (err, credit: StoreCredit) => {
                        if (credit) {
                            const deduction = Math.min(credit.balance, amountToDeduct);
                            const newBalance = credit.balance - deduction;
                            amountToDeduct -= deduction;
                            const newStatus = newBalance <= 0 ? 'Used' : 'Active';
                            db.run("UPDATE store_credits SET balance = ?, status = ? WHERE id = ?", [newBalance, newStatus, creditId]);
                        }
                    });
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

            db.serialize(() => {
                db.run("INSERT INTO sales (id, date, total_amount, payment_method, customer_id, status) VALUES (?, ?, ?, ?, ?, ?)",
                    [newSale.id, newSale.date, newSale.totalAmount, newSale.paymentMethod, newSale.customerId, newSale.status],
                    function (err) {
                        if (err) reject(err);
                    }
                );

                const stmt = db.prepare("INSERT INTO sale_items (sale_id, product_id, product_name, quantity, returnable_quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)");
                newSale.items.forEach(item => {
                    stmt.run(newSale.id, item.productId, item.productName, item.quantity, item.returnableQuantity, item.unitPrice, item.totalPrice);
                    db.run("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.productId]);
                });
                stmt.finalize();

                resolve(newSale);
            });
        });
    },

    createDeliveryForSale: (saleId: string, customerName: string, address: string): Promise<Delivery> => {
        return new Promise((resolve, reject) => {
            const newDelivery: Delivery = {
                id: `d${Date.now()}`,
                saleId: saleId,
                customerName: customerName,
                address: address,
                status: 'Pendente',
                createdAt: new Date().toISOString(),
            };

            db.run("INSERT INTO deliveries (id, sale_id, customer_name, address, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                [newDelivery.id, newDelivery.saleId, newDelivery.customerName, newDelivery.address, newDelivery.status, newDelivery.createdAt],
                function (err) {
                    if (err) reject(err);
                    db.run("UPDATE sales SET delivery_id = ? WHERE id = ?", [newDelivery.id, saleId]);
                    resolve(newDelivery);
                }
            );
        });
    },

    // Customers
    getCustomers: (): Promise<Customer[]> => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM customers", [], (err, rows) => {
                if (err) reject(err);
                resolve(rows as Customer[]);
            });
        });
    },
    getCustomerByCpf: (cpf: string): Promise<Customer | null> => {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM customers WHERE cpf_cnpj = ?", [cpf], (err, row) => {
                if (err) reject(err);
                resolve(row as Customer | null);
            });
        });
    },
    saveCustomer: (customer: Omit<Customer, 'id'> & { id?: string }): Promise<Customer> => {
        return new Promise((resolve, reject) => {
            if (customer.id) {
                db.run("UPDATE customers SET name = ?, cpf_cnpj = ?, email = ?, phone = ?, address = ? WHERE id = ?",
                    [customer.name, customer.cpfCnpj, customer.email, customer.phone, customer.address, customer.id],
                    function (err) {
                        if (err) reject(err);
                        resolve({ ...customer } as Customer);
                    }
                );
            } else {
                const newCustomer = { ...customer, id: `c${Date.now()}` } as Customer;
                db.run("INSERT INTO customers (id, name, cpf_cnpj, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)",
                    [newCustomer.id, newCustomer.name, newCustomer.cpfCnpj, newCustomer.email, newCustomer.phone, newCustomer.address],
                    function (err) {
                        if (err) reject(err);
                        resolve(newCustomer);
                    }
                );
            }
        });
    },

    // Settings
    getSettings: (): Promise<SystemSettings> => {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM system_settings WHERE id = 1", [], (err, row) => {
                if (err) reject(err);
                resolve(row as SystemSettings);
            });
        });
    },
    saveSettings: (settings: SystemSettings): Promise<SystemSettings> => {
        return new Promise((resolve, reject) => {
            db.run("UPDATE system_settings SET company_name = ?, cnpj = ?, address = ?, phone = ?, tax_regime = ?, pix_key = ? WHERE id = 1",
                [settings.companyName, settings.cnpj, settings.address, settings.phone, settings.taxRegime, settings.pixKey],
                function (err) {
                    if (err) reject(err);
                    resolve(settings);
                }
            );
        });
    },

    // Suppliers
    getSuppliers: (): Promise<Supplier[]> => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM suppliers", [], (err, rows) => {
                if (err) reject(err);
                resolve(rows as Supplier[]);
            });
        });
    },
    saveSupplier: (supplier: Omit<Supplier, 'id'> & { id?: string }): Promise<Supplier> => {
        return new Promise((resolve, reject) => {
            if (supplier.id) {
                db.run("UPDATE suppliers SET name = ?, cnpj = ?, contact_person = ?, phone = ?, email = ? WHERE id = ?",
                    [supplier.name, supplier.cnpj, supplier.contactPerson, supplier.phone, supplier.email, supplier.id],
                    function (err) {
                        if (err) reject(err);
                        resolve({ ...supplier } as Supplier);
                    }
                );
            } else {
                const newSupplier = { ...supplier, id: `sup${Date.now()}` } as Supplier;
                db.run("INSERT INTO suppliers (id, name, cnpj, contact_person, phone, email) VALUES (?, ?, ?, ?, ?, ?)",
                    [newSupplier.id, newSupplier.name, newSupplier.cnpj, newSupplier.contactPerson, newSupplier.phone, newSupplier.email],
                    function (err) {
                        if (err) reject(err);
                        resolve(newSupplier);
                    }
                );
            }
        });
    },

    // Accounts Payable
    getAccountsPayable: (): Promise<AccountPayable[]> => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM accounts_payable ORDER BY due_date ASC", [], (err, rows) => {
                if (err) reject(err);
                resolve(rows as AccountPayable[]);
            });
        });
    },
    saveAccountPayable: (account: Omit<AccountPayable, 'id' | 'supplierName'> & { id?: string }): Promise<AccountPayable> => {
        return new Promise((resolve, reject) => {
            db.get("SELECT name FROM suppliers WHERE id = ?", [account.supplierId], (err, supplier: Supplier) => {
                if (err) reject(err);
                const newAccount = { ...account, id: `ap${Date.now()}`, supplierName: supplier.name } as AccountPayable;
                db.run("INSERT INTO accounts_payable (id, supplier_id, supplier_name, description, amount, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [newAccount.id, newAccount.supplierId, newAccount.supplierName, newAccount.description, newAccount.amount, newAccount.dueDate, 'Pendente'],
                    function (err) {
                        if (err) reject(err);
                        resolve(newAccount);
                    }
                );
            });
        });
    },
    updateAccountPayableStatus: (id: string, status: 'Pendente' | 'Paga'): Promise<AccountPayable> => {
        return new Promise((resolve, reject) => {
            db.run("UPDATE accounts_payable SET status = ? WHERE id = ?", [status, id], function (err) {
                if (err) reject(err);
                db.get("SELECT * FROM accounts_payable WHERE id = ?", [id], (err, row) => {
                    if (err) reject(err);
                    resolve(row as AccountPayable);
                });
            });
        });
    },

    // Deliveries
    getDeliveries: (): Promise<Delivery[]> => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM deliveries ORDER BY created_at DESC", [], (err, rows) => {
                if (err) reject(err);
                resolve(rows as Delivery[]);
            });
        });
    },
    updateDeliveryStatus: (id: string, status: Delivery['status']): Promise<Delivery> => {
        return new Promise((resolve, reject) => {
            db.run("UPDATE deliveries SET status = ? WHERE id = ?", [status, id], function (err) {
                if (err) reject(err);
                db.get("SELECT * FROM deliveries WHERE id = ?", [id], (err, row) => {
                    if (err) reject(err);
                    resolve(row as Delivery);
                });
            });
        });
    },
    
    // Cash Register
    getCurrentCashRegisterSession: (): Promise<CashRegisterSession | null> => {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM cash_register_sessions WHERE status = 'aberto'", [], (err, row) => {
                if (err) reject(err);
                resolve(row as CashRegisterSession | null);
            });
        });
    },
    openCashRegister: (openingBalance: number, operatorId: string, operatorName: string): Promise<CashRegisterSession> => {
        return new Promise((resolve, reject) => {
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
            db.run("INSERT INTO cash_register_sessions (id, opening_time, opening_balance, operator_id, operator_name, status) VALUES (?, ?, ?, ?, ?, ?)",
                [newSession.id, newSession.openingTime, newSession.openingBalance, newSession.operatorId, newSession.operatorName, newSession.status],
                function (err) {
                    if (err) reject(err);
                    resolve(newSession);
                }
            );
        });
    },
    recordSangria: (sessionId: string, amount: number, operatorName: string): Promise<Sangria> => {
        return new Promise((resolve, reject) => {
            const newSangria: Sangria = {
                id: `sg${Date.now()}`,
                sessionId,
                amount,
                timestamp: new Date().toISOString(),
                operatorName,
            };
            db.run("INSERT INTO sangrias (id, session_id, amount, timestamp, operator_name) VALUES (?, ?, ?, ?, ?)",
                [newSangria.id, newSangria.sessionId, newSangria.amount, newSangria.timestamp, newSangria.operatorName],
                function (err) {
                    if (err) reject(err);
                    resolve(newSangria);
                }
            );
        });
    },
    closeCashRegister: (sessionId: string, closingBalance: number, notes: string): Promise<CashRegisterSession> => {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM cash_register_sessions WHERE id = ?", [sessionId], (err, session: CashRegisterSession) => {
                if (err) reject(err);

                db.all("SELECT * FROM sales WHERE date >= ?", [session.openingTime], (err, salesInSession: Sale[]) => {
                    if (err) reject(err);

                    const salesSummary: { [key in Sale['paymentMethod']]?: number } = {};
                    let totalStoreCreditUsedInSession = 0;

                    salesInSession.forEach(sale => {
                        if (sale.storeCreditAmountUsed) {
                            totalStoreCreditUsedInSession += sale.storeCreditAmountUsed;
                        }

                        const amountForPaymentMethod = sale.totalAmount - (sale.storeCreditAmountUsed || 0);

                        if (amountForPaymentMethod > 0.009) {
                            salesSummary[sale.paymentMethod] = (salesSummary[sale.paymentMethod] || 0) + amountForPaymentMethod;
                        } else if (sale.paymentMethod === 'Troca / Vale-Crédito') {
                            salesSummary[sale.paymentMethod] = (salesSummary[sale.paymentMethod] || 0) + sale.totalAmount;
                        }
                    });

                    db.get("SELECT SUM(amount) as totalSangrias FROM sangrias WHERE session_id = ?", [sessionId], (err, result: any) => {
                        const totalSangrias = result.totalSangrias || 0;
                        const cashIn = salesSummary['Dinheiro'] || 0;
                        let calculatedClosingBalance = session.openingBalance + cashIn - totalSangrias;

                        if (isNaN(calculatedClosingBalance)) {
                            calculatedClosingBalance = 0;
                        }

                        db.run("UPDATE cash_register_sessions SET closing_time = ?, closing_balance = ?, calculated_closing_balance = ?, sales_summary = ?, total_sangrias = ?, total_store_credit_used = ?, notes = ?, status = 'fechado' WHERE id = ?",
                            [new Date().toISOString(), closingBalance, calculatedClosingBalance, JSON.stringify(salesSummary), totalSangrias, totalStoreCreditUsedInSession, notes, sessionId],
                            function (err) {
                                if (err) reject(err);
                                resolve({ ...session, status: 'fechado' } as CashRegisterSession);
                            }
                        );
                    });
                });
            });
        });
    },
    getCashRegisterSessions: (): Promise<CashRegisterSession[]> => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM cash_register_sessions ORDER BY opening_time DESC", [], (err, rows) => {
                if (err) reject(err);
                resolve(rows as CashRegisterSession[]);
            });
        });
    },

    // Returns & Store Credits
    getReturns: (): Promise<Return[]> => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM returns ORDER BY date DESC", [], (err, rows) => {
                if (err) reject(err);
                resolve(rows as Return[]);
            });
        });
    },
    getStoreCredits: (): Promise<StoreCredit[]> => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM store_credits", [], (err, rows) => {
                if (err) reject(err);
                resolve(rows as StoreCredit[]);
            });
        });
    },
    processReturn: (saleId: string, itemsToReturn: ReturnItem[], reason: string, outcome: 'Refund' | 'Store Credit', operatorName: string): Promise<Return> => {
        return new Promise((resolve, reject) => {
            const newReturn: Return = {
                id: `ret${Date.now()}`,
                saleId,
                date: new Date().toISOString(),
                items: itemsToReturn,
                totalAmount: itemsToReturn.reduce((acc, item) => acc + item.totalPrice, 0),
                reason,
                outcome,
                operatorName,
            };
            db.run("INSERT INTO returns (id, sale_id, date, total_amount, reason, outcome, operator_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [newReturn.id, newReturn.saleId, newReturn.date, newReturn.totalAmount, newReturn.reason, newReturn.outcome, newReturn.operatorName],
                function (err) {
                    if (err) reject(err);
                    resolve(newReturn);
                }
            );
        });
    },

    // Purchase Orders
    getPurchaseOrders: (): Promise<PurchaseOrder[]> => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM purchase_orders ORDER BY created_at DESC", [], (err, rows) => {
                if (err) reject(err);
                resolve(rows as PurchaseOrder[]);
            });
        });
    },
    savePurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status'> & { id?: string }): Promise<PurchaseOrder> => {
        return new Promise((resolve, reject) => {
            const newPO: PurchaseOrder = {
                ...(po as Omit<PurchaseOrder, 'id'>),
                id: `po${Date.now()}`,
                createdAt: new Date().toISOString(),
                status: 'Pendente',
            };
            db.run("INSERT INTO purchase_orders (id, supplier_id, total_amount, status, created_at) VALUES (?, ?, ?, ?, ?)",
                [newPO.id, newPO.supplierId, newPO.totalAmount, newPO.status, newPO.createdAt],
                function (err) {
                    if (err) reject(err);
                    resolve(newPO);
                }
            );
        });
    },
    receiveStock: (poId: string, itemsReceived: { [productId: string]: number }): Promise<PurchaseOrder> => {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM purchase_orders WHERE id = ?", [poId], (err, po: PurchaseOrder) => {
                if (err) reject(err);

                let totalReceivedValue = 0;

                Object.entries(itemsReceived).forEach(([productId, quantity]) => {
                    db.get("SELECT * FROM purchase_order_items WHERE purchase_order_id = ? AND product_id = ?", [poId, productId], (err, item: PurchaseOrderItem) => {
                        if (item && quantity > 0) {
                            const actualQuantityReceived = Math.min(quantity, item.quantityOrdered - item.quantityReceived);
                            db.run("UPDATE purchase_order_items SET quantity_received = quantity_received + ? WHERE id = ?", [actualQuantityReceived, item.id]);
                            totalReceivedValue += actualQuantityReceived * item.costPrice;
                            db.run("UPDATE products SET stock = stock + ? WHERE id = ?", [actualQuantityReceived, productId]);
                        }
                    });
                });

                db.all("SELECT * FROM purchase_order_items WHERE purchase_order_id = ?", [poId], (err, items: PurchaseOrderItem[]) => {
                    const totalOrdered = items.reduce((acc, item) => acc + item.quantityOrdered, 0);
                    const totalReceived = items.reduce((acc, item) => acc + item.quantityReceived, 0);

                    let newStatus = po.status;
                    if (totalReceived >= totalOrdered) {
                        newStatus = 'Recebido';
                    } else if (totalReceived > 0) {
                        newStatus = 'Recebido Parcialmente';
                    }

                    db.run("UPDATE purchase_orders SET status = ? WHERE id = ?", [newStatus, poId]);

                    if (totalReceivedValue > 0) {
                        const newAccountPayable: AccountPayable = {
                            id: `ap${Date.now()}`,
                            supplierId: po.supplierId,
                            supplierName: po.supplierName,
                            description: `Recebimento de mercadoria do Pedido #${po.id.substring(0, 8)}`,
                            amount: totalReceivedValue,
                            dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
                            status: 'Pendente',
                        };
                        db.run("INSERT INTO accounts_payable (id, supplier_id, description, amount, due_date, status) VALUES (?, ?, ?, ?, ?, ?)",
                            [newAccountPayable.id, newAccountPayable.supplierId, newAccountPayable.description, newAccountPayable.amount, newAccountPayable.dueDate, newAccountPayable.status]
                        );
                    }

                    resolve({ ...po, status: newStatus });
                });
            });
        });
    },

    processNfeXmlImport: (importData: NfeImportData): Promise<{ success: boolean }> => {
        return new Promise((resolve, reject) => {
            // Your logic to import NFE XML data here
            resolve({ success: true });
        });
    },
  };

  return apiObject;
};

// Export a single, encapsulated instance of the mock API.
export const api = createMockApi();