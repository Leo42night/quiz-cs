# mengupdate level score dari tiap question berdasarkan difficulty, 
# untuk memastikan tiap student bisa mencapai score max dengan usaha yang wajar (tanpa harus perfect menjawab semua soal)
import requests

# Konfigurasi
BASE_URL = "http://localhost:3000/api/questions"
KEY = "learn"
HEADERS = {"Content-Type": "application/json"}


def update_question_points():
    # 1. Ambil data questions
    fetch_url = f"{BASE_URL}/real"
    params = {"key": KEY}

    try:
        response = requests.get(fetch_url, params=params)
        response.raise_for_status()
        questions = response.json()

        # 2. Kalkulasi perubahan tanpa request apapun
        changes = []
        score_before = 0
        score_after = 0
        skipped = 0

        for q in questions:
            q_id = q.get("id")
            difficulty = q.get("difficulty")
            old_points = q.get("points", 0)
            score_before += old_points

            if difficulty == 3:
                new_points = 4
            elif difficulty == 2:
                new_points = 3
            elif difficulty == 1:
                new_points = 2
            else:
                skipped += 1
                continue

            score_after += new_points
            changes.append({
                "id": q_id,
                "difficulty": difficulty,
                "old": old_points,
                "new": new_points,
            })

        # 3. Tampilkan preview perubahan
        print("\n" + "=" * 55)
        print(f"{'ID':<8} {'Diff':<6} {'Lama':>6} {'Baru':>6} {'Delta':>8}")
        print("-" * 55)
        for c in changes:
            delta = c["new"] - c["old"]
            delta_str = f"+{delta}" if delta > 0 else str(delta)
            print(f"{c['id']:<8} {c['difficulty']:<6} {c['old']:>6} {c['new']:>6} {delta_str:>8}")
        print("=" * 55)
        print(f"{'Total Score Lama:':<30} {score_before:>6}")
        print(f"{'Total Score Baru:':<30} {score_after:>6}")
        net = score_after - score_before
        net_str = f"+{net}" if net > 0 else str(net)
        print(f"{'Net Change:':<30} {net_str:>6}")
        print(f"{'Soal dilewati (difficulty invalid):':<30} {skipped:>6}")
        print("=" * 55)

        if not changes:
            print("⚠️  Tidak ada soal yang perlu diupdate.")
            return

        # 4. Konfirmasi
        confirm = input("\nJalankan Update Score? (y/n) >> ").strip().lower()
        if confirm != "y":
            print("⏭️  Dibatalkan.")
            return

        # 5. Eksekusi PUT requests
        print(f"\nMemproses {len(changes)} soal...")
        success, failed = 0, 0

        for c in changes:
            update_url = f"{BASE_URL}/{c['id']}"
            payload = {"points": c["new"]}
            put_res = requests.put(update_url, params=params, json=payload, headers=HEADERS)

            if put_res.status_code == 200:
                print(f"[SUCCESS] ID {c['id']}: {c['old']} -> {c['new']} pts")
                success += 1
            else:
                print(f"[FAILED]  ID {c['id']}: Status {put_res.status_code}")
                failed += 1

        print(f"\nSelesai — {success} berhasil, {failed} gagal.")

    except Exception as e:
        print(f"Terjadi kesalahan: {e}")

if __name__ == "__main__":
    update_question_points()
