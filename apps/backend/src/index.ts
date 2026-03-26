import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { userRoute } from "./routes/user.route";
import { questionRoute } from "./routes/question.route";
import 'dotenv/config';
import { prisma } from "@/prisma/db";
// ok
const isBrowserRequest = (request: Request): boolean => {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const accept = request.headers.get("accept") ?? "";

  // Browser biasanya kirim Accept: text/html
  const acceptsHtml = accept.includes("text/html");

  // Tidak ada origin & referer = direct browser access / curl
  // Tapi curl tidak kirim Accept: text/html, browser kirim
  return acceptsHtml && !origin && !referer;
};

const app = new Elysia()
  .use(cors({ origin: [process.env.FRONTEND_URL ?? "", process.env.TEST_URL ?? ""] }))
  .use([swagger()])
  .onRequest(({ request, set }) => {
    const origin = request.headers.get("origin");
    const frontendUrl = process.env.FRONTEND_URL ?? "";

    // Jika request dari FRONTEND_URL → langsung izinkan
    if (origin && origin === frontendUrl) return;

    // Jika akses dari browser langsung → wajib ada ?key=
    if (isBrowserRequest(request)) {
      const url = new URL(request.url);
      const key = url.searchParams.get("key");

      if (!key || key !== process.env.API_KEY) {
        set.status = 401;
        return { message: "Unauthorized: missing or invalid key" };
      }
    }
  })
  .onError(({ code, status, set }) => {
    if (code === "NOT_FOUND") return status(404, "Not Found :(");
  })
  .group("/api", (app) =>
    app
      .use([userRoute, questionRoute])
      .get("/", () => "Hello API")
      .get("/test-user/:id", ({ params }) => {
        const id = Number(params.id);
        return prisma.users.findUnique({ where: { id } });
      })
  )
  .get("/", () => ({
    data: { status: "ok" },
    message: "server running",
  }));

if (process.env.NODE_ENV != "production") {
  app.listen(3000);
  console.log(`🦊 Backend → http://localhost:3000`);
  console.log(`🦊 TEST_URL: ${process.env.TEST_URL}`);
  console.log(`🦊 DATABASE_URL: ${process.env.DATABASE_URL}`);
}

export default app;
// POST login -> savelogin -> setcookie -> go to frontend (check cookie) -> get questions
// GET list questions
// questions/<i>
// questions/<i>/answers
// 