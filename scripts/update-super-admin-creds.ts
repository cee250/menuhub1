import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Menuhub@2026', 10);

  // Check if settings exist
  let settings = await prisma.superAdminSettings.findFirst();
  
  if (settings) {
    await prisma.superAdminSettings.update({
      where: { id: settings.id },
      data: {
        email: 'menuhub',
        password: hashedPassword,
      },
    });
    console.log('✅ Super admin credentials updated to username: menuhub / password: Menuhub@2026');
  } else {
    await prisma.superAdminSettings.create({
      data: {
        email: 'menuhub',
        password: hashedPassword,
      },
    });
    console.log('✅ Super admin credentials created as username: menuhub / password: Menuhub@2026');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
