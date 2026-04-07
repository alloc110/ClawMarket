# Sử dụng Python phiên bản nhẹ (slim) để giảm dung lượng image
FROM python:3.11-slim

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Cài đặt các thư viện hệ thống cần thiết cho psycopg2
RUN apt-get update && apt-get install -y \
      libpq-dev \
      gcc \
      && rm -rf /var/lib/apt/lists/*

# Copy file requirements vào và cài đặt thư viện
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code nguồn vào container
COPY . .

# Chạy FastAPI bằng Uvicorn trên port 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]