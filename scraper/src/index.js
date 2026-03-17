const { chromium } = require("playwright");

(async () => {

  const browser = await chromium.launch({ headless: true });

  const page = await browser.newPage();

  const pages = ['dtdd', 'laptop', 'may-tinh-bang'];

  for (const p of pages) {
    await page.goto(`https://www.thegioididong.com/${p}`);
    
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
        const name_model = product.locator('.newModel');
        const price_model = product.locator('.price strong');

        
    }

  }
  // try {
  //     const priceElement = page.locator('.bs_price strong').first();
  // } catch (error) {
  //     const priceElement = page.locator('..option_price strong').first();

  // }
  // const priceElement = page.locator('.bs_price strong').first();
  // await priceElement.waitFor({ state: 'visible', timeout: 10000 });

  // const text = await priceElement.textContent();
  // const cleanPrice = parseInt(text.replace(/[^0-9]/g, ''), 10);

  // console.log("Price product:", text);

  // console.log("💰 Giá thô bóc được từ web:", text);
  // console.log("✅ Giá tinh khiết lưu Database:", cleanPrice);



  // await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));

  // // 2. Chờ cho danh sách comment xuất hiện
  // // Lưu ý: Selector này có thể thay đổi tùy giao diện, ở đây ví dụ là '.rating-lst li'
  // const reviews = [];
  // try {

  //     // Trích xuất thông tin bên trong từng comment
  //     const textElement = node.locator('.cmt-txt');
  //     const stars = await node.locator('.cmt-top-star i').all(); 

  //     if (await textElement.count() > 0) {
  //         const rawText = await textElement.textContent();
          
  //         // Dọn dẹp khoảng trắng, dấu xuống dòng thừa cho sạch sẽ
  //         const cleanText = rawText.trim().replace(/\s+/g, ' ');

  //     }

  //     reviews.push({
  //           comment: cleanText.trim(),
  //           rating: stars.length, // Số lượng sao sẽ là đánh giá
  //     });

  //   }

  //   console.log(`✅ Đã "vét" được ${reviews.length} đánh giá:`);
    
  //   for(const review of reviews) {
  //     console.log(`⭐ ${review.rating} sao - "${review.comment}"`);
  //   } 
    
  //   console.table(reviews);
    
  //   await browser.close();

  // } catch (error) {
  //     console.error("❌ Không tìm thấy phần comment trong thời gian chờ.");
  //     await browser.close();
  //   }
  

  // 3. Lấy tất cả các thẻ comment
 

})();