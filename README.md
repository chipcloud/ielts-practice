# 📚 IELTS Practice Platform  
雅思刷题全栈平台

[🌐 Demo](https://ielts-practice-64v.pages.dev/) • [⭐ Star on GitHub](https://github.com/chipcloud/ielts-practice)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)  
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange.svg)](https://pages.cloudflare.com/)  
[![Gemini Pro](https://img.shields.io/badge/AI-Gemini%20Pro-green.svg)](https://cloud.google.com/vertex-ai)

> 一个现代化、全栈的雅思练习平台，支持 AI 自动评分、全球边缘部署，以及真实剑桥题库结构。

---

## 🚀 预览 Demo

👉 **在线体验地址：**  
https://ielts-practice-64v.pages.dev/

效果覆盖：  
✔ 阅读 / 听力 / 写作练习  
✔ AI 自动写作评分  
✔ 实时交互体验

---

## 📌 核心功能

- 📖 阅读 / 听力 / 写作模块  
- 🤖 集成 **Google Gemini Pro API** 自动评分  
- 🌍 **Cloudflare Edge** 全球低延迟部署  
- 🗂 支持剑桥 IELTS 架构题库  
- ⚡ 题库批量导入、脚本自动化

---

## 🛠 技术栈

- **框架**：Next.js 15 (App Router)  
- **数据库**：Neon (PostgreSQL Serverless)  
- **ORM**：Drizzle ORM  
- **运行时**：Cloudflare Edge Runtime  
- **认证**：NextAuth.js v5  
- **样式**：Tailwind CSS + Shadcn UI

---

## 🚀 快速开始

### 1) 克隆仓库

```bash
git clone https://github.com/chipcloud/ielts-practice.git
cd ielts-practice
npm install
```

### 2) 配置环境变量

创建 `.env.local`：

```env
DATABASE_URL=postgresql://xxx
AUTH_SECRET=your_secret
AUTH_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key
```

### 3) 初始化题库

```bash
npx tsx src/db/seed.ts
```

### 4) 启动

```bash
npm run dev
```

---

## ☁️ 部署到 Cloudflare Pages

构建命令：

```bash
npx @cloudflare/next-on-pages
```

生成输出：

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

## 🧠 项目架构示意

```
.
├── public/                     Static assets
├── src/
│   ├── app/                   Next.js Pages & API
│   ├── db/                    Drizzle schema & seed
│   ├── components/            UI 组件
│   └── lib/                   工具库、AI 调用逻辑
├── scripts/                   自动化脚本
├── tailwind.config.js
├── drizzle.config.ts
├── next.config.js
└── wrangler.toml              Edge 配置
```

---

## 📄 License

MIT

---

## ❗ 贡献 & 联系

欢迎任何方式贡献：

- 提 Issue 📌  
- 发 PR 🚀  
- 改进文档 📚

如需联系或进阶交流，欢迎在仓库留言。
