import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';

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
        // Mock AI Generation
        const summary = `[AI Summary] User completed ${log.items.length} tasks. Key focus: ${log.items[0]?.project || 'General'}. Progress made: ${log.progress}%.`;
        
        await prisma.dailyLog.update({
          where: { id: log.id },
          data: { aiSummary: summary }
        });
        console.log(`Generated summary for log ${log.id}`);
      }
    } catch (error) {
      console.error('Error in AI Summary Task:', error);
    }
  });

  // 2. Weekly Report: Every Monday at 02:00 AM
  cron.schedule('0 2 * * 1', async () => {
    console.log('Running Weekly Report Task...');
    // Logic to generate weekly reports for all active users
    // (Simplified for demo)
  });

  // 3. Monthly Report: 1st of month at 03:00 AM
  cron.schedule('0 3 1 * *', async () => {
    console.log('Running Monthly Report Task...');
  });

  // 4. Yearly Report: Jan 1st at 04:00 AM
  cron.schedule('0 4 1 1 *', async () => {
    console.log('Running Yearly Report Task...');
  });

  console.log('Scheduler Initialized.');
}
