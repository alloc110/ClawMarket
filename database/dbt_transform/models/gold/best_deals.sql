{{ config(materialized='table', schema='gold') }}

WITH latest_prices AS (
    -- Lấy giá mới nhất của từng sản phẩm
    SELECT DISTINCT ON (product_id) 
        product_id, 
        price, 
        previous_price, 
        price_diff, 
        price_trend,
        scraped_at
    FROM {{ ref('price_history') }}
    ORDER BY product_id, scraped_at DESC
),
product_info AS (
    SELECT * FROM {{ ref('dim_products') }}
)

SELECT 
    p.product_name,
    p.shop_name,
    l.price AS current_price,
    l.previous_price,
    l.price_diff,
    -- Tính % giảm giá để Bot biết kèo nào "thơm" nhất
    ROUND((l.price_diff::float / NULLIF(l.previous_price, 0))::numeric * 100, 2) AS discount_percent,
    p.product_url
FROM latest_prices l
JOIN product_info p ON l.product_id = p.product_id
WHERE l.price_trend = 'Giảm' 
  AND l.price > 0
ORDER BY discount_percent ASC -- Giảm sâu nhất lên đầu