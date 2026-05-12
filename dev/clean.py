# hapus postfix yang berawal MARKER di question, biasanya AI generate question dengan tambahan "bisa" atau "bisa juga" yang tidak diperlukan
import requests
import json

BACKEND_URL = "http://localhost:3000"
MARKER = "bisa"


def clean_question(text: str) -> str:
    idx = text.find(MARKER)
    if idx == -1:
        return text
    return text[:idx]


def main():
    # Fetch all questions
    res = requests.get(f"{BACKEND_URL}/api/questions/real")
    res.raise_for_status()
    questions = res.json()

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

    one = True
    for q in questions:
        question_text = q.get("question", "")
        if MARKER not in question_text:
            continue
        print("Question:", question_text)
        print(f"Marker '{MARKER}'")
        if one:
            one = False
            confirm = input("\nApakah data di atas sudah benar? (y/n): ").lower()
            if confirm != "y":
                print("Proses dibatalkan oleh pengguna.")
                return
        cleaned = clean_question(question_text)
        print(f"[{q['id']}] {question_text!r}")
        print(f"  → {cleaned!r}")

        # Matikan jika ingin melakukan update manual dulu
        # put_res = requests.put(
        #     f"{BACKEND_URL}/api/questions/{q['id']}", json={"question": cleaned}
        # )
        # if put_res.ok:
        #     print("✓ Updated\n")
        # else:
        #     print(f"  ✗ Failed: {put_res.status_code} {put_res.text}\n")


if __name__ == "__main__":
    main()
