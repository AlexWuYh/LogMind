import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  // 1. Create/Update Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'alex@example.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    },
    create: {
      email: 'alex@example.com',
      name: 'Alex',
      role: 'ADMIN',
      status: 'ACTIVE',
      password: hashedPassword
    },
  })
  console.log('Seeded Admin:', admin.email)

  // 2. Create Regular User
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      password: hashedPassword,
      role: 'USER',
      status: 'ACTIVE'
    },
    create: {
      email: 'user@example.com',
      name: 'Demo User',
      role: 'USER',
      status: 'ACTIVE',
      password: hashedPassword
    },
  })
  console.log('Seeded User:', user.email)

  // 3. Create Daily Logs for Admin (Past 7 days)
  const today = new Date();
  const projects = ['LogMind Development', 'Team Sync', 'Code Review', 'Learning'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const existingLog = await prisma.dailyLog.findFirst({
      where: { userId: admin.id, date: dateStr }
    });

    if (!existingLog) {
      const project = projects[i % projects.length];
      await prisma.dailyLog.create({
        data: {
          userId: admin.id,
          date: dateStr,
          project: project,
          summary: `Worked on ${project}. Implemented key features and fixed bugs.`,
          progress: 80 + (i * 2) % 20, // Randomish progress
          items: {
            create: [
              { content: 'Completed frontend component for dashboard', progress: 100 },
              { content: 'Investigated API latency issue', progress: 50 },
              { content: 'Daily standup meeting', progress: 100 }
            ]
          }
        }
      });
      console.log(`Created log for ${dateStr}`);
    }
  }

  // 4. Create Reports
  // Weekly Report
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const weekStr = lastWeek.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  
  // First of month
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstOfMonthStr = firstOfMonth.toISOString().split('T')[0];
  
  // End of month
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const endOfMonthStr = endOfMonth.toISOString().split('T')[0];
  
  // Delete existing reports to avoid duplicates since we can't use skipDuplicates easily
  await prisma.report.deleteMany({
    where: {
      userId: admin.id,
      type: { in: ['WEEKLY', 'MONTHLY'] }
    }
  });

  await prisma.report.createMany({
    data: [
      {
        userId: admin.id,
        type: 'WEEKLY',
        periodStart: weekStr,
        periodEnd: todayStr,
        content: '# Weekly Report\n\n## Achievements\n- Launched LogMind v1.0\n- Fixed critical authentication bugs\n\n## Plans\n- Start Phase 2 development',
        status: 'GENERATED',
        createdAt: new Date()
      },
      {
        userId: admin.id,
        type: 'MONTHLY',
        periodStart: firstOfMonthStr,
        periodEnd: endOfMonthStr,
        content: '# Monthly Summary\n\nGreat progress this month. Team velocity increased by 20%.',
        status: 'GENERATED',
        createdAt: new Date()
      }
    ]
  });
  console.log('Seeded Reports');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
