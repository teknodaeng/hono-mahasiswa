import { serve } from '@hono/node-server'
import { Hono, Context } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@libsql/client/web'
import 'dotenv/config'

// ─── Tipe Bindings Cloudflare Workers ───────────────
type Bindings = {
  TURSO_DATABASE_URL?: string
  TURSO_AUTH_TOKEN?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// ─── Helper Koneksi Database ────────────────────────
// Membaca dari c.env (Cloudflare) atau fallback ke process.env (Lokal Node.js)
const getDb = (c: Context<{ Bindings: Bindings }>) => {
  const url =
    c.env?.TURSO_DATABASE_URL ||
    (typeof process !== 'undefined' ? process.env?.TURSO_DATABASE_URL : '') ||
    ''
  const authToken =
    c.env?.TURSO_AUTH_TOKEN ||
    (typeof process !== 'undefined' ? process.env?.TURSO_AUTH_TOKEN : '') ||
    ''

  if (!url) {
    throw new Error('TURSO_DATABASE_URL belum disetel di Cloudflare Workers (lihat wrangler.jsonc atau wrangler secret)')
  }
  if (!authToken) {
    throw new Error('TURSO_AUTH_TOKEN belum disetel di Cloudflare Workers (gunakan: npx wrangler secret put TURSO_AUTH_TOKEN)')
  }

  return createClient({ url, authToken })
}

// ─── Middleware CORS ────────────────────────────────
app.use('*', cors({
  origin: '*', // Mengizinkan akses dari domain lokal maupun domain Tencent EdgeOne
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// ─── Health Check ───────────────────────────────────
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: '🚀 API Mahasiswa Hono + Turso',
    endpoints: {
      health: 'GET /health',
      getAllMahasiswa: 'GET /mahasiswa',
      getMahasiswaById: 'GET /mahasiswa/:id',
      createMahasiswa: 'POST /mahasiswa',
      updateMahasiswa: 'PUT /mahasiswa/:id',
      deleteMahasiswa: 'DELETE /mahasiswa/:id',
    },
  })
})

app.get('/health', async (c) => {
  try {
    const db = getDb(c)
    const startTime = Date.now()
    await db.execute('SELECT 1')
    const latency = Date.now() - startTime

    return c.json({
      status: 'ok',
      message: 'Server & Database Turso terhubung dengan normal',
      database: 'connected',
      latency: `${latency}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return c.json(
      {
        status: 'error',
        message: 'Koneksi database bermasalah',
        database: 'disconnected',
        error: error?.message || 'Database connection error',
        timestamp: new Date().toISOString(),
      },
      503
    )
  }
})

// ─── CREATE ─────────────────────────────────────────
app.post('/mahasiswa', async (c) => {
  try {
    const db = getDb(c)
    const body = await c.req.json().catch(() => ({}))
    const rawStudentId = body.Student_ID_Number ?? body.student_id_number ?? body.nim
    const name = (body.name ?? body.nama)?.toString().trim()
    const department = (body.department ?? body.jurusan)?.toString().trim()
    const status = body.status !== undefined ? Number(body.status) : 1

    if (!name || !department) {
      return c.json({ error: 'Nama (name) dan Jurusan (department) wajib diisi' }, 400)
    }

    const studentId = rawStudentId !== undefined && rawStudentId !== '' ? Number(rawStudentId) : null

    const result = await db.execute({
      sql: 'INSERT INTO mahasiswa (Student_ID_Number, name, department, status) VALUES (?, ?, ?, ?)',
      args: [studentId, name, department, status],
    })

    const newId = Number(result.lastInsertRowid)

    return c.json(
      {
        message: 'Berhasil ditambahkan',
        data: {
          id: newId,
          Student_ID_Number: studentId,
          nim: studentId !== null ? String(studentId) : '',
          name,
          nama: name,
          department,
          jurusan: department,
          status,
        },
      },
      201
    )
  } catch (error: any) {
    return c.json({ error: error?.message || 'Gagal menambah data' }, 500)
  }
})

// ─── READ ALL ───────────────────────────────────────
app.get('/mahasiswa', async (c) => {
  try {
    const db = getDb(c)
    const result = await db.execute(`
      SELECT 
        id, 
        Student_ID_Number,
        Student_ID_Number AS nim,
        name, 
        department, 
        name AS nama, 
        department AS jurusan, 
        status 
      FROM mahasiswa 
      ORDER BY id DESC
    `)
    return c.json(result.rows)
  } catch (error: any) {
    return c.json({ error: error?.message || 'Gagal mengambil data' }, 500)
  }
})

// ─── READ BY ID ─────────────────────────────────────
app.get('/mahasiswa/:id', async (c) => {
  try {
    const id = c.req.param('id')
    if (!id) {
      return c.json({ error: 'ID tidak valid' }, 400)
    }

    const db = getDb(c)
    const result = await db.execute({
      sql: `
        SELECT 
          id, 
          Student_ID_Number,
          Student_ID_Number AS nim,
          name, 
          department, 
          name AS nama, 
          department AS jurusan, 
          status 
        FROM mahasiswa 
        WHERE id = ?
      `,
      args: [id],
    })
    if (result.rows.length === 0) {
      return c.json({ error: 'Data mahasiswa tidak ditemukan' }, 404)
    }
    return c.json(result.rows[0])
  } catch (error: any) {
    return c.json({ error: error?.message || 'Gagal mengambil data' }, 500)
  }
})

// ─── UPDATE ─────────────────────────────────────────
const handleUpdate = async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const id = c.req.param('id')
    if (!id) {
      return c.json({ error: 'ID tidak valid' }, 400)
    }

    const db = getDb(c)

    // Periksa apakah data mahasiswa dengan ID tersebut ada
    const check = await db.execute({
      sql: 'SELECT * FROM mahasiswa WHERE id = ?',
      args: [id],
    })

    if (check.rows.length === 0) {
      return c.json({ error: 'Data mahasiswa tidak ditemukan' }, 404)
    }

    const current: any = check.rows[0]
    const body = await c.req.json().catch(() => ({}))

    const rawStudentId = body.Student_ID_Number ?? body.student_id_number ?? body.nim ?? current.Student_ID_Number
    const studentId = rawStudentId !== undefined && rawStudentId !== '' && rawStudentId !== null ? Number(rawStudentId) : null
    const name = (body.name ?? body.nama)?.toString().trim() ?? current.name
    const department = (body.department ?? body.jurusan)?.toString().trim() ?? current.department
    const status = body.status !== undefined ? Number(body.status) : current.status

    if (!name || !department) {
      return c.json({ error: 'Nama (name) dan Jurusan (department) tidak boleh kosong' }, 400)
    }

    await db.execute({
      sql: 'UPDATE mahasiswa SET Student_ID_Number = ?, name = ?, department = ?, status = ? WHERE id = ?',
      args: [studentId, name, department, status, id],
    })

    return c.json({
      message: 'Berhasil diupdate',
      data: {
        id: Number(id),
        Student_ID_Number: studentId,
        nim: studentId !== null ? String(studentId) : '',
        name,
        nama: name,
        department,
        jurusan: department,
        status,
      },
    })
  } catch (error: any) {
    return c.json({ error: error?.message || 'Gagal mengupdate data' }, 500)
  }
}

app.put('/mahasiswa/:id', handleUpdate)
app.patch('/mahasiswa/:id', handleUpdate)

// ─── DELETE ─────────────────────────────────────────
app.delete('/mahasiswa/:id', async (c) => {
  try {
    const id = c.req.param('id')
    if (!id) {
      return c.json({ error: 'ID tidak valid' }, 400)
    }

    const db = getDb(c)
    const result = await db.execute({
      sql: 'DELETE FROM mahasiswa WHERE id = ?',
      args: [id],
    })

    if (result.rowsAffected === 0) {
      return c.json({ error: 'Data mahasiswa tidak ditemukan' }, 404)
    }

    return c.json({ message: 'Berhasil dihapus', id: Number(id) })
  } catch (error: any) {
    return c.json({ error: error?.message || 'Gagal menghapus data' }, 500)
  }
})

// ─── Export Default untuk Cloudflare Workers ────────
export default app

// ─── Start Server untuk Lokal Node.js ───────────────
const isCloudflare = typeof navigator !== 'undefined' && navigator.userAgent?.includes('Cloudflare')

if (!isCloudflare && typeof process !== 'undefined' && process.env?.PORT) {
  const port = Number(process.env.PORT) || 3000
  console.log(`🟢 Backend running at http://localhost:${port}`)
  serve({ fetch: app.fetch, port })
}