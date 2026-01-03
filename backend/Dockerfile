# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Set timezone
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "src/app.js"]
