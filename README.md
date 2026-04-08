# 🏠 ClawSense AI: Real-time FinHouse Price Intelligence

![Python](https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini%20AI-v1.5-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)
![dbt](https://img.shields.io/badge/dbt-1.7-FF694B?style=for-the-badge&logo=dbt&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-D24939?style=for-the-badge&logo=jenkins&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Container-2496ED?style=for-the-badge&logo=docker&logoColor=white)

> **Project:** Hệ thống phân tích thị trường bất động sản thông minh tích hợp AI Agent và quy trình ELT tự động.
> **Key Feature:** Chuyển đổi ngôn ngữ tự nhiên thành SQL (Text-to-SQL) và tự động hóa biến đổi dữ liệu với dbt thông qua Jenkins Pipeline.

---

## 📋 Table of Contents

- [Repository Structure](#-repository-structure)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Installation & Setup](#-installation--setup)
- [AI Agent Usage](#-ai-agent-usage)
- [CI/CD Pipeline](#-cicd-pipeline)

---

## 📂 Repository Structure

```bash
.
├── ai_agent/
│   ├── main.py              # FastAPI Backend & LangChain Logic (Text-to-SQL)
│   └── Dockerfile           # Đóng gói môi trường Python & AI
├── database/
│   └── dbt_transform/       # Analytics Engineering với dbt
│       ├── models/          # Định nghĩa SQL transformations (Bronze/Silver/Gold)
│       ├── dbt_project.yml  # Cấu hình dự án dbt
│       └── profiles.yml     # Cấu hình kết nối Database cho dbt
├── infra/
│   ├── jenkins/
│   │   └── Dockerfile       # Custom Jenkins tích hợp Docker-CLI (DooD)
│   └── docker-compose.yaml  # Điều phối toàn bộ hệ thống (Jenkins, Postgres, API)
├── Jenkinsfile              # Quy trình CI/CD tự động (Build -> Test -> Transform)
└── README.md