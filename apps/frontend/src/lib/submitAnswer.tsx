import type { Question } from "shared"
import { isJsonArray } from "shared";

export async function submitAnswer(
  question: Question,
  userAnswer: any
) {
  // question.correct_answer selalu string, jadi jika array stringify maka perlu convert
  const correctAnswer = isJsonArray(question.correct_answer) ? JSON.parse(question.correct_answer) : question.correct_answer;
  // console.log("submitAnswer (question, userAnswer)", question, userAnswer)
  // console.log("correctAnswer", correctAnswer)
  let isCorrect = false;

  switch (question.type) {
    case 1:
      // Single Choice: correct_answer "0" string, userAnswer number
      isCorrect = userAnswer.toString() === correctAnswer;
      break;

    case 2:
      // Multi Choice: correct_answer "[0, 1, 2]", userAnswer [0, 1]
      if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
        isCorrect =
          userAnswer.length === correctAnswer.length &&
          userAnswer.every(val => (correctAnswer as number[]).includes(val));
      }
      break;

    case 3:
      // Exact Answer (Array of strings): correct_answer "[\"sayHello\", \"console.log\"]"
      if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
        isCorrect = userAnswer.every((val: string, index) =>
          val.trim() === (correctAnswer as string[])[index]
        );
      }
      break;

    case 4:
      // ['error', 'error'] → new Set → ['error'] → join → "error" → ✅
      // ['error', 'message'] → ['error', 'message'] → join → "errormessage" → ❌
      // Regex: correct_answer "console\\.(log|error)"
      // userAnswer bisa string tunggal atau array string dari CodeFill
      // console.log(correctAnswer, userAnswer)
      const inputString = Array.isArray(userAnswer)
        ? [...new Set(userAnswer)].join("")
        : userAnswer;
      const regex = new RegExp(`^(${correctAnswer})$`);
      isCorrect = regex.test(inputString);
      break;
  }

  // Simulasi fetch (Opsional jika ingin tetap kirim ke API)
  /*
  const res = await fetch("http://localhost:3000/api/answer", { ... });
  return await res.json();
  */

  // Return hasil simulasi
  return { correct: isCorrect };
}