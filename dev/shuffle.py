# Script untuk acak urutan jawaban di database,
# khusus untuk type=1 dan type=2 yang correct_answer-nya
# masih default (0 untuk type=1, [0,1,2] untuk type=2).
import requests
import json
import random

BASE_URL = "http://localhost:3000"
HEADERS = {"Content-Type": "application/json"}


def shuffle_single(answer_list, correct_index):
    """Acak urutan jawaban dan sesuaikan correct_index."""
    indexed = list(enumerate(answer_list))
    random.shuffle(indexed)
    new_answers = [text for _, text in indexed]
    new_correct = next(
        i for i, (orig_i, _) in enumerate(indexed) if orig_i == correct_index
    )
    return new_answers, new_correct


def shuffle_multi(answer_list, correct_indices):
    """Acak urutan jawaban dan sesuaikan correct_indices."""
    combined = [
        {"text": text, "is_correct": i in correct_indices}
        for i, text in enumerate(answer_list)
    ]
    random.shuffle(combined)
    new_answers = [item["text"] for item in combined]
    new_correct = [i for i, item in enumerate(combined) if item["is_correct"]]
    return new_answers, new_correct


def main():
    try:
        response = requests.get(BASE_URL + "/api/questions/real", headers=HEADERS)
        response.raise_for_status()
        questions = response.json()

        print("\n--- PREVIEW DATA ---")
        print(json.dumps(questions[:2], indent=2))
        print(f"Total data ditemukan: {len(questions)}")

        confirm = input("\nApakah data di atas sudah benar? (y/n): ").lower()
        if confirm != "y":
            print("Proses dibatalkan.")
            return

        for q in questions:
            q_type = q.get("type")
            q_id = q.get("id")

            # --- Type 1: single answer ---
            if q_type == 1:
                try:
                    answers = (
                        q["answer"]
                        if isinstance(q["answer"], list)
                        else json.loads(q["answer"])
                    )
                    correct_index = int(q["correct_answer"])
                except (ValueError, TypeError, json.JSONDecodeError):
                    continue

                if correct_index != 0:
                    continue

                print(f"\nMemproses type=1 ID: {q_id} - {q['question'][:40]}...")
                new_answers, new_correct = shuffle_single(answers, correct_index)

                put_res = requests.put(
                    f"{BASE_URL}/api/questions/{q_id}",
                    json={
                        "answer": json.dumps(new_answers),
                        "correct_answer": str(new_correct),
                    },
                    headers=HEADERS,
                )

                if put_res.status_code == 200:
                    print(f"  ✓ Berhasil. New correct index: {new_correct}")
                else:
                    print(f"  ✗ Gagal: {put_res.status_code} {put_res.text}")

            # --- Type 2: multi answer ---
            elif q_type == 2:
                try:
                    answers = json.loads(q["answer"])
                    corrects = json.loads(q["correct_answer"])
                except (json.JSONDecodeError, TypeError):
                    continue

                if corrects != [0, 1, 2]:
                    continue

                print(f"\nMemproses type=2 ID: {q_id} - {q['question'][:40]}...")
                new_answers, new_corrects = shuffle_multi(answers, corrects)

                put_res = requests.put(
                    f"{BASE_URL}/api/questions/{q_id}",
                    json={
                        "answer": json.dumps(new_answers),
                        "correct_answer": json.dumps(new_corrects),
                    },
                    headers=HEADERS,
                )

                if put_res.status_code == 200:
                    print(f"  ✓ Berhasil. New correct indices: {new_corrects}")
                else:
                    print(f"  ✗ Gagal: {put_res.status_code} {put_res.text}")

    except Exception as e:
        print(f"Terjadi kesalahan: {e}")


if __name__ == "__main__":
    main()
