import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const userId = session.user.id;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString().split('T')[0];
  const monthStart = startOfMonth(now).toISOString().split('T')[0];
  const yearStart = startOfYear(now).toISOString().split('T')[0];

  const [weekCount, monthCount, yearCount, totalLogs, recentLogs, weeklyReports, monthlyReports, yearlyReports] = await Promise.all([
    prisma.dailyLog.count({ where: { userId, date: { gte: weekStart } } }),
    prisma.dailyLog.count({ where: { userId, date: { gte: monthStart } } }),
    prisma.dailyLog.count({ where: { userId, date: { gte: yearStart } } }),
    prisma.dailyLog.count({ where: { userId } }),
    prisma.dailyLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
    }),
    prisma.report.count({ where: { userId, type: 'WEEKLY' } }),
    prisma.report.count({ where: { userId, type: 'MONTHLY' } }),
    prisma.report.count({ where: { userId, type: 'YEARLY' } }),
  ]);
  
  const reportCount = weeklyReports + monthlyReports + yearlyReports;

  // Check today's status
  const todayStr = now.toISOString().split('T')[0];
  const todayLog = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId, date: todayStr } }
  });

  return NextResponse.json({
    weekCount,
    monthCount,
    yearCount,
    totalLogs,
    reportCount,
    reportStats: {
      weekly: weeklyReports,
      monthly: monthlyReports,
      yearly: yearlyReports,
    },
    recentLogs,
    todayLogged: !!todayLog,
    todayProgress: todayLog?.progress || 0,
  });
}
