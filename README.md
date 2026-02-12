# 📚 IELTS Practice Platform  
雅思刷题全栈平台

基于 Next.js 15 构建的现代化雅思练习平台，支持 AI 自动评分，并针对 Cloudflare Edge 边缘部署优化。

> 全栈架构 · AI 写作评分 · Edge 原生部署 · 生产可用

---

## ✨ 核心功能

- 📖 阅读 / 听力 / 写作三大模块  
- 🤖 集成 Google Gemini Pro API 实现写作自动评分  
- 🌍 基于 Cloudflare Pages 实现全球低延迟访问  
- 🗂 兼容剑桥雅思真题结构  
- ⚡ 支持批量导入题库数据  

---

## 🛠 技术栈

- **框架**：Next.js 15（App Router）
- **数据库**：Neon PostgreSQL Serverless
- **ORM**：Drizzle ORM
- **运行时**：Cloudflare Edge Runtime
- **认证**：NextAuth.js v5
- **UI**：Tailwind CSS + Shadcn UI

---

## 🚀 快速开始

### 1️⃣ 安装依赖

```bash
git clone https://github.com/chipcloud/ielts-practice.git
cd ielts-practice
npm install
```

### 2️⃣ 配置环境变量

在根目录创建 `.env.local`：

```env
DATABASE_URL=postgresql://xxx
AUTH_SECRET=your_secret
AUTH_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_key
```

### 3️⃣ 初始化数据库

```bash
npx tsx src/db/seed.ts
```

### 4️⃣ 启动开发环境

```bash
npm run dev
```

---

## ☁️ 部署到 Cloudflare Pages

构建命令：

```bash
npx @cloudflare/next-on-pages
```

输出目录：

```
.vercel/output/static
```

生产环境变量：

```
DATABASE_URL=your_neon_connection_string
AUTH_URL=https://your-domain.pages.dev
AUTH_SECRET=your_secret
```

---

## 📄 License

MIT
