import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";
import path from "path";

const dbPath = path.resolve(__dirname, "../dev.db");

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || `file:${dbPath}`,
  authToken: process.env.DB_AUTH_TOKEN,
});

export const prisma = new PrismaClient({ adapter });