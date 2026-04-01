import * as redis from 'redis';
import pool from './db.js'; // Lưu ý: BẮT BUỘC phải có đuôi .js

const redisClient = redis.createClient({ url: 'redis://redis:6379' });

async function startWorker() {
    await redisClient.connect();
    console.log("👷 Worker đã sẵn sàng trực chiến...");

    while (true) {
        let batch = [];
        const BATCH_SIZE = 50;

        // Lấy tối đa 50 item từ Redis
        for (let i = 0; i < BATCH_SIZE; i++) {
            const rawData = await redisClient.rPop('scraper_queue');
            if (rawData) {
                batch.push(JSON.parse(rawData));
            } else {
                break;
            }
        }

        if (batch.length > 0) {
            console.log(`🚛 Đang vận chuyển lô ${batch.length} máy sang Postgres...`);
            await insertBatchToPostgres(batch);
        } else {
            // Nếu Redis trống, nghỉ 5 giây rồi kiểm tra lại
            await new Promise(res => setTimeout(res, 5000));
        }
    }
}


async function insertBatchToPostgres(products) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const p of products) {
            // Insert Products
            const res = await client.query(`
                INSERT INTO bronze.products (shop_name, product_name, variant_name, product_url)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (shop_name, product_name, variant_name) 
                DO UPDATE SET product_url = EXCLUDED.product_url -- Cập nhật lại link nếu cần
                RETURNING id;
            `, [p.shop_name, p.name, p.v_name, p.link]);
            const idTangDan = res.rows[0].id;
            // Insert Price History
            await client.query(
               'INSERT INTO bronze.price_history (product_id, price) VALUES ($1, $2)',
                [idTangDan, p.price]);
        }
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Lỗi khi lưu lô hàng:", e.message);
    } finally {
        client.release();
    }
}


startWorker();