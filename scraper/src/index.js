const { chromium } = require("playwright");
const pool = require('./db');

async function saveDataToPostgres(product) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Bắt đầu giao dịch

        // 1. Chèn vào bảng products (Dùng ON CONFLICT để nếu trùng URL thì chỉ lấy ID cũ)
        const productRes = await client.query(`
            INSERT INTO bronze.products (id, product_url, product_name, shop_name, image_url, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (product_url) DO UPDATE SET product_name = EXCLUDED.product_name
            RETURNING id
        `, [product.data_id, product.link, product.name, 'TheGioiDiDong', product.image_url, new Date()]);



        for (const variant of product.variants) {
            if(variant.variantLink === "Không có link") continue; // Bỏ qua nếu không có link phiên bản
            await client.query(`
                INSERT INTO bronze.product_variants(product_id, variant_name, variant_link)
                ON CONFLICT (product_id) DO UPDATE SET product_name = EXCLUDED.product_name
                DO UPDATE SET 
                  variant_name = EXCLUDED.variant_name,
                  variant_link = EXCLUDED.variant_link 
                VALUES ($1, $2, $3)
            `, [product.data_id, variant.variantName, variant.variantLink]);
        }


        // 2. Chèn vào bảng price_history (Lưu mọi lần cào để theo dõi biến động)
        await client.query(`
            INSERT INTO bronze.price_history (product_id, price)
            VALUES ($1, $2)
        `, [product.data_id, product.price]);

        await client.query('COMMIT'); // Hoàn tất lưu dữ liệu
        console.log(`✅ Đã lưu: ${product.name}`);
    } catch (e) {
        await client.query('ROLLBACK'); // Nếu lỗi thì hủy bỏ các bước trên
        console.error('❌ Lỗi khi lưu DB:', e);
    } finally {
        client.release(); // Giải phóng kết nối
    }
}



(async () => {

  const browser = await chromium.launch({ headless: true });

  const page = await browser.newPage();

  const pages = ['dtdd']; // ,  'laptop', 'may-tinh-bang'
  let products_list = [];

  let count = 0;
  for (const p of pages) {
    await page.goto(`https://www.thegioididong.com/${p}`);
    console.log(`🚀 Đang truy cập: ${p}`);
    await page.waitForTimeout(2000);

    const productslist = '.listproduct li'; 
    await page.waitForSelector(productslist, { timeout: 1000 });
    const btnSelector = '.view-more';


    let clickCount = 0;
    const maxClicks = 10; 

    // Bấm nút "Xem thêm" cho đến khi không còn hoặc đã bấm đủ số lần
    while (clickCount < maxClicks) {
      const btn = page.locator(btnSelector);
      
      if (await btn.isVisible()) {
        console.log(`🖱️ Đang bấm nút 'Xem thêm' lần ${clickCount + 1}...`);
        
        await btn.click({ force: true }); 
        
        await page.waitForTimeout(2500); 
        
        clickCount++;
      } else {
        console.log("✅ Đã mở hết tất cả bình luận hoặc không còn nút 'Xem thêm'!");
        break; 
      } 
    }
    

    const products = await page.locator(productslist).all();
    
    for(const product of products) {
      const prodsGroup = product.locator('.prods-group');
      const hasVariants = await prodsGroup.count() > 0;
      const variants = [];
      if(hasVariants) {
        const variantNodes = await product.locator('.prods-group li.merge__item').all();
      
        for (const vNode of variantNodes) { 
            const vName = await vNode.textContent();
            const vUrl = await vNode.evaluate(el => {
              // 1. Thử lấy thuộc tính chuẩn
              if (el.getAttribute('data-url')) return el.getAttribute('data-url');
              // 2. Thử lấy từ dataset (Nơi các framework hiện đại như React/Vue hay giấu)
              if (el.dataset && el.dataset.url) return el.dataset.url;
              // 3. Thử lấy từ property trực tiếp
              return el.dataUrl || null;
           });
            const v_data_id = await vNode.evaluate(el => el.getAttribute('data-id'));
            // const vUrl = await vNode.getAttribute('data-url');
            console.log(`🔍 Phát hiện phiên bản: ${vName.trim()} - ID: ${v_data_id} - Link: ${vUrl}`);
            // Né cái bẫy link "//" rỗng của TGDĐ
            const vLink = (vUrl === "//" || !vUrl) 
                          ? "Không có link" 
                          : "https://www.thegioididong.com" + vUrl;
                          
            variants.push({
                variantName: vName.trim(),
                variantLink: vLink
            });
          }        
          continue; 
      }   

      // const aTag = product.locator('a.main-contain');
      // if (await aTag.count() === 0) continue;
      // const name = await aTag.getAttribute('data-name'); // Tên sạch 100%
      // const data_id = await aTag.getAttribute('data-id'); // ID sạch 100%
      // const rawPrice = await aTag.getAttribute('data-price');
      // const price = rawPrice ? parseInt(rawPrice, 10) : 0;
      // const link = "https://www.thegioididong.com" + await aTag.getAttribute('href');
      // const image = await product.locator('img.thumb').getAttribute('src');

      // // --- GOM VÀO KHO ---
      // products_list.push({
      //   data_id,  
      //   name,
      //   price,
      //   link,
      //   image,
      //   variants
      // });
    }
  }

  // for (const product of products_list) {
  //   await saveDataToPostgres(product);
  // }
  await browser.close(); 
  console.log(`👋 Đã đóng trình duyệt, kết thúc an toàn!!!`);

})();