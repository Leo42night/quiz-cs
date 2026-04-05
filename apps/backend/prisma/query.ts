import { join } from "path";
import { prisma } from "./db";
import { readFileSync } from "fs";

const sql = readFileSync(join(__dirname, "../data.sql"), "utf-8");

// Regex handle statement escape element
const statements = sql
  .split(/;(?=(?:[^']*'[^']*')*[^']*$)/) // Memotong ";" hanya jika di luar tanda petik
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--')); // Abaikan komentar SQL

for (const statement of statements) {
  await prisma.$executeRawUnsafe(statement);
}

await prisma.$disconnect();