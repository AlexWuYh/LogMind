# 生产环境部署指南 (Production Deployment Guide)

LogMind 支持使用 SQLite (默认/开发) 或 PostgreSQL (推荐/生产) 进行部署。

## 方案一：使用 SQLite (当前默认)

适用于个人使用、测试或小规模部署。无需额外数据库服务。

**部署命令：**
```bash
docker-compose up -d --build
```

## 方案二：使用 PostgreSQL (生产推荐)

适用于正式环境，提供更好的性能、并发处理和数据安全性。

### 切换步骤

1.  **修改 Prisma 配置**
    打开 `prisma/schema.prisma` 文件，将 `datasource` 块中的 `provider` 修改为 `postgresql`：

    ```prisma
    // prisma/schema.prisma
    datasource db {
      provider = "postgresql"  // 修改此处 (原为 "sqlite")
      url      = env("DATABASE_URL")
    }
    ```

2.  **清理旧的生成文件 (可选)**
    为了防止缓存问题，建议删除 `node_modules` 或 `prisma/migrations` (注意备份数据)。
    *注意：PostgreSQL 和 SQLite 的迁移文件不兼容，切换数据库通常需要重新初始化迁移或手动转换数据。*

3.  **使用生产配置启动**
    使用我们准备好的 `docker-compose.prod.yml` 文件进行部署：

    ```bash
    docker-compose -f docker-compose.prod.yml up -d --build
    ```

    该命令会自动：
    *   启动 PostgreSQL 15 数据库容器
    *   构建并启动 LogMind 应用容器
    *   自动连接到 PostgreSQL 数据库 (通过 `DATABASE_URL` 环境变量)

### 数据迁移注意事项

*   **初次部署**：系统启动时会自动运行 `npx prisma migrate deploy` (在 Dockerfile 中定义)，在 PostgreSQL 中创建表结构。
*   **从 SQLite 迁移数据**：由于底层差异，直接迁移数据较复杂。建议在正式使用前确定数据库选型。如果必须迁移数据，可以使用 `pgloader` 等工具将 SQLite 数据导入 PostgreSQL。
