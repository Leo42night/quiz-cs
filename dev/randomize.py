
import requests
import json
import random

# acak correct_answer
# Konfigurasi API
BASE_URL = "http://localhost:3000"
# Ganti dengan token jika API memerlukan autentikasi
HEADERS = {
    "Content-Type": "application/json",
    # "Authorization": "Bearer YOUR_TOKEN"
}


def shuffle_question_data(answer_list, correct_indices):
    """
    Mengacak urutan jawaban dan menyesuaikan index jawaban yang benar.
    """
    # Buat list of objects untuk menjaga relasi antara teks dan status 'correct'
    combined = []
    for i, text in enumerate(answer_list):
        combined.append({"text": text, "is_correct": i in correct_indices})

    # Acak urutan
    random.shuffle(combined)

    # Ekstrak kembali menjadi list jawaban baru dan index benar yang baru
    new_answers = [item["text"] for item in combined]
    new_correct_indices = [i for i, item in enumerate(combined) if item["is_correct"]]

    return new_answers, new_correct_indices


def main():
    try:
        # 1. GET data questions
        response = requests.get(BASE_URL + "/api/questions/real", headers=HEADERS)
        response.raise_for_status()
        questions = response.json()

        # --- TAMBAHAN KONFIRMASI ---
        print("\n--- PREVIEW DATA ---")
        print(
            json.dumps(questions[:2], indent=2)
        )  # Tampilkan 2 data pertama sebagai contoh
        print(f"Total data ditemukan: {len(questions)}")

        confirm = input("\nApakah data di atas sudah benar? (y/n): ").lower()
        if confirm != "y":
            print("Proses dibatalkan oleh pengguna.")
            return

        for q in questions:
            # Filter: type == 2
            if q.get("type") == 2:
                # Parsing stringify JSON dari API
                try:
                    answers = json.loads(q["answer"])
                    corrects = json.loads(q["correct_answer"])
                except (json.JSONDecodeError, TypeError):
                    continue
                print("\n--- MEMPROSES DATA ---")
                print(f"corrects: {corrects}")
                # Cek jika correct_answer adalah [0, 1, 2]
                if corrects == [0, 1, 2]:
                    print(f"Memproses ID: {q.get('id')} - {q.get('question')[:30]}...")

                    # 2. Proses Randomize
                    new_ans_list, new_corr_list = shuffle_question_data(
                        answers, corrects
                    )

                    # 3. Update data objek
                    q["answer"] = json.dumps(new_ans_list)
                    q["correct_answer"] = json.dumps(new_corr_list)

                    # Confirm sebelum run request PUT
                    print(f"New Answers: {new_ans_list}")
                    print(f"New Correct Indices: {new_corr_list}")
                    confirm = input("\nApakah data di atas sudah benar? (y/n): ").lower()
                    if confirm != "y":
                        qId = q.get('id')
                        print(f"Proses update dibatalkan untuk ID {qId}.")
                        continue

                    # 4. PUT ke API
                    question_id = q.get("id")
                    put_url = f"{BASE_URL}/api/questions/{question_id}"

                    put_res = requests.put(put_url, json=q, headers=HEADERS)

                    if put_res.status_code == 200:
                        print(
                            f"Berhasil update ID {question_id}. New Correct: {new_corr_list}"
                        )
                    else:
                        print(f"Gagal update ID {question_id}: {put_res.status_code}")

    except Exception as e:
        print(f"Terjadi kesalahan: {e}")


if __name__ == "__main__":
    main()
