import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Helper to check if string is date YYYY-MM-DD
function isDateString(str: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params; // id can be UUID or Date

  if (isDateString(id)) {
    // It's a date, fetch by date
    const date = id;
    const log = await prisma.dailyLog.findUnique({
      where: {
        userId_date: {
          userId: session.user.id!,
          date: date,
        },
      },
      include: { items: true },
    });

    if (!log) {
      return NextResponse.json({ date, items: [], isNew: true });
    }
    return NextResponse.json(log);
  } else {
    // It's likely a UUID, fetch by ID
    const log = await prisma.dailyLog.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!log) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }
    
    // Auth check
    if (log.userId !== session.user.id && (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(log);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify ownership
    const log = await prisma.dailyLog.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!log) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    if (log.userId !== session.user.id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.dailyLog.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 });
  }
}
