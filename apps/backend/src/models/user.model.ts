import { prisma } from "./../../prisma/db";

export const UserModel = {
  async findByEmail(email: string) {
    return prisma.users.findUnique({
      where: { email }
    });
  },


  async create(name: string, email: string, profile_url?: string, score_max?: number, score?: number) {
    const result = await prisma.users.create({
      data: { name, email, profile_url, score_max, score },
    });

    return {
      lastInsertRowid: result.id,
    };
  },

  async findAll() {
    return prisma.users.findMany();
  },

  async findById(id: number) {
    return prisma.users.findUnique({
      where: { id },
    });
  },

  async update(id: number, data: { name?: string; email?: string; profile_url?: string; score_max?: number; score?: number }) {
    return prisma.users.update({
      where: { id },
      data,
    });
  },
  async updateScore(email: string, data: { score_max?: number; score?: number }) {
    return prisma.users.update({
      where: { email },
      data,
    });
  },

  async delete(id: number) {
    return await prisma.$transaction(async (tx: any) => {
      await tx.user_questions.deleteMany({ where: { user_id: id } });
      return await tx.users.delete({
        where: { id }
      });
    });
  }
};