import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: any = {};
  if (body.questionText || body.question_text) data.questionText = body.questionText || body.question_text;
  if (body.optionA || body.option_a) data.optionA = body.optionA || body.option_a;
  if (body.optionB || body.option_b) data.optionB = body.optionB || body.option_b;
  if (body.optionC || body.option_c) data.optionC = body.optionC || body.option_c;
  if (body.correctAnswer || body.correct_answer) data.correctAnswer = body.correctAnswer || body.correct_answer;
  if (body.category) data.category = body.category;
  if (body.explanation !== undefined) data.explanation = body.explanation;
  if (body.imageData !== undefined || body.image_data !== undefined) data.imageData = body.imageData || body.image_data;

  const updated = await prisma.learnerQuestion.update({ where: { id: parseInt(params.id) }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.learnerQuestion.delete({ where: { id: parseInt(params.id) } });
  return NextResponse.json({ success: true });
}
