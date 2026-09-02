import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Mahasiswa {
  id: number
  Student_ID_Number?: number | null
  nim?: string | number
  name?: string
  nama: string
  department?: string
  jurusan: string
  status?: number
  created_at?: string
}

interface FormData {
  nim: string
  nama: string
  jurusan: string
}

const emptyForm: FormData = { nim: '', nama: '', jurusan: '' }

export default function App() {
  const [list, setList] = useState<Mahasiswa[]>([])
  const [form, setForm] = useState<FormData>(emptyForm)
  const [editId, setEditId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // ── Toast Notification ──
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Fetch Data Helper ──
  const fetchMahasiswa = async () => {
    const res = await fetch(`${API_URL}/mahasiswa`)
    if (!res.ok) throw new Error('Gagal memuat data')
    return (await res.json()) as Mahasiswa[]
  }

  const reloadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchMahasiswa()
      setList(data)
    } catch {
      showToast('Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    fetchMahasiswa()
      .then((data) => {
        if (!ignore) {
          setList(data)
        }
      })
      .catch(() => {
        if (!ignore) {
          showToast('Gagal memuat data', 'error')
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  // ── Handle Input ──
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // ── Submit (Create / Update) ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        nim: form.nim,
        Student_ID_Number: form.nim,
        nama: form.nama,
        name: form.nama,
        jurusan: form.jurusan,
        department: form.jurusan,
      }

      if (editId) {
        const res = await fetch(`${API_URL}/mahasiswa/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        showToast('Data berhasil diupdate! ✅')
        setEditId(null)
      } else {
        const res = await fetch(`${API_URL}/mahasiswa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Gagal')
        showToast('Mahasiswa berhasil ditambahkan! 🎉')
      }
      setForm(emptyForm)
      reloadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      showToast(message, 'error')
    }
  }

  // ── Edit ──
  const handleEdit = (m: Mahasiswa) => {
    setForm({
      nim: String(m.nim ?? m.Student_ID_Number ?? ''),
      nama: m.nama || m.name || '',
      jurusan: m.jurusan || m.department || '',
    })
    setEditId(m.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Delete ──
  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return
    try {
      await fetch(`${API_URL}/mahasiswa/${id}`, { method: 'DELETE' })
      showToast('Data berhasil dihapus! 🗑️')
      reloadData()
    } catch {
      showToast('Gagal menghapus data', 'error')
    }
  }

  // ── Cancel Edit ──
  const cancelEdit = () => {
    setForm(emptyForm)
    setEditId(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-8">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white font-medium animate-[fadeIn_0.3s_ease] ${
          toast.type === 'success' ? 'bg-success' : 'bg-danger'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Header ── */}
        <header className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800">
            Data Mahasiswa
          </h1>
          <p className="text-gray-500 mt-2">
            Hono + Turso + React + Tailwind CSS v4
          </p>
        </header>

        {/* ── Form Card ── */}
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            {editId ? '✏️ Edit Mahasiswa' : '➕ Tambah Mahasiswa Baru'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">NIM / Student ID</label>
              <input
                type="text"
                name="nim"
                placeholder="Contoh: 1304013"
                value={form.nim}
                onChange={handleChange}
                disabled={editId !== null}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:bg-gray-100 disabled:text-gray-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nama Lengkap</label>
              <input
                type="text"
                name="nama"
                placeholder="Contoh: Budi Santoso"
                value={form.nama}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Jurusan</label>
              <input
                type="text"
                name="jurusan"
                placeholder="Contoh: Informatika"
                value={form.jurusan}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                required
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className={`flex-1 text-white font-semibold py-2.5 px-4 rounded-lg transition hover:opacity-90 active:scale-95 ${
                  editId ? 'bg-warning hover:bg-warning-hover' : 'bg-primary hover:bg-primary-hover'
                }`}
              >
                {editId ? '💾 Update' : '➕ Tambah'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-400 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-500 transition active:scale-95"
                >
                  ✕
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              📋 Daftar Mahasiswa
            </h2>
            <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              {list.length} data
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-lg">Belum ada data mahasiswa.</p>
              <p className="text-sm">Silakan tambahkan melalui form di atas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">No</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">NIM</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Jurusan</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((m, i) => (
                    <tr
                      key={m.id}
                      className={`border-b border-gray-100 hover:bg-blue-50/50 transition ${
                        editId === m.id ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                      <td className="py-3 px-4 font-mono text-sm text-gray-700">{m.nim ?? m.Student_ID_Number ?? '-'}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">{m.nama || m.name}</td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                          {m.jurusan || m.department}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(m)}
                            className="bg-warning text-white text-sm px-3 py-1.5 rounded-lg hover:bg-warning-hover transition active:scale-95"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="bg-danger text-white text-sm px-3 py-1.5 rounded-lg hover:bg-danger-hover transition active:scale-95"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="text-center text-sm text-gray-400 pb-4">
          Built with ❤️ using Hono · Turso · React · Tailwind CSS v4
        </footer>
      </div>
    </div>
  )
}