/**
 * MySQL schema definitions — tables are created on startup if they don't exist.
 * Images are stored as file paths / URLs (Cloudinary or local disk).
 */

const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id          CHAR(36)     NOT NULL DEFAULT (UUID()),
    name        VARCHAR(80)  NOT NULL,
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('customer','restaurant_owner','admin') NOT NULL DEFAULT 'customer',
    address     VARCHAR(500) NOT NULL,
    verified    TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    INDEX idx_users_role (role)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const CREATE_RESTAURANTS_TABLE = `
  CREATE TABLE IF NOT EXISTS restaurants (
    id          CHAR(36)     NOT NULL DEFAULT (UUID()),
    owner_id    CHAR(36)     NOT NULL,
    name        VARCHAR(120) NOT NULL,
    category    VARCHAR(60)  NOT NULL,
    location    VARCHAR(255) NOT NULL,
    image_url   VARCHAR(1024)         DEFAULT NULL,
    is_verified TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_restaurants_owner_id (owner_id),
    INDEX idx_restaurants_category (category),
    INDEX idx_restaurants_location (location),
    CONSTRAINT fk_restaurants_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const CREATE_MENU_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS menu_items (
    id            CHAR(36)      NOT NULL DEFAULT (UUID()),
    restaurant_id CHAR(36)      NOT NULL,
    item_name     VARCHAR(120)  NOT NULL,
    price         DECIMAL(10,2) NOT NULL,
    image_url     VARCHAR(1024)          DEFAULT NULL,
    availability  TINYINT(1)    NOT NULL DEFAULT 1,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_menu_items_restaurant_id (restaurant_id),
    INDEX idx_menu_items_availability (availability),
    INDEX idx_menu_items_restaurant_availability (restaurant_id, availability),
    CONSTRAINT fk_menu_items_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const CREATE_ORDERS_TABLE = `
  CREATE TABLE IF NOT EXISTS orders (
    id             CHAR(36)      NOT NULL DEFAULT (UUID()),
    customer_id    CHAR(36)      NOT NULL,
    restaurant_id  CHAR(36)      NOT NULL,
    items          JSON          NOT NULL,
    total_price    DECIMAL(10,2) NOT NULL,
    status         ENUM('Received','Preparing','Ready','Delivered') NOT NULL DEFAULT 'Received',
    payment_status ENUM('Pending','Paid','Failed')                  NOT NULL DEFAULT 'Pending',
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_orders_customer_id (customer_id),
    INDEX idx_orders_restaurant_id (restaurant_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_payment_status (payment_status),
    INDEX idx_orders_restaurant_status (restaurant_id, status),
    CONSTRAINT fk_orders_customer    FOREIGN KEY (customer_id)   REFERENCES users (id)        ON DELETE CASCADE,
    CONSTRAINT fk_orders_restaurant  FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)  ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const ALL_TABLES = [
  CREATE_USERS_TABLE,
  CREATE_RESTAURANTS_TABLE,
  CREATE_MENU_ITEMS_TABLE,
  CREATE_ORDERS_TABLE,
];

module.exports = { ALL_TABLES };
