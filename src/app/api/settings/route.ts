import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const configs = await prisma.systemConfig.findMany();
  const configMap: Record<string, string> = {};
  configs.forEach(c => configMap[c.key] = c.value);
  return NextResponse.json(configMap);
}

export async function POST(request: Request) {
  const body = await request.json();
  // Body: { "ai_provider": "openai", "ai_api_key": "..." }
  
  const entries = Object.entries(body);
  
  await prisma.$transaction(
    entries.map(([key, value]) => 
      prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );
  
  return NextResponse.json({ success: true });
}
