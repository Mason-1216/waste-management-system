# Frontend Dockerfile - multi-stage build
FROM node:18-alpine as builder

# Build arguments for mirror configuration
ARG ALPINE_MIRROR=mirrors.aliyun.com
ARG NPM_REGISTRY=https://registry.npmmirror.com

WORKDIR /app

# Set Alpine mirror
RUN sed -i "s/dl-cdn.alpinelinux.org/${ALPINE_MIRROR}/g" /etc/apk/repositories

# Install dependencies
COPY package*.json ./
RUN npm config set registry ${NPM_REGISTRY} && \
    npm install

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
