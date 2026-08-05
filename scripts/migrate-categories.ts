import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting menu item migration...');

  const items = await prisma.menuItem.findMany({
    where: {
      OR: [
        { mainCategory: 'Foods' }, // Default value
        { mainCategory: null }
      ]
    },
    include: {
      category: true
    }
  });

  console.log(`Found ${items.length} items to check.`);

  let updatedCount = 0;

  for (const item of items) {
    // Try to guess if it's a drink based on common category names, item names, and descriptions
    const drinkKeywords = ['drink', 'beverage', 'wine', 'beer', 'cocktail', 'juice', 'soda', 'water', 'coffee', 'tea', 'alcohol', 'champagne', 'spirit', 'liquor', 'boisson', 'ibinyobwa'];
    
    const categoryName = item.category?.name || '';
    const itemName = item.name || '';
    const itemDescription = item.description || '';
    
    const content = `${categoryName} ${itemName} ${itemDescription}`.toLowerCase();
    const isDrink = drinkKeywords.some(keyword => content.includes(keyword));

    if (isDrink) {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { mainCategory: 'Drinks' }
      });
      updatedCount++;
    }
  }

  console.log(`✅ Migration complete! Updated ${updatedCount} items to "Drinks". All others remain as "Foods".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
