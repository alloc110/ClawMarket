{{ config(
    materialized='table',
    schema='silver'
) }}

WITH base AS (
    SELECT 
        product_id,
        price,
        scraped_at,
        CAST(scraped_at AS DATE) AS price_date
    FROM {{ ref('stg_price_history') }}
    WHERE price > 0 and price IS NOT NULL
),

enriched AS (
    SELECT 
        *,
        -- Lấy giá của lần crawl ngay trước đó của chính sản phẩm này
        LAG(price) OVER (PARTITION BY product_id ORDER BY scraped_at) AS previous_price,
        
        -- Tính mức chênh lệch
        price - LAG(price) OVER (PARTITION BY product_id ORDER BY scraped_at) AS price_diff
    FROM base
)

SELECT 
    *,
    CASE 
        WHEN price_diff > 0 THEN 'Tăng'
        WHEN price_diff < 0 THEN 'Giảm'
        ELSE 'Không đổi'
    END AS price_trend
FROM enriched