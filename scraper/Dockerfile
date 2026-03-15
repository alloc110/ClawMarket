FROM node:20

WORKDIR /app

# system deps for playwright
RUN apt-get update && apt-get install -y \
  git \
  curl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# install your project deps
COPY package*.json ./
RUN npm install

# install OpenClaw from github
RUN npm install git+https://github.com/openclaw/openclaw.git

# install playwright browsers
RUN npx playwright install --with-deps chromium

# copy project
COPY . .

ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright

CMD ["tail", "-f", "/dev/null"]