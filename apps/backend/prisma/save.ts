// db[tabel] -> json
import { prisma } from './db';
import path from "path";
import { writeFileSync } from "fs";

async function exportDatas() {
  console.log("📦 Exporting users...");

  try {
    // 1. Ambil semua data dari DB
    const users = await prisma.users.findMany();

    // 2. Tentukan path file output
    const outputPath = path.resolve(__dirname, "../users.json");

    // 3. Simpan ke file JSON (pretty format)
    writeFileSync(
      outputPath,
      JSON.stringify(users, null, 2),
      "utf-8"
    );

    console.log(`✅ Berhasil export ${users.length} data ke:`);
    console.log(outputPath);
  } catch (error) {
    console.error("❌ Gagal export:", error);
  }
}

async function main() {
  await exportDatas();
}

main().finally(() => prisma.$disconnect());