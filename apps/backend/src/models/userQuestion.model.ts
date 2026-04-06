// models/user_questions.model.ts
import { prisma } from "../../prisma/db";

export const UserQuestionModel = {
  async findAll() {
    return prisma.user_questions.findMany();
  },

  async findIdsByUser(user_id: number) {
    const data = await prisma.user_questions.findMany({
      where: { user_id },
      select: {
        question_id: true
      }
    });
    return data.map((item: any) => item.question_id);
  },

  async create(user_id: number, question_id: number) {
    return prisma.user_questions.create({
      data: { user_id, question_id }
    });
  },

  async saveIdsByUser(user_id: number, question_ids: number[]) {
    return prisma.user_questions.createMany({ data: question_ids.map((question_id) => ({ user_id, question_id })) });
  },

  async delete(user_id: number, question_id: number) {
    return prisma.user_questions.delete({
      where: { user_id_question_id: { user_id, question_id } }
    });
  },
};
