import { PrismaClient } from '@prisma/client';

// 🛡️ THE MAGIC FIX: Auto-remove the bad part of the Neon URL
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('channel_binding=require')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('&channel_binding=require', '');
  console.log('✅ Fixed DATABASE_URL: removed channel_binding=require automatically!');
}

// Prevent multiple database connections in Netlify serverless functions
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'], // Only log errors to keep it fast
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;