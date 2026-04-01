import { chromium } from "playwright";
import { createClient } from "redis";
import cron from 'node-cron';

const redisClient = createClient({ url: 'redis://redis:6379' });
await redisClient.connect();
cron.schedule('*/20 * * * *', () => {

    (async () => {

    const browser = await chromium.launch({ headless: true });

    const page = await browser.newPage();

    const pages = [ 'mobile', 'laptop'];   

    for (const p of pages) {
        await page.goto(`https://cellphones.com.vn/${p}.html`);
        console.log(`🚀 Đang truy cập: ${p}`);
        await page.waitForTimeout(2000);

        const productslist = '.product-info-container.product-item'; 
        await page.waitForSelector(productslist, { timeout: 1000 });
        const btnSelector = 'a.button__show-more-product';


        let clickCount = 0;
        const maxClicks = 55;  //55

        // Bấm nút "Xem thêm" cho đến khi không còn hoặc đã bấm đủ số lần
        while (clickCount < maxClicks) {
        const btn = page.locator(btnSelector);
        
        if (await btn.isVisible()) {
            console.log(`🖱️  Đang bấm nút 'Xem thêm' lần ${clickCount + 1}...`);
            await btn.scrollIntoViewIfNeeded();
            await btn.click({ force: true }); 
            
            await page.waitForTimeout(5000); 
            
            clickCount++;
        } else {
            console.log("✅ Đã mở hết tất cả bình luận hoặc không còn nút 'Xem thêm'!");
            break; 
        } 
        }
        

        const countProducts = await page.locator(productslist).count();
        for(let i = 0; i < countProducts; i++) {
            // 1. Ép trình duyệt cuộn tới máy này (Tránh lỗi Lazy Load)
            try {
                const product = page.locator(productslist).nth(i);
                await product.scrollIntoViewIfNeeded();

                const name = await product.locator('.product__name h3').innerText();
                const link = await product.locator('a.product__link').getAttribute('href');
    
            // 2. Lấy ID từ URL (Vô cùng ổn định)

                const priceText = await product.locator('.product__price--show').innerText();
                const price = parseInt(priceText.replace(/\D/g, ''), 10);

                const badges = await product.locator('.product__badge .product__more-info__item').allInnerTexts();
                const variant_name = badges.join(' | '); // VD: "6.9 inches | 256 GB"
                const v_name = variant_name || "Default Variant";
                const data = {
                    shop_name: 'CELLPHONES',
                    name: name.trim(),
                    link: link,
                    v_name: v_name,
                    price: price
                };

                // console.log("📱 CellphoneS:", data);
        
                await redisClient.lPush('scraper_queue', JSON.stringify(data));
            } catch (e) {   
            console.log("❌ Lỗi khi xử lý sản phẩm thứ " + (i+1) + " trên trang " + p + ": ", e.message);
            continue;
            }        
        }
    }
    await browser.close(); 
    // await redisClient.quit();
    console.log(`👋 Đã đóng trình duyệt, kết thúc an toàn!!!`);

    })();

});
