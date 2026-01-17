import { NextResponse } from 'next/server';
import { generateReport } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { type, startDate, endDate } = await request.json();
    if (!type || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    
    const report = await generateReport(type, startDate, endDate);
    return NextResponse.json(report);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
}
