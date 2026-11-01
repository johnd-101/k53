import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  
  const where: any = {};
  if (category && category !== 'All') where.category = category;
  if (search) {
    where.OR = [
      { questionText: { contains: search, mode: 'insensitive' } },
      { explanation: { contains: search, mode: 'insensitive' } },
    ];
  }

  const questions = await prisma.learnerQuestion.findMany({ where, orderBy: { id: 'asc' } });
  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = {
    questionText: body.questionText || body.question_text,
    optionA: body.optionA || body.option_a,
    optionB: body.optionB || body.option_b,
    optionC: body.optionC || body.option_c,
    correctAnswer: body.correctAnswer || body.correct_answer,
    category: body.category,
    explanation: body.explanation || null,
    imageData: body.imageData || body.image_data || null,
  };
  const created = await prisma.learnerQuestion.create({ data });
  return NextResponse.json(created, { status: 201 });
}
