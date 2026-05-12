# Reset score semua user menjadi 0 (ketika fase selesai, atau untuk testing ulang)
import requests

# Konfigurasi
BASE_URL = "http://localhost:3000/api/users"
HEADERS = {"Content-Type": "application/json"}

def reset_all_users_score():
    # 1. Ambil data users
    try:
        print("Mengambil data user...")
        response = requests.get(BASE_URL)
        response.raise_for_status()
        users = response.json()

        if not users:
            print("⚠️  Tidak ada data user ditemukan.")
            return

        # 2. Kalkulasi Preview
        to_reset = []
        total_current_score = 0
        
        for u in users:
            u_id = u.get("id")
            name = u.get("name", "Unknown")
            current_score = u.get("score", 0)
            
            total_current_score += current_score
            to_reset.append({
                "id": u_id,
                "name": name,
                "old_score": current_score
            })

        # 3. Tampilkan Preview
        print("\n" + "=" * 50)
        print(f"{'ID':<6} {'Nama':<30} {'Score':>10}")
        print("-" * 50)
        for item in to_reset:
            print(f"{item['id']:<6} {item['name']:<30} {item['old_score']:>10}")
        print("=" * 50)
        print(f"Total User        : {len(to_reset)}")
        print(f"Total Score Global: {total_current_score}")
        print("Target Score Baru : 0 (RESET)")
        print("=" * 50)

        # 4. Konfirmasi
        confirm = input("\n⚠️  Anda yakin ingin RESET semua score menjadi 0? (y/n) >> ").strip().lower()
        if confirm != "y":
            print("⏭️  Operasi dibatalkan.")
            return

        # 5. Eksekusi PUT requests
        print(f"\nMemproses reset {len(to_reset)} user...")
        success, failed = 0, 0

        for item in to_reset:
            # Gunakan endpoint detail: /api/users/{id}
            update_url = f"{BASE_URL}/{item['id']}"
            payload = {"score": 0}
            
            try:
                put_res = requests.put(update_url, json=payload, headers=HEADERS)
                
                if put_res.status_code == 200:
                    print(f"[SUCCESS] ID {item['id']} ({item['name']}): Reset to 0")
                    success += 1
                else:
                    print(f"[FAILED]  ID {item['id']}: Status {put_res.status_code} - {put_res.text}")
                    failed += 1
            except Exception as e:
                print(f"[ERROR]   ID {item['id']}: {str(e)}")
                failed += 1

        print(f"\nSelesai — {success} berhasil direset, {failed} gagal.")

    except Exception as e:
        print(f"Terjadi kesalahan sistem: {e}")

if __name__ == "__main__":
    reset_all_users_score()