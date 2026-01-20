import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q) return NextResponse.json([]);

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json([]);
  }

  const logs = await prisma.dailyLog.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { summary: { contains: q } },
        { project: { contains: q } },
        { items: { some: { content: { contains: q } } } },
      ],
    },
    include: { items: true },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json(logs);
}
