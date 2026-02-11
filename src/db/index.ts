import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Cloudflare Workers: process.env 在模块加载时为空
// 需要在请求时通过 getRequestContext() 或 process.env 获取

function getDatabaseUrl(): string {
  // 优先尝试 process.env（本地开发 & Vercel）
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Cloudflare Workers: 通过 next-on-pages 的 getRequestContext 获取
  try {
    const { getRequestContext } = require('@cloudflare/next-on-pages');
    const ctx = getRequestContext();
    if (ctx?.env?.DATABASE_URL) {
      return ctx.env.DATABASE_URL;
    }
  } catch {
    // getRequestContext not available
  }

  throw new Error('DATABASE_URL environment variable is not set');
}

let _db: NeonHttpDatabase<typeof schema> | null = null;
let _lastUrl: string | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  const url = getDatabaseUrl();
  // 如果 URL 变化（理论上不会），重新创建连接
  if (!_db || _lastUrl !== url) {
    const sql = neon(url);
    _db = drizzle(sql, { schema });
    _lastUrl = url;
  }
  return _db;
}

// Proxy 让 db.select() 等调用透明工作
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
