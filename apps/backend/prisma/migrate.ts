import { join } from "path";
// console.log(join(__dirname, "../data.sql")); // cek path yang dibaca
// console.log(join(import.meta.dir, "../data.sql")); // cek path yang dibaca
// process.exit(0);
import { prisma } from "./db";
import { readFileSync } from "fs";

const sql = readFileSync(join(__dirname, "../data.sql"), "utf-8");

const statements = sql
  .split(";")
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`Total statements: ${statements.length}`);
for (let i = 0; i < statements.length; i++) {
  if (statements[i].includes("Bun.file")) {
    console.log(`Found at index ${i}:`, JSON.stringify(statements[i]));
  }
}
process.exit(0);

for (const statement of statements) {
  await prisma.$executeRawUnsafe(statement);
}

await prisma.$disconnect();