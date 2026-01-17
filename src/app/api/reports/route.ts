import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const where: any = { userId: user.id };
  if (type) where.type = type.toUpperCase();

  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(reports);
}
