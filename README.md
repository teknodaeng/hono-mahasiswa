# 🎓 CRUD Data Mahasiswa

Aplikasi web fullstack modern untuk manajemen data mahasiswa yang dibangun dengan arsitektur **Monorepo** menggunakan **Hono**, **Turso Database**, **React 19**, dan **Tailwind CSS v4**.

Backend dirancang siap dideploy ke **Cloudflare Workers**, dan frontend siap dideploy ke **Tencent Cloud EdgeOne Pages**.

---

## 🚀 Teknologi yang Digunakan

### Backend
- **Framework**: [Hono](https://hono.dev/) v4 (Edge-first Web Framework)
- **Database**: [Turso Cloud](https://turso.tech/) (Distributed SQLite at the Edge via `@libsql/client/web`)
- **Runtime**: Node.js (Dev lokal via `@hono/node-server`) & Cloudflare Workers (Production)
- **Language**: TypeScript

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Language**: TypeScript
- **Hosting**: Tencent Cloud EdgeOne Pages

---

## 📁 Struktur Direktori

```text
hono-mahasiswa/
├── backend/
│   ├── src/
│   │   └── index.ts          # Server Hono & Endpoint CRUD Mahasiswa
│   ├── .dev.vars             # Environtment variables untuk Wrangler dev lokal
│   ├── .env                  # Environment variables lokal (Node.js)
│   ├── package.json
│   ├── tsconfig.json
│   └── wrangler.jsonc        # Konfigurasi deployment Cloudflare Workers
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Komponen UI utama (Tabel & Form Mahasiswa)
│   │   ├── index.css         # Import Tailwind CSS v4 & konfigurasi tema
│   │   └── main.tsx
│   ├── .env                  # URL API backend untuk dev lokal
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts        # Konfigurasi Vite & Tailwind v4 plugin
├── .gitignore                # Gitignore root monorepo
├── README.md                 # Dokumentasi proyek
└── start.sh                  # Script bash untuk menjalankan backend & frontend sekaligus
```

---

## 🗄️ Skema Database (Turso)

Tabel `mahasiswa` pada database Turso Cloud:

```sql
CREATE TABLE `mahasiswa` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `Student_ID_Number` BIGINT,                  -- NIM Mahasiswa
    `name` TEXT(255),                            -- Nama Mahasiswa
    `department` TEXT(255),                      -- Jurusan / Program Studi
    `status` INTEGER DEFAULT 1 CHECK (status IN (0, 1)) -- Status Aktif (1) / Nonaktif (0)
);
```

---

## ⚡ Memulai di Lingkungan Lokal (Quick Start)

### 1. Clone Repository
```bash
git clone https://github.com/username/hono-mahasiswa.git
cd hono-mahasiswa
```

### 2. Konfigurasi Environment Variables

**Backend (`backend/.env`):**
```env
TURSO_DATABASE_URL=libsql://nama-database-anda.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token_here
PORT=3000
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:3000
```

### 3. Install Dependensi
```bash
# Install dependensi backend
cd backend && npm install

# Install dependensi frontend
cd ../frontend && npm install
cd ..
```

### 4. Jalankan Sekaligus dengan `start.sh`
Jalankan script launcher untuk menyalakan backend dan frontend secara bersamaan:

```bash
./start.sh
```

Aplikasi dapat diakses di:
- **Frontend UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000](http://localhost:3000)

*(Tekan `Ctrl + C` untuk menghentikan kedua server secara bersih)*.

---

## 📡 Dokumentasi Endpoint REST API

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/` | Informasi API dan daftar endpoint |
| `GET` | `/health` | Health check server & tes koneksi Turso live |
| `GET` | `/mahasiswa` | Mendapatkan semua data mahasiswa |
| `GET` | `/mahasiswa/:id` | Mendapatkan detail mahasiswa berdasarkan ID |
| `POST` | `/mahasiswa` | Menambahkan data mahasiswa baru |
| `PUT / PATCH` | `/mahasiswa/:id` | Memperbarui data mahasiswa |
| `DELETE` | `/mahasiswa/:id` | Menghapus data mahasiswa |

### Contoh Request & Response

#### 1. Health Check (`GET /health`)
```bash
curl http://localhost:3000/health
```
```json
{
  "status": "ok",
  "message": "Server & Database Turso terhubung dengan normal",
  "database": "connected",
  "latency": "145ms",
  "timestamp": "2026-09-03T04:00:00.000Z"
}
```

#### 2. Tambah Mahasiswa (`POST /mahasiswa`)
Mendukung input field berbahasa Inggris maupun Indonesia:
```bash
curl -X POST http://localhost:3000/mahasiswa \
  -H "Content-Type: application/json" \
  -d '{
    "nim": "1304013",
    "nama": "Andi Aliefrahman",
    "jurusan": "Sistem Komputer"
  }'
```
```json
{
  "message": "Berhasil ditambahkan",
  "data": {
    "id": 1,
    "Student_ID_Number": 1304013,
    "nim": "1304013",
    "name": "Andi Aliefrahman",
    "nama": "Andi Aliefrahman",
    "department": "Sistem Komputer",
    "jurusan": "Sistem Komputer",
    "status": 1
  }
}
```

#### 3. Ambil Semua Data (`GET /mahasiswa`)
```bash
curl http://localhost:3000/mahasiswa
```

---

## ☁️ Panduan Deployment

### 1. Backend ke Cloudflare Workers

1. Masuk ke direktori `backend`:
   ```bash
   cd backend
   ```
2. Simpan secret token Turso ke Cloudflare:
   ```bash
   npx wrangler secret put TURSO_AUTH_TOKEN
   ```
   *(Paste token Turso Anda saat diminta)*
3. Deploy ke Cloudflare:
   ```bash
   npm run deploy
   ```
   URL publik akan ditampilkan (contoh: `https://backend-mahasiswa.workers.dev`).

---

### 2. Frontend ke Tencent Cloud EdgeOne Pages

1. Masuk ke console [Tencent Cloud EdgeOne Pages](https://console.cloud.tencent.com/edgeone/pages) atau [EdgeOne.ai](https://edgeone.ai).
2. Buat proyek baru dan hubungkan ke repository Git Anda.
3. Konfigurasi build:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Tambahkan Environment Variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://backend-mahasiswa.<subdomain>.workers.dev` (URL Cloudflare Workers Anda)
5. Klik **Save and Deploy**.

---

## 📄 Lisensi
Proyek ini dibuat untuk keperluan pembelajaran dan pengembangan aplikasi web modern. Bebas digunakan dan dimodifikasi (MIT License).
