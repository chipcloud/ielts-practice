import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Cloudflare Workers: process.env 在请求处理阶段由 next-on-pages 注入
// 使用 getter 函数确保在请求时才读取环境变量

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set. Available env keys: ' +
        Object.keys(process.env).filter(k => !k.startsWith('npm_')).join(', ')
      );
    }
    const sql = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

// Proxy 让现有代码 db.select() 等调用无需改动
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    // 如果是函数，绑定到实例
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
