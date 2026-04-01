{{ config(materialized='table', schema='gold') }}

WITH price_stats AS (
    SELECT 
        product_id,
        MIN(price) OVER (PARTITION BY product_id) as all_time_low,
        price as current_price,
        scraped_at
    FROM {{ ref('price_history') }}
),
latest_price AS (
    SELECT * FROM price_stats 
    WHERE scraped_at = (SELECT MAX(scraped_at) FROM price_stats)
)

SELECT 
    p.product_name,
    p.shop_name,
    l.current_price,
    l.all_time_low,
    p.product_url
FROM latest_price l
JOIN {{ ref('dim_products') }} p ON l.product_id = p.product_id
WHERE l.current_price <= l.all_time_low 
  AND l.current_price > 0