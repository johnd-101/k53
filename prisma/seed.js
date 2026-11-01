const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const count = await prisma.learnerQuestion.count();
  if (count > 5) { console.log(`Already ${count} questions`); return; }
  await prisma.learnerQuestion.createMany({
    data: [
      { questionText: "Urban speed limit unless indicated?", optionA: "40", optionB: "60", optionC: "80", correctAnswer: "B", category: "Rules", explanation: "60km/h urban" },
      { questionText: "What does STOP sign mean?", optionA: "Slow", optionB: "Stop and proceed when safe", optionC: "Yield", correctAnswer: "B", category: "Signs", explanation: "Complete stop" },
    ]
  });
  console.log("Seeded");
}
main().finally(()=>prisma.$disconnect());



