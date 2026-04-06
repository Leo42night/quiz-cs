// routes/user.route.ts
import Elysia, { t } from "elysia";
import { UserService } from "../services/user.service";
import { UserQuestionService } from "../services/userQuestion.service";

export const userRoute = new Elysia({ prefix: "/users" })
  .get("/by-email", async ({ query: { email }, status }) => {
    try {
      const cleanEmail = decodeURIComponent(email);
      // console.log("cleanEmail", cleanEmail);
      return await UserService.findByEmail(cleanEmail);
    } catch (e) {
      return status(404, { message: "User not found", error: e });
    }
  }, {
    query: t.Object({
      email: t.String(),
    })
  })

  .get("/", async () => {
    return UserService.findAll();
  })
  .get("/length", async () => {
    return (await UserService.findAll()).length;
  })

  // untuk seeder di awal (lewat script py di repo class)
  .put("/score", async ({ body, status }) => {
    try {
      const email = body.email;
      return await UserService.updateScore(email, body);
    } catch (e) {
      return status(404, { message: "User not found" });
    }
  }, {
    body: t.Object({
      email: t.String(),
      score_max: t.Optional(t.Number()),
      score: t.Optional(t.Number()),
    }),
  })

  .get("/:id/question-ids", async ({ params: { id }, status }) => {
    try {
      return await UserQuestionService.findIdsByUser(Number(id));
    } catch (e) {
      return status(404, { message: "Riwayat quiz not found" });
    }
  })

  .post("/:id/question-ids", async ({ params: { id }, body, status }) => {
    try {
      return await UserQuestionService.saveIdsByUser(Number(id), body.new_answered_question_ids);
    } catch (e) {
      return status(404, { message: "Riwayat quiz failed to saved" });
    }
  }, {
    body: t.Object({
      new_answered_question_ids: t.Array(t.Number()),
    })
  })

  .get("/:id", async ({ params: { id }, status }) => {
    try {
      return await UserService.findById(Number(id));
    } catch (e) {
      return status(404, { message: "User not found" });
    }
  })

  .post("/", async ({ body, status }) => {
    try {
      return await UserService.create(body.email, body.name, body.profile_url || "", body.score_max || 0, body.score || 0);
    } catch (e) {
      return status(400, { message: "Bad request", error: e });
    }
  }, {
    body: t.Object({
      email: t.String(),
      name: t.String(),
      profile_url: t.Optional(t.String()),
      score_max: t.Optional(t.Number()),
      score: t.Optional(t.Number()),
    }),
  })

  .put("/:id", async ({ params: { id }, body, status }) => {
    try {
      return await UserService.update(Number(id), body);
    } catch (e) {
      return status(404, { message: "User not found" });
    }
  }, {
    body: t.Object({
      email: t.Optional(t.String()),
      name: t.Optional(t.String()),
      profile_url: t.Optional(t.String()),
      score_max: t.Optional(t.Number()),
      score: t.Optional(t.Number()),
    }),
  })

  .delete("/:id", async ({ params }) => {
    const id = Number(params.id);

    const user = await UserService.findById(id);

    if (!user) {
      return { message: "User not found" };
    }

    await UserService.delete(id);

    return { message: "Deleted successfully" };
  });