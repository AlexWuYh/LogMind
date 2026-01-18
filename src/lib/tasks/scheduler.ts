import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, subWeeks, subMonths, subYears } from 'date-fns';
import { generateReport } from '@/lib/ai';

async function checkScheduleConfig(key: string): Promise<boolean> {
  const config = await prisma.systemConfig.findUnique({
    where: { key }
  });
  // Default to true if not set
  return config?.value !== 'false';
}

export function initScheduler() {
  console.log('Initializing Scheduler...');

  // 1. AI Summary: Every day at 01:00 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('Running Daily AI Summary Task...');
    try {
      const yesterday = subDays(new Date(), 1);
      const dateStr = format(yesterday, 'yyyy-MM-dd');
      
      // Find logs for yesterday that don't have AI summary
      const logs = await prisma.dailyLog.findMany({
        where: {
          date: dateStr,
          aiSummary: null
        },
        include: { items: true }
      });

      for (const log of logs) {
        // Mock AI Generation - In real app, call AI service here
        // For now, we skip AI summary generation here as it requires complex setup
        // Or we could implement a simple one:
        // await generateDailySummary(log); 
        console.log(`[Scheduler] Skipping daily summary for log ${log.id} (Not implemented fully)`);
      }
    } catch (error) {
      console.error('Error in AI Summary Task:', error);
    }
  });

  // 2. Weekly Report: Every Monday at 02:00 AM (Generates report for previous week)
  cron.schedule('0 2 * * 1', async () => {
    console.log('Running Weekly Report Task...');
    try {
      if (!(await checkScheduleConfig('schedule_weekly'))) {
        console.log('Weekly report schedule is disabled.');
        return;
      }

      const today = new Date();
      const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      
      const startDate = format(lastWeekStart, 'yyyy-MM-dd');
      const endDate = format(lastWeekEnd, 'yyyy-MM-dd');

      const users = await prisma.user.findMany({ where: { status: 'ACTIVE' } });
      for (const user of users) {
        try {
          await generateReport('WEEKLY', startDate, endDate, user.id);
          console.log(`Generated Weekly Report for user ${user.id}`);
        } catch (err) {
          console.error(`Failed to generate Weekly Report for user ${user.id}:`, err);
        }
      }
    } catch (error) {
      console.error('Error in Weekly Report Task:', error);
    }
  });

  // 3. Monthly Report: 1st of month at 03:00 AM (Generates report for previous month)
  cron.schedule('0 3 1 * *', async () => {
    console.log('Running Monthly Report Task...');
    try {
      if (!(await checkScheduleConfig('schedule_monthly'))) {
        console.log('Monthly report schedule is disabled.');
        return;
      }

      const today = new Date();
      const lastMonthStart = startOfMonth(subMonths(today, 1));
      const lastMonthEnd = endOfMonth(subMonths(today, 1));
      
      const startDate = format(lastMonthStart, 'yyyy-MM-dd');
      const endDate = format(lastMonthEnd, 'yyyy-MM-dd');

      const users = await prisma.user.findMany({ where: { status: 'ACTIVE' } });
      for (const user of users) {
        try {
          await generateReport('MONTHLY', startDate, endDate, user.id);
          console.log(`Generated Monthly Report for user ${user.id}`);
        } catch (err) {
          console.error(`Failed to generate Monthly Report for user ${user.id}:`, err);
        }
      }
    } catch (error) {
      console.error('Error in Monthly Report Task:', error);
    }
  });

  // 4. Yearly Report: Jan 1st at 04:00 AM (Generates report for previous year)
  cron.schedule('0 4 1 1 *', async () => {
    console.log('Running Yearly Report Task...');
    try {
      if (!(await checkScheduleConfig('schedule_yearly'))) {
        console.log('Yearly report schedule is disabled.');
        return;
      }

      const today = new Date();
      const lastYearStart = startOfYear(subYears(today, 1));
      const lastYearEnd = endOfYear(subYears(today, 1));
      
      const startDate = format(lastYearStart, 'yyyy-MM-dd');
      const endDate = format(lastYearEnd, 'yyyy-MM-dd');

      const users = await prisma.user.findMany({ where: { status: 'ACTIVE' } });
      for (const user of users) {
        try {
          await generateReport('YEARLY', startDate, endDate, user.id);
          console.log(`Generated Yearly Report for user ${user.id}`);
        } catch (err) {
          console.error(`Failed to generate Yearly Report for user ${user.id}:`, err);
        }
      }
    } catch (error) {
      console.error('Error in Yearly Report Task:', error);
    }
  });

  console.log('Scheduler Initialized.');
}
