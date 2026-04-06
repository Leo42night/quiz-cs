// services/question.service.ts
import type { Question } from "shared";
import { QuestionModel } from "./../models/question.model";

export const QuestionService = {
  async create(data: Question) {
    return QuestionModel.create(data);
  },

  async findAll() {
    return QuestionModel.findAll();
  },
  async length() {
    const data = await QuestionModel.length();
    if (!data) return 0;
    return data.length;
  },

  async findById(id: number) {
    const question = await QuestionModel.findById(id);
    if (!question) throw new Error("Question not found");
    return question;
  },

  async findByCategory(category: number) {
    return QuestionModel.findByCategory(category);
  },

  async update(id: number, data: Partial<Question>) {
    // console.log("data:", data);
    await QuestionService.findById(id);
    return QuestionModel.update(id, data);
  },

  async delete(id: number) {
    await QuestionService.findById(id);
    return QuestionModel.delete(id);
  },
};