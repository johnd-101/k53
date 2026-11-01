import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const samples = [
  { questionText: "In an urban area, unless otherwise indicated, speed limit is:", optionA: "40 km/h", optionB: "60 km/h", optionC: "80 km/h", correctAnswer: "B" as const, category: "Rules" as const, explanation: "General urban limit 60km/h in SA" },
  { questionText: "What does a red octagonal sign with STOP mean?", optionA: "Slow down", optionB: "Stop and proceed only when safe", optionC: "Yield to traffic", correctAnswer: "B" as const, category: "Signs" as const, explanation: "Must come to complete stop" },
  { questionText: "When should you check your blind spot?", optionA: "Only when reversing", optionB: "Before changing direction", optionC: "Only on highway", correctAnswer: "B" as const, category: "Controls" as const, explanation: "K53 requires blind spot check before any direction change" },
  { questionText: "Legal alcohol limit for normal driver in SA?", optionA: "0.05g/100ml", optionB: "0.00g/100ml", optionC: "0.08g/100ml", correctAnswer: "A" as const, category: "Rules" as const, explanation: "0.05% normal, 0.02% professional" },
  { questionText: "Following distance in good conditions should be:", optionA: "1 second", optionB: "2 seconds", optionC: "3 seconds", correctAnswer: "B" as const, category: "Rules" as const, explanation: "2 sec rule, 3+ in bad weather" },
  { questionText: "What does a yellow diamond sign indicate?", optionA: "Regulatory", optionB: "Warning / hazard ahead", optionC: "Information", correctAnswer: "B" as const, category: "Signs" as const, explanation: "Yellow diamond = warning" },
];

export async function POST() {
  try {
    const existing = await prisma.learnerQuestion.count();
    if (existing > 10) return NextResponse.json({ message: 'Already seeded', count: existing });
    const result = await prisma.learnerQuestion.createMany({ data: samples });
    return NextResponse.json({ seeded: result.count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
