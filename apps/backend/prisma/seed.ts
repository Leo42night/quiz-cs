// turso hanya export ke json, csv, xlsx, jadi kita pakai ini untuk sync dari prod ke local
import { prisma, dbUrl } from './db';
import path from "path";
import { formatToString } from './../src/utils';
import type { Question } from 'shared';

console.log("seed into dbUrl...", dbUrl);

async function seedStudents() {
  // load student-a.json & student-b.json
  const studentA = JSON.parse(await Bun.file(path.resolve(__dirname, "../data/students.json")).text());
  // const studentB = JSON.parse(await Bun.file(path.resolve(__dirname, "../data/data-students-b.json")).text());
  // merge student-a.json & student-b.json
  // const students = [...studentA, ...studentB];
  const students = [...studentA];
  // loop periksa apakah ada students.email yg sama
  try {
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

    console.log(`✅ Berhasil! ${students.length} data Students ditambahkan.`);
    return "ok"; // Pastikan mengembalikan sesuatu
  } catch (error) {
    console.error("❌ Gagal push ke DB:", error);
    throw error; // Lempar error agar seedUserQuestion tidak jalan
  }
}

async function seedQuestions() {
  console.log("seed Questions...");
  // 1. Load data
  const fileContent = await Bun.file(path.resolve(__dirname, "../data/questions.json")).text();
  const questions = JSON.parse(fileContent);

  // 2. Transform data
  const question_clear: Question[] = questions.map((question: any) => ({
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
      // Gunakan Promise.all dengan benar dengan menambahkan 'async/await' di dalam .map
      const results = await Promise.all(
        question_clear.map(async (q: Question) => {
          const upData = {
            type: q.type,
            category: q.category,
            language: q.language,
            answer: typeof q.answer === 'string' ? q.answer : JSON.stringify(q.answer),
            correct_answer: typeof q.correct_answer === 'string' ? q.correct_answer : JSON.stringify(q.correct_answer),
            difficulty: q.difficulty,
            points: q.points,
          };

          const createData = {
            ...upData,
            question: q.question,
          };

          // Tambahkan return await agar hasilnya masuk ke array 'results'
          return await prisma.questions.upsert({
            where: {
              question: q.question,
            },
            update: upData,
            create: createData,
          });
        })
      );

      // results.length otomatis mewakili jumlah data yang berhasil di-upsert
      const totalBerhasil = results.length;

      console.log(`✅ Berhasil! ${totalBerhasil} data Questions ditambahkan/diperbarui.`);
      return 0; // Pastikan mengembalikan sesuatu
    } catch (error) {
      console.error("❌ Gagal push ke DB:", error);
      throw error; // Lempar error agar seedUserQuestion tidak jalan
    }
  } else {
    console.log("❌ Seeding dibatalkan oleh user.");
    process.exit(0); // Berhenti jika user batal
  }
}

async function seedNewQuestions() {
  console.log("🔍 Loading data from JSON...");

  // 1. Load data
  const filePath = path.resolve(__dirname, "../data/quiz-new.json");
  const fileContent = await Bun.file(filePath).text();
  const questions = JSON.parse(fileContent);

  if (!Array.isArray(questions) || questions.length === 0) {
    console.log("⚠️ Data kosong atau tidak valid.");
    return;
  }

  // 2. Transform & Preview
  const question_prepared = questions.map((q: any) => ({
    id: q.id, // Pastikan ID disertakan untuk update
    category: q.category,
    language: q.language,
    type: q.type,
    question: q.question,
    answer: typeof q.answer === 'string' ? q.answer : JSON.stringify(q.answer),
    correct_answer: typeof q.correct_answer === 'string' ? q.correct_answer : JSON.stringify(q.correct_answer),
    difficulty: q.difficulty,
    points: q.points,
    updated_at: q.updated_at || Date.now()
  }));

  console.log("\n=== 📝 SEEDING PREVIEW (UPDATE MODE) ===");
  console.log(`Total data terdeteksi: ${question_prepared.length} baris`);

  // Tambahkan pengecekan jika data ada
  if (question_prepared.length > 0) {
    const sample = question_prepared[0];
    console.log(`Sampel data (ID: ${sample?.id ?? 'N/A'}):`, {
      question: sample?.question?.substring(0, 50) + "...",
      updated_at: sample?.updated_at
    });
  } else {
    console.log("⚠️ Tidak ada data untuk ditampilkan.");
  }
  console.log("========================================\n");

  // 3. Konfirmasi
  const input = prompt("Konfirmasi: Update database berdasarkan ID di atas? (y/N):");

  if (input?.toLowerCase() === 'y') {
    console.log("🚀 Memulai proses sinkronisasi...");
    let updateCount = 0;
    let errorCount = 0;

    try {
      // Kita gunakan loop karena Prisma tidak punya 'updateMany' dengan data berbeda per baris
      for (const item of question_prepared) {
        // Guard Clause: Pastikan ID ada dan bukan undefined/null
        if (item.id === undefined || item.id === null) {
          console.error(`❌ Skip: Baris ini tidak punya ID. Question: "${item.question?.substring(0, 20)}..."`);
          errorCount++;
          continue;
        }

        // Destructuring ID setelah dipastikan ada (Type Assertion 'as number' jika perlu)
        const targetId = item.id as number;
        const { id, ...dataToUpdate } = item;

        await prisma.questions.upsert({
          where: { id: targetId },
          update: dataToUpdate,
          create: item,
        });

        updateCount++;
      }

      console.log(`\n\n✅ Selesai!`);
      console.log(`- Berhasil di-sync: ${updateCount} data`);
      if (errorCount > 0) console.log(`- Gagal/Skip: ${errorCount} data`);

    } catch (error) {
      console.error("\n❌ Gagal saat proses update:", error);
      throw error;
    }
  } else {
    console.log("❌ Seeding dibatalkan.");
    process.exit(0);
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
    console.log("Berhasil! " + result.count + " data UserQuestions ditambahkan.");
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
    // await seedNewQuestions();
    // await seedUserQuestion(); // riwayat pertanyaan yang berhasil dijawab
  } catch (error) {
    console.error(error);
  }
}

main().finally(() => prisma.$disconnect())