import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, subWeeks, subMonths, subYears } from 'date-fns';
import { generateReport } from '@/lib/ai';

async function getScheduleConfig(key: string, defaultValue: string): Promise<string> {
  const config = await prisma.systemConfig.findUnique({
    where: { key }
  });
  return config?.value || defaultValue;
}

export function initScheduler() {
  console.log('Initializing Scheduler...');

  // 1. AI Summary: Every day at 01:00 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('Running Daily AI Summary Task...');
    // ... (Keep existing daily summary logic)
  });

  // Dynamic Task Wrapper
  const runTask = async (taskName: string, type: 'WEEKLY' | 'MONTHLY' | 'YEARLY', checkEnabledKey: string) => {
    try {
      if (await getScheduleConfig(checkEnabledKey, 'true') === 'false') {
        console.log(`${taskName} schedule is disabled.`);
        return;
      }

      console.log(`Running ${taskName} Task...`);
      const today = new Date();
      let startDate, endDate;

      if (type === 'WEEKLY') {
        const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        startDate = format(lastWeekStart, 'yyyy-MM-dd');
        endDate = format(lastWeekEnd, 'yyyy-MM-dd');
      } else if (type === 'MONTHLY') {
        const lastMonthStart = startOfMonth(subMonths(today, 1));
        const lastMonthEnd = endOfMonth(subMonths(today, 1));
        startDate = format(lastMonthStart, 'yyyy-MM-dd');
        endDate = format(lastMonthEnd, 'yyyy-MM-dd');
      } else {
        const lastYearStart = startOfYear(subYears(today, 1));
        const lastYearEnd = endOfYear(subYears(today, 1));
        startDate = format(lastYearStart, 'yyyy-MM-dd');
        endDate = format(lastYearEnd, 'yyyy-MM-dd');
      }

      const users = await prisma.user.findMany({ where: { status: 'ACTIVE' } });
      for (const user of users) {
        try {
          await generateReport(type, startDate, endDate, user.id);
          console.log(`Generated ${type} Report for user ${user.id}`);
        } catch (err) {
          console.error(`Failed to generate ${type} Report for user ${user.id}:`, err);
        }
      }
    } catch (error) {
      console.error(`Error in ${taskName} Task:`, error);
    }
  };

  // Schedule Checker (Runs every minute to check if dynamic tasks should run)
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentDay = now.getDate(); // 1-31
    const currentWeekDay = now.getDay(); // 0-6
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check Weekly
    const weeklyDay = parseInt(await getScheduleConfig('schedule_weekly_day', '1'));
    const [weeklyHour, weeklyMin] = (await getScheduleConfig('schedule_weekly_time', '02:00')).split(':').map(Number);
    
    if (currentWeekDay === weeklyDay && currentHour === weeklyHour && currentMinute === weeklyMin) {
      await runTask('Weekly Report', 'WEEKLY', 'schedule_weekly');
    }

    // Check Monthly
    const monthlyDay = parseInt(await getScheduleConfig('schedule_monthly_day', '1'));
    const [monthlyHour, monthlyMin] = (await getScheduleConfig('schedule_monthly_time', '03:00')).split(':').map(Number);
    
    if (currentDay === monthlyDay && currentHour === monthlyHour && currentMinute === monthlyMin) {
      await runTask('Monthly Report', 'MONTHLY', 'schedule_monthly');
    }

    // Check Yearly
    const yearlyMonth = parseInt(await getScheduleConfig('schedule_yearly_month', '1'));
    const yearlyDay = parseInt(await getScheduleConfig('schedule_yearly_day', '1'));
    const [yearlyHour, yearlyMin] = (await getScheduleConfig('schedule_yearly_time', '04:00')).split(':').map(Number);

    if (currentMonth === yearlyMonth && currentDay === yearlyDay && currentHour === yearlyHour && currentMinute === yearlyMin) {
      await runTask('Yearly Report', 'YEARLY', 'schedule_yearly');
    }
  });

  console.log('Scheduler Initialized (Dynamic Mode).');
}
