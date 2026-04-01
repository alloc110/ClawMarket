import { chromium } from "playwright";
import { createClient } from "redis";
import cron from 'node-cron';

const redisClient = createClient({ url: 'redis://redis:6379' });
await redisClient.connect();
cron.schedule('*/20 * * * *', () => {

    (async () => {

    const browser = await chromium.launch({ headless: true });

    const page = await browser.newPage();

    const pages = ['dtdd' ,  'laptop','may-tinh-bang' ];

    for (const p of pages) {
        await page.goto(`https://www.thegioididong.com/${p}`);
        console.log(`🚀 Đang truy cập: ${p}`);
        await page.waitForTimeout(2000);

        const productslist = '.listproduct li'; 
        await page.waitForSelector(productslist, { timeout: 1000 });
        const btnSelector = '.view-more';


        let clickCount = 0;
        const maxClicks = 20; 

        // Bấm nút "Xem thêm" cho đến khi không còn hoặc đã bấm đủ số lần
        while (clickCount < maxClicks) {
        const btn = page.locator(btnSelector);
        
        if (await btn.isVisible()) {
            console.log(`🖱️  Đang bấm nút 'Xem thêm' lần ${clickCount + 1}...`);
            
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
                const aTag = product.locator('a.main-contain');
                if (await aTag.count() === 0) continue;

                const nameRaw = await aTag.getAttribute('data-name');
                const priceRaw = await aTag.getAttribute('data-price');
                const data_id = await aTag.getAttribute('data-id');
                const href = await aTag.getAttribute('href');
                const linkDefault = "https://www.thegioididong.com" + href;

                // Regex tách tên và cấu hình
                const configRegex = /\s+\d+(?:GB|TB)(?:\/\d+(?:GB|TB))?$/i;
                let cleanName = nameRaw.replace(configRegex, "").trim();
                let v_name_main = nameRaw.match(configRegex) ? nameRaw.match(configRegex)[0].trim() : "Default Variant";

                // 2. Lấy danh sách Variant (Chỉ đọc thẻ, tuyệt đối KHÔNG CLICK)
                const variantNodes = await product.locator('.prods-group li.merge__item').all();
                let data = {};
                if (variantNodes.length > 0) {
                    for (const vNode of variantNodes) {
                        
                        const vText = (await vNode.innerText()).trim();

                        try {   
                            await vNode.dispatchEvent('click'); 
                            await page.waitForTimeout(400);
                        } catch (e) {
                            console.warn(`⚠️  Lỗi khi click vào variant ${vText} của ${cleanName}:`, e);
                        }
                        const vUrl = await vNode.getAttribute('data-url');

                        const priceLocator = product.locator('strong.price');
                        let price = 0;
                        if (await priceLocator.count() > 0) {
                            const priceText = await priceLocator.innerText();
                            price = parseInt(priceText.replace(/\D/g, ''), 10) || 0;
                        }
                    
                        const link = (vUrl && vUrl !== "//") ? "https://www.thegioididong.com" + vUrl : linkDefault;

                        data = {
                            link,
                            name: cleanName,
                            v_name: vText, 
                            price: price,
                            shop_name: "TGDD",
                        }    
                        // console.log(data);

                    await redisClient.lPush('scraper_queue', JSON.stringify(data));
                }
                } else {
                // Kịch bản máy đơn (Không có nút bấm)
                    data = {
                        link: linkDefault,
                        name: cleanName,
                        v_name: v_name_main,
                        shop_name: "TGDD",
                        price: parseInt(priceRaw || 0, 10),
                }    
                // console.log(data);
                await redisClient.lPush('scraper_queue', JSON.stringify(data));
                }
            } catch (e) {   
            console.log("❌ Lỗi khi xử lý sản phẩm thứ " + (i+1) + " trên trang " + p + ": ", e.message);
            continue;
            }        
        }
    }
    await browser.close(); 
    
    console.log(`👋 Đã đóng trình duyệt, kết thúc an toàn!!!`);

    })();

});
