#!/bin/bash

# Dapatkan direktori absolut proyek
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

echo "=================================================="
echo "🚀 Menjalankan Server Backend dan Frontend"
echo "=================================================="

# Fungsi untuk membersihkan dan mematikan semua proses child ketika Ctrl+C ditekan
cleanup() {
  echo ""
  echo "🛑 Menghentikan semua server (Backend & Frontend)..."
  # Matikan semua job background yang dijalankan oleh script ini
  kill $(jobs -p) 2>/dev/null
  wait 2>/dev/null
  echo "✅ Semua server telah dihentikan."
  exit 0
}

# Tangkap sinyal SIGINT (Ctrl+C) dan SIGTERM
trap cleanup SIGINT SIGTERM

# 1. Jalankan Backend (Hono + Turso) di background
echo "🟢 Memulai Backend (Hono) di http://localhost:3000..."
(cd "$ROOT_DIR/backend" && npm run dev) &
BACKEND_PID=$!

# Beri jeda 1 detik agar log backend tidak tumpang tindih
sleep 1

# 2. Jalankan Frontend (React + Vite) di background
echo "🔵 Memulai Frontend (Vite + React) di http://localhost:5173..."
(cd "$ROOT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "✨ Keduanya sedang berjalan:"
echo "   👉 Backend API : http://localhost:3000"
echo "   👉 Frontend UI : http://localhost:5173"
echo ""
echo "Tekan [Ctrl + C] kapan saja untuk menghentikan kedua server."
echo "=================================================="
echo ""

# Tunggu sampai proses dihentikan
wait $BACKEND_PID $FRONTEND_PID
