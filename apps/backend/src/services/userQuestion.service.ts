// services/user_questions.service.ts
import { UserQuestionModel } from "../models/userQuestion.model";

export const UserQuestionService = {
  async findAll() {
    return UserQuestionModel.findAll();
  },

  async findIdsByUser(user_id: number) {
    return UserQuestionModel.findIdsByUser(user_id);
  },

  async saveIdsByUser(user_id: number, question_ids: number[]) {
    return UserQuestionModel.saveIdsByUser(user_id, question_ids);
  },

  async create(user_id: number, question_id: number) {
    return UserQuestionModel.create(user_id, question_id);
  },

  async delete(user_id: number, question_id: number) {
    return UserQuestionModel.delete(user_id, question_id);
  },
};