import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";
import path from "path";

const dbPath = path.resolve(__dirname, "../dev.db");
export const dbUrl = process.env.DATABASE_URL || `file:${dbPath}`;

const adapter = new PrismaLibSql({
  url: dbUrl,
  authToken: process.env.DB_AUTH_TOKEN,
});

export const prisma = new PrismaClient({ adapter });