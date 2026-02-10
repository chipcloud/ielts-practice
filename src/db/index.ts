import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema'; // 假设你的 schema 文件在这里

// ⚠️ 注意：不要在这里使用 'pg' 或 'drizzle-orm/node-postgres'
// 它们包含 'fs' 依赖，会导致构建失败

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });