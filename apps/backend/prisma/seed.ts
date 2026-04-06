import { prisma } from './db';
import path from "path";
import { formatToString } from './../src/utils';

console.log("seed into DATABASE_URL...", process.env.DATABASE_URL);

async function seedStudents() {
  // load student-a.json & student-b.json
  const studentA = JSON.parse(await Bun.file(path.resolve(__dirname, "../data-students-a.json")).text());
  const studentB = JSON.parse(await Bun.file(path.resolve(__dirname, "../data-students-b.json")).text());
  // merge student-a.json & student-b.json
  const students = [...studentA, ...studentB];
  // loop periksa apakah ada students.email yg sama
  await Promise.all(
    students.map((student) =>
      prisma.users.upsert({
        where: { email: student.email },
        update: {
          name: student.name,
          // update field lainnya jika perlu
        },
        create: student,
      })
    )
  );
}

async function seedQuestions() {
  console.log("seed Questions...");
  // 1. Load data
  const fileContent = await Bun.file(path.resolve(__dirname, "../questions.json")).text();
  const questions = JSON.parse(fileContent);

  // 2. Transform data
  const question_clear = questions.map((question: any) => ({
    ...question,
    answer: formatToString(question.answer),
    correct_answer: formatToString(question.correct_answer),
    updated_at: 0
  }));

  // 3. Tampilkan summary sebelum push
  console.log("\n=== SEEDING PREVIEW ===");
  console.log(`Total data yang akan di-push: ${question_clear.length} baris`);
  console.log("Contoh data pertama:", question_clear[0]);
  console.log("=======================\n");

  // 4. Konfirmasi menggunakan Bun prompt
  const input = prompt("Apakah Anda yakin ingin push ke database? (y/N):");

  if (input?.toLowerCase() === 'y') {
    console.log("🚀 Memulai proses seeding...");
    try {
      const result = await prisma.questions.createMany({ data: question_clear });
      console.log(`✅ Berhasil! ${result.count} data telah ditambahkan.`);
      return result; // Pastikan mengembalikan sesuatu
    } catch (error) {
      console.error("❌ Gagal push ke DB:", error);
      throw error; // Lempar error agar seedUserQuestion tidak jalan
    }
  } else {
    console.log("❌ Seeding dibatalkan oleh user.");
    process.exit(0); // Berhenti jika user batal
  }
}

async function seedUserQuestion() {
  const newUserQuestions = [
    {
      user_id: 1,
      question_id: 1
    },
    {
      user_id: 1,
      question_id: 2
    },
    {
      user_id: 1,
      question_id: 3
    },
    {
      user_id: 1,
      question_id: 4
    }
  ];

  try {
    const result = await prisma.user_questions.createMany({ data: newUserQuestions });
    console.log("Berhasil! " + result.count + " data telah ditambahkan.");
  } catch (e) {
    console.error("❌ Gagal push ke DB:", e);
    throw e;
  }
}
async function main() {
  try {
    console.log("start seed in...", process.cwd());
    // await seedStudents();
    await seedQuestions();
    // await seedUserQuestion();
  } catch (error) {
    console.error(error);
  }
}

main().finally(() => prisma.$disconnect())