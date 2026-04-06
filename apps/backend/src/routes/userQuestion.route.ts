// routes/user.route.ts
import Elysia from "elysia";
import { UserQuestionService } from "../services/userQuestion.service";

export const userQuestionRoute = new Elysia({ prefix: "/user-questions" })
  .get("/", async () => {
    return UserQuestionService.findAll();
  });