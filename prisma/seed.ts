// prisma/seed.ts
import fs from 'fs'
import { parse } from 'csv-parse/sync'
import { prisma } from '@/lib/prisma'
const csv = fs.readFileSync('./sa_learner_k53_with_images.csv', 'utf-8')
const records = parse(csv, { columns: true })
await prisma.learnerQuestion.createMany({
  data: records.map((r:any) => ({
    questionText: r.question_text,
    optionA: r.option_a,
    optionB: r.option_b,
    optionC: r.option_c,
    correctAnswer: r.correct_answer,
    category: r.category,
    explanation: r.explanation,
    imageData: r.image_data || null, // <-- base64 SVG
  }))
})