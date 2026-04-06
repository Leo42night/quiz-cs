// models/question.model.ts
import { prisma } from "./../../prisma/db";
import { isJsonArray } from "../utils";
import type { Question } from "shared";
import type { QuestionDBType } from "src/types";

function saveToString(value: any) {
  if (Array.isArray(value)) return JSON.stringify(value);  // actual array → stringify
  if (isJsonArray(value)) return value;                    // sudah string JSON array → biarkan
  if (typeof value === "number") return value.toString()   // number jadikan string
  return value;                                            // string biasa / number → biarkan}
}

export const QuestionModel = {
  async create(data: Question) {
    const newData: QuestionDBType = { ...data, answer: saveToString(data.answer), correct_answer: saveToString(data.correct_answer) }
    const result = await prisma.questions.create({ data: newData });
    return { success: true, lastInsertRowid: result.id };
  },

  async findAll() {
    return prisma.questions.findMany();
  },
  async findAllByDateLimit(date: number) {
    return prisma.questions.findMany({
      where: {
        updated_at: {
          gte: date
        }
      }
    });
  },
  async length() {
    return prisma.questions.findMany();
  },

  async findById(id: number) {
    return prisma.questions.findUnique({
      where: { id }
    });
  },

  async findByCategory(category: number) {
    return prisma.questions.findMany({
      where: { category }
    });
  },

  async update(id: number, data: Partial<Question>) {
    const newData = { ...data, answer: saveToString(data.answer), correct_answer: saveToString(data.correct_answer) }
    return prisma.questions.update({
      where: { id },
      data: newData,
    });
  },

  async delete(id: number) {
    return await prisma.$transaction(async (tx) => {
      await tx.user_questions.deleteMany({ where: { user_id: id } });
      return await tx.questions.delete({
        where: { id }
      });
    });
  },
};