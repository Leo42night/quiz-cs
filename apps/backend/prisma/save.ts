// db[tabel questions] -> json
import { prisma } from './db';
import path from "path";
import { writeFileSync } from "fs";

async function exportQuestions() {
  console.log("📦 Exporting questions...");

  try {
    // 1. Ambil semua data dari DB
    const questions = await prisma.questions.findMany();

    // 2. Tentukan path file output
    const outputPath = path.resolve(__dirname, "../questions.json");

    // 3. Simpan ke file JSON (pretty format)
    writeFileSync(
      outputPath,
      JSON.stringify(questions, null, 2),
      "utf-8"
    );

    console.log(`✅ Berhasil export ${questions.length} data ke:`);
    console.log(outputPath);
  } catch (error) {
    console.error("❌ Gagal export:", error);
  }
}

async function main() {
  await exportQuestions();
}

main().finally(() => prisma.$disconnect());