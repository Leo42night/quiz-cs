# Periksa score di API apakah sudah mencapai Score Max
import requests

BASE_URL = "http://localhost:3000"
KEY = "learn"
HEADERS = {
    "Content-Type": "application/json",
}


def get_top_users():
    # 1. Melakukan request GET
    url = f"{BASE_URL}/api/users"
    params = {"key": KEY}

    try:
        response = requests.get(url, headers=HEADERS, params=params)
        response.raise_for_status()  # Cek apakah request berhasil

        users = response.json()

        # 2. Filter user berdasarkan logika: score >= score_max
        # Mengasumsikan data adalah list of dictionaries
        achievers = [
            user for user in users if user.get("score", 0) >= user.get("score_max", 0)
        ]

        # 3. Tampilkan hasil
        if achievers:
            print(f"--- Users yang Mencapai/Melebihi Target ({len(achievers)}) ---")
            for user in achievers:
                name = user.get("name", "Unknown")
                score = user.get("score")
                target = user.get("score_max")
                print(f"User: {name} | Score: {score} | Max: {target}")

            # 4. lihat persentase
            total_users = len(users)
            total_achievers = len(achievers)
            print(f"Persentase: {total_achievers / total_users * 100:.2f}%")
        else:
            print("Tidak ada user yang memenuhi kriteria.")

    except requests.exceptions.RequestException as e:
        print(f"Terjadi kesalahan saat mengambil data: {e}")


if __name__ == "__main__":
    get_top_users()
    
    # masukkan ke sheet
