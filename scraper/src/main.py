from openclaw import OpenClaw
from dotenv import load_dotenv, dotenv_values  # <-- Thêm dòng này
      
# 1. Cấu hình "Bộ não" (Dùng LLaMA 3 qua API của Groq)
# Lưu ý: Lát nữa bạn thay dòng "API_KEY_CUA_BAN" bằng key thật lấy từ groq.com nhé

import cmdop.exceptions
if not hasattr(cmdop.exceptions, 'TimeoutError'):
    cmdop.exceptions.TimeoutError = TimeoutError

config = dotenv_values(".env")
api_key = config.get("API_KEY")

# 2. Khởi tạo Agent và nạp kỹ năng cào web
agent = OpenClaw(
    model="llama3-70b-8192",
    provider="groq"
)
agent.load_skill("playwright-scraper-skill")

# 3. Ra lệnh đi cào thử 1 link (Ví dụ link Tiki)
link_can_cao = "https://tiki.vn/may-lam-sua-hat-elmich-cbe-8650-p276448859.html"
lenh_cho_robot = f"""
Hãy dùng trình duyệt truy cập vào link: {link_can_cao}
Trích xuất cho tôi:
1. Tên sản phẩm
2. Giá bán hiện tại
Trả về kết quả chuẩn định dạng JSON.
"""

print(f"🤖 Robot đang đi tới link: {link_can_cao}...")
print("⏳ Vui lòng đợi AI đọc web và bóc tách dữ liệu...")

# 4. Kích hoạt chạy và in kết quả
ket_qua = agent.run(lenh_cho_robot)

print("\n✅ KẾT QUẢ THU ĐƯỢC TỪ ROBOT:")
print(ket_qua)
