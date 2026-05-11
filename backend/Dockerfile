FROM python:3.12-slim

WORKDIR /app

# システム依存関係（poppler-utils: pdf2image に必要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Python依存関係
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコード
COPY . .

# ポート公開
EXPOSE 8000

# 起動コマンド (Render.com / Cloud Run 対応)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
