FROM node:22-slim

WORKDIR /app

# Build tools needed for better-sqlite3 native module
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Cloud Run sets PORT automatically; Next.js respects it
ENV NODE_ENV=production
EXPOSE 8080

CMD ["node_modules/.bin/next", "start", "-p", "8080"]
