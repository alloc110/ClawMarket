DROP SCHEMA IF EXISTS bronze CASCADE;
CREATE SCHEMA IF NOT EXISTS bronze;


CREATE TABLE IF NOT EXISTS bronze.products (
    -- 1. Chuyển sang VARCHAR để chứa được cả số (TGDD) và mã hash (FPT)
    id SERIAL PRIMARY KEY, -- Đây là ID tăng dần bạn muốn    -- 2. Shop name để phân biệt nếu 2 shop trùng ID
    shop_name VARCHAR(100) NOT NULL, 
    
    product_url VARCHAR NOT NULL, 
    product_name VARCHAR NOT NULL,
    variant_name VARCHAR(255) DEFAULT 'Mặc định',
        
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 3. Khóa chính kết hợp: Đảm bảo một mã ID tại một shop là duy nhất
    CONSTRAINT unique_product_identity UNIQUE (shop_name, product_name, variant_name));

-- Bảng lịch sử giá cũng phải đổi theo
CREATE TABLE IF NOT EXISTS bronze.price_history (
    product_id INT REFERENCES bronze.products(id), -- Chỉ dùng ID số (1, 2, 3...)
    price BIGINT,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    -- Liên kết với bảng products
);


DROP SCHEMA IF EXISTS silver CASCADE;
CREATE SCHEMA IF NOT EXISTS silver;

-- =========================================================================
-- 1. BẢNG SẢN PHẨM (Nằm trong schema bronze)
-- =========================================================================
CREATE TABLE IF NOT EXISTS silver.dim_products (
  	product_key SERIAL PRIMARY KEY,
	canonical_name VARCHAR(255), -- Tên chuẩn (VD: iPhone 15)
	brand VARCHAR(100),          -- Tách từ tên (Apple, Samsung)
	category VARCHAR(100),       -- (Mobile, Laptop)
	source_id VARCHAR UNIQUE     -- dat
);

-- =========================================================================
-- 2. BẢNG LỊCH SỬ GIÁ (Nằm trong schema bronze)
-- =========================================================================
CREATE TABLE silver.fact_price_daily (
	product_key INT REFERENCES silver.dim_products(product_key),
	variant_detail VARCHAR(255), -- (Màu sắc, Dung lượng)
	final_price BIGINT,
	is_sale BOOLEAN,
	valid_from TIMESTAMP
);