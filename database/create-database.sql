-- =========================================================================
-- 1. BẢNG SẢN PHẨM (Lưu thông tin cố định, không thay đổi)
-- =========================================================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    product_url VARCHAR UNIQUE NOT NULL, -- Dùng Link làm định danh để không bị lưu trùng
    product_name VARCHAR NOT NULL,
    shop_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Thời gian lần đầu phát hiện sản phẩm
);

-- =========================================================================
-- 2. BẢNG LỊCH SỬ GIÁ (Phục vụ Phase 3: Báo động giảm giá)
-- =========================================================================
CREATE TABLE price_history (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE, -- Liên kết với bảng products
    price BIGINT NOT NULL, -- Dùng BIGINT cho tiền VNĐ để không bị tràn số
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Thời gian cào giá
);

-- =========================================================================
-- 3. BẢNG REVIEW (Phục vụ Phase 5: AI tóm tắt đánh giá)
-- =========================================================================
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE, -- Liên kết với bảng products
    author_name VARCHAR(100),
    rating INT CHECK (rating >= 1 AND rating <= 5), -- Sao chỉ được từ 1 đến 5
    content TEXT,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Thời gian cào review
);