from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import os
import re # Thêm thư viện để xử lý chuỗi mạnh mẽ hơn

# --- LangChain Imports ---
from langchain_community.utilities import SQLDatabase
from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.chains import create_sql_query_chain

app = FastAPI(title="ClawSense AI Assistant v0.3 - Fixed")

# 1. Kết nối DB
db = SQLDatabase.from_uri(
    "postgresql://clawsense_viewer:viewer_secret_123@postgres:5432/clawmarket",
    schema="bronze"
)

# 2. Khởi tạo LLM - Sửa tên Model và Env Var cho chuẩn
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash", # Bản ổn định nhất cho Free Tier
    temperature=0,
    google_api_key=os.getenv("GEMINI_API_KEYS") # Khớp với docker-compose
)

class ChatRequest(BaseModel):
    query: str

# 3. Prompt thông minh
answer_prompt = PromptTemplate.from_template(
"""Bạn là chuyên gia phân tích giá cao cấp của Clawsense, báo cáo trực tiếp cho Sếp.

Hệ thống dữ liệu của chúng ta gồm 2 lớp:
1. Lớp Silver (Dữ liệu đã làm sạch - ƯU TIÊN DÙNG):
   - silver.dim_products: Thông tin gốc của sản phẩm (id là product_id).
   - silver.history_price: Lịch sử giá đã chuẩn hóa. Cột 'price_trend' cho biết xu hướng tăng/giảm.
2. Lớp Bronze (Dữ liệu thô): 
   - bronze.products và bronze.price_history (Chỉ dùng khi lớp Silver không có dữ liệu).

NHIỆM VỤ CỦA BẠN:
- Dựa vào {result} để trả lời {question}.
- Nếu {result} trả về 'None' hoặc rỗng: Đừng chỉ báo cáo là thiếu dữ liệu. Hãy phân tích xem SQL ({query}) đã Join đúng product_id chưa, hoặc liệu tên sản phẩm có đang bị lệch giữa các bảng không.
- Luôn kiểm tra tính cập nhật: Ưu tiên giá có 'scraped_at' hoặc 'price_date' gần nhất.

ĐỊNH NGHĨA KÈO THƠM (BẮT BUỘC PHẢI BÁO):
1. Giá hiện tại thấp hơn giá trung bình lịch sử > 10%.
2. Sản phẩm có 'price_trend' là 'down' (đang giảm sâu).
3. Cùng một sản phẩm nhưng shop này đang rẻ hơn hẳn các shop khác (so sánh qua product_name).

Định dạng báo cáo:
- Tình trạng chung: (Ngắn gọn)
- Chi tiết sản phẩm: (Liệt kê kèm giá và shop)
- Đánh giá Kèo Thơm: (Nếu không có, hãy ghi 'Chưa có kèo thực sự tốt', nếu có phải nêu rõ lý do tại sao thơm)
- Kiến nghị cho Sếp: (Ví dụ: Cần kiểm tra lại scraper của shop X vì thiếu giá)

Câu hỏi: {question}
SQL đã chạy: {query}
Dữ liệu thô: {result}

Câu trả lời:"""
)

# 4. Hàm "Gọt giũa" SQL siêu cấp (Fix lỗi "SQLQuery:")
def clean_sql(sql_query: str) -> str:
    # Loại bỏ block markdown ```sql ... ```
    sql_query = re.sub(r"```sql", "", sql_query, flags=re.IGNORECASE)
    sql_query = re.sub(r"```", "", sql_query)
    
    # Loại bỏ các tiền tố thừa mà Gemini hay tự thêm vào
    # Quét sạch: SQLQuery:, Query:, SQL Query:, Answer:, v.v.
    sql_query = re.sub(r"^(SQLQuery:|Query:|SQL\s*Query:|Answer:)", "", sql_query, flags=re.IGNORECASE | re.MULTILINE)
    
    return sql_query.strip()

# 5. Xây dựng Chain
write_query = create_sql_query_chain(llm, db)
execute_query = QuerySQLDataBaseTool(db=db)

full_chain = (
    RunnablePassthrough.assign(query=write_query).assign(
        result=lambda x: execute_query.invoke(clean_sql(x["query"]))
    )
    | answer_prompt
    | llm
    | StrOutputParser()
)

@app.post("/ask")
async def ask_ai(request: ChatRequest):
    try:
        # Log để sếp soi xem nó viết SQL gì trong Docker log
        print(f"--- Đang xử lý câu hỏi: {request.query} ---")
        response = full_chain.invoke({"question": request.query})
        return {"status": "success", "answer": response}
    except Exception as e:
        print(f"LỖI TẠI ĐÂY SẾP ƠI: {str(e)}") 
        raise HTTPException(status_code=500, detail="AI đang bận, sếp check log Docker nhé!")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)