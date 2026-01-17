# LogMind

[English](README.md) | [中文](README_zh.md)

Log your work. Let Logmind think.

LogMind 是一个智能工作日志与汇报系统，帮助你追踪每日任务，并利用 AI 自动生成日报、周报、月报和年报。

## 功能特性

- **仪表盘**: 工作进度概览、最近活动和报告统计。
- **工作日志**: 记录每日工作事项、进度、优先级和明日计划。
- **AI 报告**: 使用可自定义的 AI Prompt 自动生成专业的周报/月报/年报。
- **搜索**: 快速本地搜索日志和报告内容。
- **系统设置**: 配置 AI 提供商 (OpenAI/Azure/Custom) 并自定义 Prompt 模板。
- **响应式设计**: 基于 Tailwind CSS 和 Shadcn/ui 构建的现代化界面。

## 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL (或本地开发使用 SQLite)

### 本地开发

1.  **克隆仓库**
    ```bash
    git clone https://github.com/your-username/LogMind.git
    cd LogMind/logmind
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **设置数据库**
    更新 `.env` 中的数据库连接 URL (默认是 SQLite 以便快速开始，生产环境推荐使用 PostgreSQL)。
    ```bash
    # 创建 .env 文件
    cp .env.example .env
    
    # 运行迁移
    npx prisma generate
    npx prisma migrate dev --name init
    
    # 填充初始数据 (可选)
    npx tsx prisma/seed.ts
    ```

4.  **运行开发服务器**
    ```bash
    npm run dev
    ```

5.  **打开浏览器**
    访问 [http://localhost:3000](http://localhost:3000)

### Docker 部署 (推荐)

1.  **构建并运行**
    ```bash
    docker-compose up -d --build
    ```

2.  **访问应用**
    应用将在 [http://localhost:3000](http://localhost:3000) 可访问。
    默认数据库是在独立容器中运行的 PostgreSQL。

## AI 配置

要使用 AI 报告功能：
1.  进入 **系统设置** > **AI 连接配置**。
2.  输入您的 API Key (支持 OpenAI, Azure, 或自定义接口)。
3.  进入 **系统设置** > **Prompt 模板** 自定义报告生成的方式。

## 技术栈

- **框架**: Next.js 15 (App Router)
- **数据库**: PostgreSQL / SQLite (通过 Prisma ORM)
- **UI**: Tailwind CSS + Shadcn/ui
- **认证**: NextAuth.js (v5)
- **语言**: TypeScript
- **部署**: 内置 Docker 支持

## 许可证

MIT
