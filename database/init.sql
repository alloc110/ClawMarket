DROP SCHEMA IF EXISTS bronze CASCADE;
CREATE SCHEMA IF NOT EXISTS bronze;
DROP SCHEMA IF EXISTS silver CASCADE;
CREATE SCHEMA IF NOT EXISTS silver;
DROP SCHEMA IF EXISTS gold CASCADE;
CREATE SCHEMA IF NOT EXISTS gold;


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


CREATE USER clawsense_viewer WITH PASSWORD 'viewer_secret_123';

-- 2. Cho phép user này kết nối vào database
GRANT CONNECT ON DATABASE clawmarket TO clawsense_viewer;

-- 3. Cho phép user này sử dụng schema "bronze"
GRANT USAGE ON SCHEMA bronze TO clawsense_viewer;

-- 4. QUAN TRỌNG NHẤT: Chỉ cấp quyền SELECT (đọc) trên các bảng
GRANT SELECT ON ALL TABLES IN SCHEMA bronze TO clawsense_viewer;

-- 5. Đảm bảo các bảng tạo mới sau này user này cũng đọc được (tùy chọn)
ALTER DEFAULT PRIVILEGES IN SCHEMA bronze,silver, gold GRANT SELECT ON TABLES TO clawsense_viewer;