-- models/staging/stg_products.sql

WITH source_products AS (
    SELECT * FROM {{ source('bronze', 'products') }}
),

-- 1. Tìm các URL bị trùng lặp
duplicate_urls AS (
    SELECT product_url
    FROM source_products
    GROUP BY product_url
    HAVING COUNT(product_url) > 1
),

-- 2. Xác định chính xác các ID cần loại bỏ (theo logic của bạn)
ids_to_remove AS (
    SELECT p.id
    FROM source_products p
    INNER JOIN duplicate_urls d ON p.product_url = d.product_url
    WHERE p.variant_name = 'Thêm vào so sánh'
)

-- 3. Kết quả cuối cùng: Lấy tất cả trừ các ID rác
SELECT *
FROM source_products
WHERE id NOT IN (SELECT id FROM ids_to_remove)