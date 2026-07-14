const { PrismaClient } = require('@prisma/client');
// No need to pass options if the environment variable is set
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.pricingRoute.count();
    const routes = await prisma.pricingRoute.findMany();
    console.log('Count:', count);
    console.log('Routes:', JSON.stringify(routes, null, 2));
  } catch (e) {
    console.log('Error accessing database:', e.message);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
