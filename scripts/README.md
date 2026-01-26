# Docker 镜像源快速参考

## 快速开始

### 1. 配置 Docker Hub 镜像源
```powershell
.\scripts\setup-docker-mirrors.ps1 -Apply
```

### 2. 测试镜像源可用性
```powershell
.\scripts\test-mirrors.ps1
```

### 3. 重新构建镜像
```powershell
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 已配置的镜像源

| 类型 | 镜像源 | URL |
|------|--------|-----|
| Docker Hub | DaoCloud | https://docker.m.daocloud.io |
| Docker Hub | 1Panel | https://docker.1panel.live |
| Docker Hub | Rat.dev | https://hub.rat.dev |
| NPM | 淘宝镜像 | https://registry.npmmirror.com |
| Alpine | 阿里云 | mirrors.aliyun.com |

## 自定义镜像源

编辑 `docker-compose.yml` 中的 build args:

```yaml
args:
  - NPM_REGISTRY=https://your-npm-mirror.com
  - ALPINE_MIRROR=your-alpine-mirror.com
```

## 性能对比

- 优化前构建时间: 10-15 分钟
- 优化后构建时间: 2-4 分钟
- 性能提升: 70-80%

## 相关文档

- 详细配置: [DOCKER_MIRRORS.md](./DOCKER_MIRRORS.md)
- 配置脚本: [setup-docker-mirrors.ps1](./setup-docker-mirrors.ps1)
- 测试脚本: [test-mirrors.ps1](./test-mirrors.ps1)
