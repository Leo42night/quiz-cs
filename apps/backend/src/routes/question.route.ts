// routes/question.route.ts
import Elysia, { t } from "elysia";
import { QuestionService } from "../services/question.service";
import { Cipher, type Question } from 'shared'; // issue monorepo vercel elysia 
import { SEED } from "../utils";
import { Prisma } from "../generated/prisma/client";

export const questionRoute = new Elysia({ prefix: "/questions" })
  // security agak sulit (tapi masih bisa diakali)
  .get("/date-limit", async ({ query: { date }, status }) => {
    try {
      const dateLimit = date ?? (Date.now() - (60 * 60 * 1000)); // default 1 jam yg lalu
      return await QuestionService.findAllByDateLimit(dateLimit);
    } catch (e) {
      return status(404, { message: "Questions not found" });
    }
  }, {
    query: t.Object({
      date: t.Optional(t.Number())
    })
  })
  .get("/real", async ({ status }) => {
    try {
      return await QuestionService.findAll();
    } catch (e) {
      return status(404, { message: "Questions not found" });
    }
  })

  .get("/", async ({ status }) => {
    const data = await QuestionService.findAll();
    if (!SEED) return status(404, { message: "Env elemen not found" });
    const scrambled: string = Cipher.encode(JSON.stringify(data), SEED);
    return { data: scrambled };
  })

  // belum saatnya
  .get("/:id", async ({ params: { id }, status }) => {
    try {
      return await QuestionService.findById(Number(id));
    } catch (e) {
      return status(404, { message: "Question not found" });
    }
  })

  // 
  .get("/length", async ({ status }) => {
    try {
      return await QuestionService.length();
    } catch (e) {
      return status(404, { message: "Question length not found" });
    }
  })

  .get("/category/:category", async ({ params: { category } }) => {
    return QuestionService.findByCategory(Number(category));
  })

  .post("/", async ({ body, status }) => {
    try {
      return await QuestionService.create(body as Question);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientValidationError) {
        return status(400, { message: "Data tidak valid", error: e.message });
      }
      return status(400, { message: "Bad request" });
    }
  }, {
    body: t.Object({
      category: t.Number(),
      language: t.Number(),
      type: t.Number(),
      question: t.String(),
      answer: t.Union([t.String(), t.Array(t.String())]),
      correct_answer: t.Union([
        t.Number(),
        t.Array(t.Number()),
        t.String(),
        t.Array(t.String()),
      ]),
      difficulty: t.Number(),
      points: t.Number(),
      updated_at: t.Number()
    }),
  })

  .put("/:id", async ({ params: { id }, body, status }) => {
    try {
      return await QuestionService.update(Number(id), body as Partial<Question>);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientValidationError) {
        return status(400, { message: "Data tidak valid", error: e.message });
      }
      return status(404, { message: "Question not found" });
    }
  }, {
    body: t.Object({
      category: t.Optional(t.Number()),
      language: t.Optional(t.Number()),
      type: t.Optional(t.Number()),
      question: t.Optional(t.String()),
      answer: t.Optional(t.Union([t.String(), t.Array(t.String())])),
      correct_answer: t.Optional(t.Union([
        t.Number(),
        t.Array(t.Number()),
        t.String(),
        t.Array(t.String()),
      ])),
      difficulty: t.Optional(t.Number()),
      points: t.Optional(t.Number()),
      updated_at: t.Number()
    }),
  })

  // untuk development di swagger untuk cepat ubah data
  .put("/quick", async ({ body, status }) => {
    try {
      return await QuestionService.update(Number(body.id), body as Partial<Question>);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientValidationError) {
        return status(400, { message: "Data tidak valid", error: e.message });
      }
      return status(404, { message: "Question not found" });
    }
  }, {
    body: t.Object({
      id: t.Number(),
      category: t.Optional(t.Number()),
      language: t.Optional(t.Number()),
      type: t.Optional(t.Number()),
      question: t.Optional(t.String()),
      answer: t.Optional(t.Union([t.String(), t.Array(t.String())])),
      correct_answer: t.Optional(t.Union([
        t.Number(),
        t.Array(t.Number()),
        t.String(),
        t.Array(t.String()),
      ])),
      difficulty: t.Optional(t.Number()),
      points: t.Optional(t.Number()),
      updated_at: t.Number()
    }),
  })

  .delete("/:id", async ({ params: { id }, status }) => {
    try {
      await QuestionService.delete(Number(id));
      return { success: true };
    } catch (e) {
      return status(404, { message: "Question not found" });
    }
  });