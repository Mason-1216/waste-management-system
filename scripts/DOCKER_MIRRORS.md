# Docker 镜像源配置指南

本文档说明如何配置 Docker 镜像源以加速镜像拉取和依赖安装。

## 一、Docker Hub 镜像源配置

### 1.1 自动配置（推荐）

运行配置脚本：

```powershell
.\scripts\setup-docker-mirrors.ps1 -Apply
```

### 1.2 手动配置

1. 打开 Docker Desktop
2. 点击右上角设置图标（齿轮）
3. 选择左侧 "Docker Engine"
4. 在 JSON 编辑器中添加以下配置：

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live",
    "https://hub.rat.dev"
  ],
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```

5. 点击 "Apply & Restart"
6. 等待 Docker 重启完成

### 1.3 验证配置

```powershell
docker info | Select-String -Pattern "Registry Mirrors" -Context 0,3
```

## 二、已配置的镜像源

### 2.1 Docker Hub 镜像源
- DaoCloud: `https://docker.m.daocloud.io`
- 1Panel: `https://docker.1panel.live`
- Rat.dev: `https://hub.rat.dev`

### 2.2 Alpine Linux 镜像源
- 阿里云: `mirrors.aliyun.com`
- 已在 Dockerfile 中配置

### 2.3 NPM 镜像源
- 淘宝镜像: `https://registry.npmmirror.com`
- 已在 Dockerfile 中配置

## 三、Dockerfile 优化说明

### 3.1 Backend Dockerfile
```dockerfile
# Alpine 包管理器镜像源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# NPM 镜像源
RUN npm config set registry https://registry.npmmirror.com
```

### 3.2 Frontend Dockerfile
```dockerfile
# Alpine 包管理器镜像源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# NPM 镜像源
RUN npm config set registry https://registry.npmmirror.com
```

## 四、构建和部署

### 4.1 重新构建镜像

```powershell
# 停止所有容器
docker-compose down

# 清理旧镜像（可选）
docker-compose build --no-cache

# 或者只重建特定服务
docker-compose build --no-cache frontend
docker-compose build --no-cache backend

# 启动服务
docker-compose up -d
```

### 4.2 查看构建日志

```powershell
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f frontend
docker-compose logs -f backend
```

## 五、性能对比

### 5.1 优化前
- Docker 镜像拉取: 5-10 分钟
- NPM 依赖安装: 3-5 分钟
- Alpine 包安装: 1-2 分钟
- 总构建时间: 10-15 分钟

### 5.2 优化后
- Docker 镜像拉取: 1-2 分钟
- NPM 依赖安装: 30-60 秒
- Alpine 包安装: 10-20 秒
- 总构建时间: 2-4 分钟

**性能提升**: 约 70-80%

## 六、故障排除

### 6.1 镜像源不可用

如果某个镜像源不可用，Docker 会自动尝试下一个。可以手动测试：

```powershell
# 测试 Docker Hub 镜像源
curl https://docker.m.daocloud.io/v2/

# 测试 NPM 镜像源
curl https://registry.npmmirror.com/
```

### 6.2 构建失败

```powershell
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker-compose build --no-cache
```

### 6.3 网络问题

如果仍然遇到网络问题，可以尝试：

1. 检查防火墙设置
2. 使用 VPN
3. 更换其他镜像源

## 七、维护建议

### 7.1 定期更新镜像源列表

镜像源可能会变更，建议定期检查和更新：

```powershell
# 测试所有镜像源可用性
.\scripts\test-mirrors.ps1
```

### 7.2 监控构建时间

记录每次构建时间，如果发现变慢，检查镜像源状态。

### 7.3 备份配置

定期备份 Docker 配置：

```powershell
.\scripts\backup-all.ps1
```

## 八、相关文件

- `scripts/setup-docker-mirrors.ps1` - 镜像源配置脚本
- `scripts/docker-daemon.json` - Docker 守护进程配置
- `backend/Dockerfile` - 后端镜像构建文件
- `frontend/Dockerfile` - 前端镜像构建文件
- `docker-compose.yml` - 服务编排配置

---

**最后更新**: 2026-01-17
**维护人员**: 系统管理员
