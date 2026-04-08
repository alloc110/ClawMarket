-- Model: stg_price_history_cleaned.sql

WITH products AS (
    SELECT * FROM {{ source('raw_market_data', 'products') }}
),

price_history AS (
    SELECT * FROM {{ source('raw_market_data', 'price_history') }}
),

-- Tìm các URL bị trùng lặp
duplicate_product_urls AS (
    SELECT product_url
    FROM products
    GROUP BY product_url
    HAVING COUNT(product_url) > 1
),

-- Xác định các ID cần loại bỏ dựa trên logic của bạn
ids_to_exclude AS (
    SELECT p.id
    FROM products p
    INNER JOIN duplicate_product_urls d ON p.product_url = d.product_url
    WHERE p.variant_name = 'Thêm vào so sánh'
)

-- Lấy tất cả lịch sử giá TRỪ những ID đã xác định ở trên
SELECT 
    ph.*
FROM price_history ph
WHERE ph.product_id NOT IN (SELECT id FROM ids_to_exclude)