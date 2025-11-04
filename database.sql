-- Esquema do Banco de Dados para o PDV Inteligente
-- Versão: 1.0
-- Dialeto: SQLite

-- Tabela para as categorias de produtos
CREATE TABLE product_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- Tabela para os produtos
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    cost_price REAL NOT NULL,
    stock INTEGER NOT NULL,
    low_stock_threshold INTEGER NOT NULL,
    category_id TEXT NOT NULL,
    barcode TEXT,
    image_url TEXT,
    ncm TEXT,
    cest TEXT,
    cfop TEXT,
    origin TEXT,
    FOREIGN KEY (category_id) REFERENCES product_categories (id)
);

-- Tabela para os clientes
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cpf_cnpj TEXT,
    email TEXT,
    phone TEXT,
    address TEXT
);

-- Tabela para os usuários do sistema
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('administrador', 'vendedor', 'caixa')),
    password TEXT NOT NULL
);

-- Tabela para as vendas
CREATE TABLE sales (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    total_amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    customer_id TEXT,
    status TEXT NOT NULL CHECK(status IN ('Completed', 'Partially Returned', 'Fully Returned', 'Pending Payment')),
    store_credit_amount_used REAL,
    nfce_access_key TEXT,
    nfce_qr_code_url TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
);

-- Tabela para os itens de uma venda (tabela de junção)
CREATE TABLE sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    returnable_quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
);

-- Tabela para as devoluções
CREATE TABLE returns (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    date TEXT NOT NULL,
    total_amount REAL NOT NULL,
    reason TEXT,
    outcome TEXT NOT NULL CHECK(outcome IN ('Refund', 'Store Credit')),
    operator_name TEXT NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales (id)
);

-- Tabela para os itens de uma devolução
CREATE TABLE return_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    return_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (return_id) REFERENCES returns (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
);

-- Tabela para os vales-crédito
CREATE TABLE store_credits (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    initial_amount REAL NOT NULL,
    balance REAL NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Active', 'Used')),
    FOREIGN KEY (customer_id) REFERENCES customers (id)
);

-- Tabela para as configurações do sistema (pode ter apenas uma linha)
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    company_name TEXT,
    cnpj TEXT,
    address TEXT,
    phone TEXT,
    tax_regime TEXT,
    pix_key TEXT
);

-- Tabela para os fornecedores
CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    contact_person TEXT,
    phone TEXT,
    email TEXT
);

-- Tabela para as contas a pagar
CREATE TABLE accounts_payable (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL,
    supplier_name TEXT,
    description TEXT,
    amount REAL NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Pendente', 'Paga')),
    FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
);

-- Tabela para as entregas
CREATE TABLE deliveries (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    customer_name TEXT,
    address TEXT,
    status TEXT NOT NULL CHECK(status IN ('Pendente', 'Em Trânsito', 'Entregue', 'Cancelada')),
    delivery_person TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales (id)
);

-- Tabela para as sessões de caixa
CREATE TABLE cash_register_sessions (
    id TEXT PRIMARY KEY,
    opening_time TEXT NOT NULL,
    closing_time TEXT,
    opening_balance REAL NOT NULL,
    closing_balance REAL,
    calculated_closing_balance REAL,
    status TEXT NOT NULL CHECK(status IN ('aberto', 'fechado')),
    operator_id TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (operator_id) REFERENCES users (id)
);

-- Tabela para as sangrias (retiradas de caixa)
CREATE TABLE sangrias (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    amount REAL NOT NULL,
    timestamp TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES cash_register_sessions (id)
);

-- Tabela para os pedidos de compra
CREATE TABLE purchase_orders (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Pendente', 'Recebido Parcialmente', 'Recebido')),
    created_at TEXT NOT NULL,
    received_at TEXT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
);

-- Tabela para os itens de um pedido de compra
CREATE TABLE purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER NOT NULL,
    cost_price REAL NOT NULL,
    total_cost REAL NOT NULL,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
);
