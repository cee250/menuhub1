import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const slug = 'cafe-kigali';
  const plainPassword = 'password123'; 
  
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
  await prisma.business.update({
    where: { slug: slug },
    data: { password: hashedPassword },
  });
  
  console.log("✅ Password set for " + slug);
  console.log("Login: " + slug + " / " + plainPassword);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());