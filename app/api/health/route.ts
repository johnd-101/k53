import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const count = await prisma.learnerQuestion.count();
    return NextResponse.json({ connected: true, database: 'postgres', table: 'learner_questions', count });
  } catch (e: any) {
    return NextResponse.json({ connected: false, error: e.message }, { status: 500 });
  }
}
