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
      // Pastikan correctAnswer sudah di-parse menjadi array jika string JSON
      const patterns = Array.isArray(correctAnswer)
        ? correctAnswer
        : [correctAnswer];

      // Pastikan userAnswer juga diperlakukan sebagai array
      const userAnswers = Array.isArray(userAnswer)
        ? userAnswer
        : [userAnswer];

      // Logika Validasi:
      // 1. Jumlah placeholder harus sama dengan jumlah jawaban user
      if (patterns.length !== userAnswers.length) {
        isCorrect = false;
      } else {
        // 2. Cek setiap indeks: userAnswers[i] harus cocok dengan regex patterns[i]
        isCorrect = patterns.every((pattern, i) => {
          try {
            // Tambahkan ^ dan $ agar match secara persis (exact match)
            // Gunakan template literal untuk memastikan pattern bersih
            const regex = new RegExp(`^${pattern}$`);
            const isMatch = regex.test(userAnswers[i]);

            // console.log(`Testing index [${i}]: "${userAnswers[i]}" against /${pattern}/ -> ${isMatch}`);
            return isMatch;
          } catch (e) {
            console.error("Invalid Regex Pattern:", pattern);
            return false;
          }
        });
      }
  }

  // Simulasi fetch (Opsional jika ingin tetap kirim ke API)
  /*
  const res = await fetch("http://localhost:3000/api/answer", { ... });
  return await res.json();
  */

  // Return hasil simulasi
  return { correct: isCorrect };
}