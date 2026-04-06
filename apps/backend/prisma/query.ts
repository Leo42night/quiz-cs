import { join } from "path";
import { prisma } from "./db";
import { readFileSync } from "fs";

const sql = readFileSync(join(__dirname, "../data.sql"), "utf-8");

const statements = sql
  .split(";")
  .map(s => s.trim())
  .filter(s => s.length > 0);

await prisma.$transaction(async (tx) => {
  for (const statement of statements) {
    await tx.$executeRawUnsafe(statement);
  }
});

await prisma.$disconnect();