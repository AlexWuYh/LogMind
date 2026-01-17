import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  
  const whereClause: any = { userId: session.user.id };
  if (from && to) {
    whereClause.date = {
      gte: from,
      lte: to,
    };
  }

  const logs = await prisma.dailyLog.findMany({
    where: whereClause,
    orderBy: { date: 'desc' },
    include: { items: true },
  });

  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { date, items, tomorrowPlan, summary, progress, priority, project } = body;
  
  if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert DailyLog
      const log = await tx.dailyLog.upsert({
        where: {
          userId_date: {
            userId: session.user.id!,
            date: date,
          },
        },
        update: {
          tomorrowPlan,
          summary,
          progress: Number(progress || 0),
          priority,
          project,
        },
        create: {
          userId: session.user.id!,
          date,
          tomorrowPlan,
          summary,
          progress: Number(progress || 0),
          priority,
          project,
        },
      });

      // 2. Handle Items
      if (items && Array.isArray(items)) {
         const currentItems = await tx.dailyWorkItem.findMany({
           where: { dailyLogId: log.id }
         });
         const currentItemIds = currentItems.map(i => i.id);
         const newItemIds = items.filter((i: any) => i.id).map((i: any) => i.id);
         
         // Delete removed items
         const itemsToDelete = currentItemIds.filter(id => !newItemIds.includes(id));
         if (itemsToDelete.length > 0) {
           await tx.dailyWorkItem.deleteMany({
             where: { id: { in: itemsToDelete } }
           });
         }

         // Upsert items
         for (const item of items) {
           if (item.id && currentItemIds.includes(item.id)) {
             await tx.dailyWorkItem.update({
               where: { id: item.id },
               data: {
                 content: item.content,
                 priority: item.priority,
                 progress: Number(item.progress || 0),
                 project: item.project,
               }
             });
           } else {
             await tx.dailyWorkItem.create({
               data: {
                 dailyLogId: log.id,
                 content: item.content,
                 priority: item.priority,
                 progress: Number(item.progress || 0),
                 project: item.project,
               }
             });
           }
         }
      }

      return tx.dailyLog.findUnique({
        where: { id: log.id },
        include: { items: true }
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving log:', error);
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 });
  }
}
