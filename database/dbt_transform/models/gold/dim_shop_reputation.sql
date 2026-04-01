{{ config(materialized='table', schema='gold') }}

SELECT 
    p.shop_name,
    -- Đếm số lần thay đổi giá trong 30 ngày qua
    COUNT(CASE WHEN h.price_diff != 0 THEN 1 END) as price_change_count,
    -- Tính mức độ biến động trung bình (%)
      COALESCE(
            AVG(ABS(h.price_diff::float / NULLIF(h.previous_price, 0))) * 100, 0
      )    as volatility_index,    
      CASE 
        WHEN AVG(ABS(h.price_diff::float / NULLIF(h.previous_price, 0))) > 0.2 THEN 'Treo đầu dê bán thịt chó'
        WHEN COUNT(CASE WHEN h.price_diff != 0 THEN 1 END) > 10 THEN 'Giá nhảy múa'
        ELSE 'Uy tín'
    END AS reputation_label
FROM {{ ref('price_history') }} h
JOIN {{ ref('dim_products') }} p ON h.product_id = p.product_id
WHERE h.scraped_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1