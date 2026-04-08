{{ config(
    materialized='table',
    schema='silver'
) }}

WITH raw_data AS (
    -- Dùng source để dbt theo dõi lineage
    SELECT * FROM {{ ref('stg_products') }} 
),

cleaned_data AS (
    SELECT
        CAST(id AS INT) AS product_id,
        TRIM(shop_name) AS shop_name,
        
        -- Bước A: Xóa loại hình sản phẩm rác
        TRIM(REGEXP_REPLACE(product_name, '(Máy tính bảng|Laptop|Điện thoại)', '', 'gi')) AS name_step_1,
        
        -- Phân loại dựa trên tên gốc
        CASE 
            WHEN product_name ILIKE 'Máy tính bảng%' THEN 'Tablet'
            WHEN product_name ILIKE 'Laptop%' THEN 'Laptop'
            ELSE 'Phone'
        END AS categories,
        
        variant_name,
        product_url,
        CAST(created_at AS TIMESTAMP) AS created_at_utc
    FROM raw_data
    WHERE shop_name IS NOT NULL 
),

clean_step_2 AS (
    SELECT 
        *,
        -- Bước B: Xóa tiếp chữ "trẻ em" để chuẩn bị lấy Brand
        TRIM(REGEXP_REPLACE(name_step_1, '^(trẻ em)\s*', '', 'gi')) AS cleaned_product_name
    FROM cleaned_data
),

data_table AS (
    SELECT 
        *,
        -- Lấy Brand từ tên đã sạch hoàn toàn (JoyStar thay vì Trẻ)
        REGEXP_SUBSTR(cleaned_product_name, '^[^\s]+') AS brand 
    FROM clean_step_2
),

final_processing AS (
    SELECT 
        *,
        CASE 
            WHEN product_id IN (1486, 1493) THEN 'jobstar'
            WHEN LOWER(brand) IN ('ipad', 'iphone', 'macbook', 'imac') THEN 'apple'
            -- Lấy từ thứ 2 nếu từ đầu là gaming/colorful
            WHEN LOWER(brand) IN ('gaming', 'colorful') 
                THEN LOWER(SPLIT_PART(cleaned_product_name, ' ', 2))
            WHEN LOWER(brand) = 'định' THEN 'masstel'
            ELSE LOWER(brand)
        END AS company 
    FROM data_table 
)

SELECT 
    product_id, 
    shop_name, 
    cleaned_product_name AS product_name, 
    categories, 
    company,
    CASE 
        WHEN variant_name = 'Default Variant' THEN 'default'
        ELSE variant_name
    END AS variant_name,
    product_url, 
    created_at_utc AS created_at 
FROM final_processing 
ORDER BY product_id