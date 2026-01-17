import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'alex@example.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: { logs: { include: { items: true } } }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(`User: ${user.name}, Role: ${user.role}`);
  
  console.log('Logs:');
  user.logs.forEach(log => {
    console.log(`- Date: ${log.date}, Project: ${log.project}, Items: ${log.items.length}`);
    log.items.forEach(item => {
        console.log(`  * [${item.project}] ${item.content}`);
    });
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
