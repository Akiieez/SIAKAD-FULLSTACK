'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function DashboardMahasiswaPage() {
  const [listMahasiswa, setListMahasiswa] = useState<any[]>([])
  const [singleMahasiswa, setSingleMahasiswa] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedFakultas, setSelectedFakultas] = useState('')
  const [selectedProdi, setSelectedProdi] = useState('')
  const [loading, setLoading] = useState(true)

  // State Modal Edit Biodata Mandiri (Role Mahasiswa)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    no_hp: '',
    nik: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    agama: '',
    alamat: '',
  })

  // State Modal Admin (Edit & Delete)
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const supabase = createClient()

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const adminRole = profile?.role === 'admin'
    setIsAdmin(adminRole)

    if (adminRole) {
      const { data } = await supabase.from('mahasiswa').select('*')
      setListMahasiswa(data || [])
    } else {
      const querySelect = `
        *,
        fakultas_rel:fakultas_id ( nama ),
        prodi_rel:program_studi_id ( nama ),
        dosen_wali:dosen_wali_id ( nama_lengkap, gelar )
      `

      let { data, error } = await supabase
        .from('mahasiswa')
        .select(querySelect)
        .or(`user_id.eq.${user.id},profile_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle()

      if (error || !data) {
        const fallback = await supabase
          .from('mahasiswa')
          .select(querySelect)
          .or(`user_id.eq.${user.id},profile_id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle()
        data = fallback.data
      }

      if (data) {
        setSingleMahasiswa(data)
        setFormData({
          email: data.email || user.email || '',
          no_hp: data.no_hp || '',
          nik: data.nik || '',
          tempat_lahir: data.tempat_lahir || '',
          tanggal_lahir: data.tanggal_lahir || '',
          jenis_kelamin: data.jenis_kelamin || 'L',
          agama: data.agama || 'Islam',
          alamat: data.alamat || '',
        })
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Helper Relasi & Fallback Nama
  const getFakultas = (item: any) => item?.fakultas_rel?.nama || item?.fakultas || '-'
  const getProdi = (item: any) => item?.prodi_rel?.nama || item?.program_studi || '-'
  const getDosenWali = (item: any) => {
    if (!item?.dosen_wali) return '-'
    const dw = item.dosen_wali
    return `${dw.nama_lengkap}${dw.gelar ? `, ${dw.gelar}` : ''}`
  }

  // Admin Filters Memo
  const listFakultasOptions = useMemo(() => {
    const setFak = new Set<string>()
    listMahasiswa.forEach((mhs) => {
      const fak = getFakultas(mhs)
      if (fak && fak !== '-') setFak.add(fak)
    })
    return Array.from(setFak)
  }, [listMahasiswa])

  const listProdiOptions = useMemo(() => {
    const setProd = new Set<string>()
    listMahasiswa.forEach((mhs) => {
      const fak = getFakultas(mhs)
      const prd = getProdi(mhs)
      if (prd && prd !== '-') {
        if (!selectedFakultas || fak === selectedFakultas) {
          setProd.add(prd)
        }
      }
    })
    return Array.from(setProd)
  }, [listMahasiswa, selectedFakultas])

  const filteredData = useMemo(() => {
    return listMahasiswa.filter((mhs) => {
      const q = search.toLowerCase()
      const nama = (mhs.nama_lengkap || '').toLowerCase()
      const nim = (mhs.nim || '').toLowerCase()
      const fak = getFakultas(mhs)
      const prd = getProdi(mhs)

      const matchSearch = nama.includes(q) || nim.includes(q)
      const matchFakultas = selectedFakultas ? fak === selectedFakultas : true
      const matchProdi = selectedProdi ? prd === selectedProdi : true

      return matchSearch && matchFakultas && matchProdi
    })
  }, [listMahasiswa, search, selectedFakultas, selectedProdi])

  // Handler Delete (Admin)
  const handleDelete = async () => {
    if (!deleteId) return
    setActionLoading(true)
    const { error } = await supabase.from('mahasiswa').delete().eq('id', deleteId)
    if (error) {
      alert('Gagal menghapus data: ' + error.message)
    } else {
      setDeleteId(null)
      loadData()
    }
    setActionLoading(false)
  }

  // Handler Update (Admin)
  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return
    setActionLoading(true)
    const { error } = await supabase
      .from('mahasiswa')
      .update({
        nim: editItem.nim,
        nama_lengkap: editItem.nama_lengkap,
        fakultas: editItem.fakultas,
        program_studi: editItem.program_studi,
        email: editItem.email,
      })
      .eq('id', editItem.id)

    if (error) {
      alert('Gagal memperbarui data: ' + error.message)
    } else {
      setEditItem(null)
      loadData()
    }
    setActionLoading(false)
  }

  // Handler Update Biodata Mandiri (Mahasiswa)
  const handleUpdateMahasiswa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!singleMahasiswa?.id) return
    setSaving(true)

    const { error } = await supabase
      .from('mahasiswa')
      .update({
        email: formData.email,
        no_hp: formData.no_hp,
        nik: formData.nik,
        tempat_lahir: formData.tempat_lahir,
        tanggal_lahir: formData.tanggal_lahir || null,
        jenis_kelamin: formData.jenis_kelamin,
        agama: formData.agama,
        alamat: formData.alamat,
      })
      .eq('id', singleMahasiswa.id)

    if (error) {
      alert('Gagal memperbarui biodata: ' + error.message)
    } else {
      alert('Biodata berhasil diperbarui!')
      setIsEditModalOpen(false)
      loadData()
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 font-sans text-gray-500">Memuat data...</div>

  // ==================== MODE ADMIN ====================
  if (isAdmin) {
    return (
      <div className="p-8 max-w-6xl mx-auto font-sans space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎓 Data Seluruh Mahasiswa (Mode Admin)</h1>
          <Link
            href="/dashboard/mahasiswa/tambah"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm text-sm"
          >
            <span>➕</span>
            <span>Tambah Mahasiswa</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pencarian Keyword</label>
            <input
              type="text"
              placeholder="🔍 Cari NIM atau Nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Fakultas</label>
            <select
              value={selectedFakultas}
              onChange={(e) => {
                setSelectedFakultas(e.target.value)
                setSelectedProdi('')
              }}
              className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Semua Fakultas --</option>
              {listFakultasOptions.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Program Studi</label>
            <select
              value={selectedProdi}
              onChange={(e) => setSelectedProdi(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Semua Program Studi --</option>
              {listProdiOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3">NIM</th>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">Fakultas</th>
                <th className="p-3">Program Studi</th>
                <th className="p-3">Email</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((mhs) => (
                  <tr key={mhs.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono font-medium">{mhs.nim || '-'}</td>
                    <td className="p-3">{mhs.nama_lengkap || '-'}</td>
                    <td className="p-3">{getFakultas(mhs)}</td>
                    <td className="p-3">{getProdi(mhs)}</td>
                    <td className="p-3 text-gray-600">{mhs.email || '-'}</td>
                    <td className="p-3 text-center space-x-2">
                      <button
                        onClick={() => setEditItem(mhs)}
                        className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(mhs.id)}
                        className="px-3 py-1 bg-rose-600 text-white rounded hover:bg-rose-700 text-sm"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    Data mahasiswa tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Edit (Admin) */}
        {editItem && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4 shadow-lg">
              <h2 className="text-xl font-bold">Edit Data Mahasiswa</h2>
              <form onSubmit={handleUpdateAdmin} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">NIM</label>
                  <input
                    type="text"
                    value={editItem.nim || ''}
                    onChange={(e) => setEditItem({ ...editItem, nim: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editItem.nama_lengkap || ''}
                    onChange={(e) => setEditItem({ ...editItem, nama_lengkap: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Fakultas</label>
                  <input
                    type="text"
                    value={editItem.fakultas || ''}
                    onChange={(e) => setEditItem({ ...editItem, fakultas: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Program Studi</label>
                  <input
                    type="text"
                    value={editItem.program_studi || ''}
                    onChange={(e) => setEditItem({ ...editItem, program_studi: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Email</label>
                  <input
                    type="email"
                    value={editItem.email || ''}
                    onChange={(e) => setEditItem({ ...editItem, email: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditItem(null)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {actionLoading ? 'Saving...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Delete (Admin) */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-sm space-y-4 shadow-lg text-center">
              <h2 className="text-lg font-bold">Hapus Data Mahasiswa?</h2>
              <p className="text-sm text-gray-600">Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex justify-center space-x-2 pt-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700"
                >
                  {actionLoading ? 'Deleting...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==================== MODE MAHASISWA ====================
  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🎓 Profil Mahasiswa
        </h1>
        {singleMahasiswa && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span>✏️</span>
            <span>Edit Biodata</span>
          </button>
        )}
      </div>

      {singleMahasiswa ? (
        <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm space-y-3 text-gray-800">
          <p className="text-base">
            <strong className="w-36 inline-block text-gray-700">Nama:</strong> {singleMahasiswa.nama_lengkap || '-'}
          </p>
          <p className="text-base">
            <strong className="w-36 inline-block text-gray-700">NIM:</strong> {singleMahasiswa.nim || '-'}
          </p>
          <p className="text-base">
            <strong className="w-36 inline-block text-gray-700">Fakultas:</strong> {getFakultas(singleMahasiswa)}
          </p>
          <p className="text-base">
            <strong className="w-36 inline-block text-gray-700">Program Studi:</strong> {getProdi(singleMahasiswa)}
          </p>

          {/* Informasi Tambahan (Jika Ada) */}
          {singleMahasiswa.dosen_wali && (
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">Dosen Wali:</strong> {getDosenWali(singleMahasiswa)}
            </p>
          )}
          {singleMahasiswa.no_hp && (
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">No. HP / WA:</strong> {singleMahasiswa.no_hp}
            </p>
          )}

          <p className="text-base">
            <strong className="w-36 inline-block text-gray-700">Email:</strong> {singleMahasiswa.email || '-'}
          </p>

          {singleMahasiswa.alamat && (
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">Alamat:</strong> {singleMahasiswa.alamat}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200">
          Data mahasiswa belum terhubung.
        </div>
      )}

      {/* MODAL POP-UP EDIT BIODATA MANDIRI (MAHASISWA) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-800">✏️ Edit Biodata Mandiri Mahasiswa</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateMahasiswa} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Email Utama</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={formData.no_hp}
                    onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">NIK / No. KTP</label>
                  <input
                    type="text"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Jenis Kelamin</label>
                  <select
                    value={formData.jenis_kelamin}
                    onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                  >
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formData.tempat_lahir}
                    onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.tanggal_lahir}
                    onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Alamat Domisili Lengkap</label>
                <textarea
                  rows={3}
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Jl. Raya Kemerdekaan No. 123..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}