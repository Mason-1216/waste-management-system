# Backend Dockerfile
FROM node:18-alpine

# Build arguments for mirror configuration
ARG ALPINE_MIRROR=mirrors.aliyun.com
ARG NPM_REGISTRY=https://registry.npmmirror.com

WORKDIR /app

# Set timezone
RUN sed -i "s/dl-cdn.alpinelinux.org/${ALPINE_MIRROR}/g" /etc/apk/repositories && \
    apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

# Install dependencies
COPY package*.json ./
RUN npm config set registry ${NPM_REGISTRY} && \
    npm install --production

# Copy source
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "src/app.js"]
