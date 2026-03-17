# 1. Dùng Base Image Node.js + Playwright chính chủ
FROM mcr.microsoft.com/playwright:v1.58.2-jammy

# 2. Thiết lập thư mục làm việc
WORKDIR /app

# 3. Copy file cấu hình thư viện vào trước
COPY package*.json ./

# 4. Cài đặt thư viện (Chỉ cài playwright, không cần cài lại trình duyệt vì Image có sẵn rồi)
RUN npm install
      
# 5. Copy toàn bộ code vào
COPY . .

# 6. Chạy script của sếp (Giả sử file tên là main.js)
CMD ["tail", "-f", "/dev/null"]