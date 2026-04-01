import { chromium } from "playwright";
import { createClient } from "redis";
import cron from 'node-cron';

const redisClient = createClient({ url: 'redis://redis:6379' });
await redisClient.connect();
cron.schedule('*/10 * * * *', () => {

    (async () => {

    const browser = await chromium.launch({ headless: true });

    const page = await browser.newPage();

    const pages = [ 'dien-thoai', 'may-tinh-xach-tay' , 'may-tinh-bang' ];   

    for (const p of pages) {
        await page.goto(`https://fptshop.com.vn/${p}`);
        console.log(`🚀 Đang truy cập: ${p}`);
        await page.waitForTimeout(2000);

        const productslist = '.ProductCard_brandCard__VQQT8'; 
        await page.waitForSelector(productslist, { timeout: 1000 });
        const btnSelector = 'button.border-iconDividerOnWhite:has-text("Xem thêm")';


        let clickCount = 0;
        const maxClicks = 2;  //30

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

                const aTag = product.locator('h3.ProductCard_cardTitle__HlwIo a');
                if (await aTag.count() === 0) continue;

                const statusLocator = product.locator('.ProductCard_displayPriceText__nfghi');
                const statusText = await statusLocator.count() > 0 ? await statusLocator.innerText() : "";

                if (statusText.includes("Hàng sắp về")) {
                    console.log(`⏩ Sản phẩm thứ ${i + 1}: Hàng sắp về -> Bỏ qua.`);
                    continue; // Thoát ra và sang sản phẩm kế tiếp
                }
    
                const nameRaw = await aTag.getAttribute('title');
                const baseHref = await aTag.getAttribute('href');
                const variantSection = product.locator('.ProductCard_variant__9q8hf button');
                const variantCount = await variantSection.count();

                if (variantCount > 0) {
                    for (let j = 0; j < variantCount; j++) {
                        const vBtn = variantSection.nth(j);
                        const vName = (await vBtn.innerText()).split('\n')[0].trim();
                        
                        await vBtn.click();
                        await page.waitForTimeout(800); // Đợi đổi SKU trên URL

                        const priceRaw = await product.locator('.text-textOnWhitePrimary.b1-semibold').first().innerText();
                        const price = parseInt(priceRaw.replace(/\D/g, ''), 10);
                        
                        const data = {
                            link: `https://fptshop.com.vn/${baseHref}`,
                            name: nameRaw,
                            v_name: vName,
                            price: price,
                            shop_name: "FPT"
                        };
                        // console.log("📱 FPT have variants:", data);
                        if (data.price > 0) {
                            await redisClient.lPush('scraper_queue', JSON.stringify(data));
                        }
                    }
                } else {
                    // Trường hợp không có nút chọn dung lượng (máy chỉ có 1 bản)
                    const priceRaw = await product.locator('.text-textOnWhitePrimary.b1-semibold').first().innerText();
                    const price = parseInt(priceRaw.replace(/\D/g, ''), 10);
                    
                    const data = {
                        link: `https://fptshop.com.vn/${baseHref}`,
                        name: nameRaw,
                        v_name: "Default Variant",
                        price: price,
                        shop_name: "FPT"
                    };
                    // console.log("📱 FPT:", data);
                    if (data.price > 0) {
                        await redisClient.lPush('scraper_queue', JSON.stringify(data));
                    }
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
