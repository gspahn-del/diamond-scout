import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seasons } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  const all = await db.select().from(seasons).orderBy(desc(seasons.year));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, year, startDate, endDate } = body;
  if (!name || !year) return NextResponse.json({ error: 'name and year required' }, { status: 400 });

  // Deactivate all other seasons first
  await db.update(seasons).set({ isActive: 0 });

  const result = await db.insert(seasons)
    .values({ name, year, startDate, endDate, isActive: 1 })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
