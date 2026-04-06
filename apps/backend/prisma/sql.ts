import { join } from "path";
import { prisma } from "./db";
import { readFileSync } from "fs";

// const sql = readFileSync(join(__dirname, "../data.sql"), "utf-8");
const sql = readFileSync(join(__dirname, "../data-local.sql"), "utf-8");

const statements = sql
  .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
  .map((s, i) => ({
    query: s.trim(),
    index: i + 1
  }))
  .filter(s => s.query.length > 0);

await prisma.$transaction(async (tx) => {
  for (const stmt of statements) {
    try {
      console.log(`\n▶️ [${stmt.index}] Executing:`);
      console.log(stmt.query.slice(0, 200)); // preview query

      await tx.$executeRawUnsafe(stmt.query);

      console.log(`✅ [${stmt.index}] Success`);
    } catch (error) {
      console.error(`\n❌ ERROR di statement ke-${stmt.index}`);
      console.error("Query:");
      console.error(stmt.query);
      console.error("Error:");
      console.error(error);

      throw error; // stop transaction
    }
  }
});

await prisma.$disconnect();