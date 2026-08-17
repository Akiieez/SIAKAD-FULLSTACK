'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function DashboardDosenPage() {
  const [listDosen, setListDosen] = useState<any[]>([])
  const [singleDosen, setSingleDosen] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedFakultas, setSelectedFakultas] = useState('')
  const [selectedProdi, setSelectedProdi] = useState('')
  const [loading, setLoading] = useState(true)

  // State Modal Edit & Delete
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

    const querySelect = `
      *,
      fakultas:fakultas_id ( nama ),
      prodi:program_studi_id ( nama )
    `

    if (adminRole) {
      let { data, error } = await supabase.from('dosen').select(querySelect)
      if (error) {
        const res = await supabase.from('dosen').select('*')
        data = res.data
      }
      setListDosen(data || [])
    } else {
      let { data, error } = await supabase
        .from('dosen')
        .select(querySelect)
        .or(`user_id.eq.${user.id},profile_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle()

      if (error || !data) {
        const res = await supabase
          .from('dosen')
          .select('*')
          .or(`user_id.eq.${user.id},profile_id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle()
        data = res.data
      }
      setSingleDosen(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const getFakultas = (item: any) => item?.fakultas?.nama || item?.fakultas || '-'
  const getProdi = (item: any) => item?.prodi?.nama || item?.program_studi || '-'

  const listFakultasOptions = useMemo(() => {
    const setFak = new Set<string>()
    listDosen.forEach((dsn) => {
      const fak = getFakultas(dsn)
      if (fak && fak !== '-') setFak.add(fak)
    })
    return Array.from(setFak)
  }, [listDosen])

  const listProdiOptions = useMemo(() => {
    const setProd = new Set<string>()
    listDosen.forEach((dsn) => {
      const fak = getFakultas(dsn)
      const prd = getProdi(dsn)
      if (prd && prd !== '-') {
        if (!selectedFakultas || fak === selectedFakultas) {
          setProd.add(prd)
        }
      }
    })
    return Array.from(setProd)
  }, [listDosen, selectedFakultas])

  const filteredData = useMemo(() => {
    return listDosen.filter((dsn) => {
      const q = search.toLowerCase()
      const nama = (dsn.nama_lengkap || '').toLowerCase()
      const nidn = (dsn.nidn || dsn.nip || '').toLowerCase()
      const fak = getFakultas(dsn)
      const prd = getProdi(dsn)

      const matchSearch = nama.includes(q) || nidn.includes(q)
      const matchFakultas = selectedFakultas ? fak === selectedFakultas : true
      const matchProdi = selectedProdi ? prd === selectedProdi : true

      return matchSearch && matchFakultas && matchProdi
    })
  }, [listDosen, search, selectedFakultas, selectedProdi])

  // Delete Handler
  const handleDelete = async () => {
    if (!deleteId) return
    setActionLoading(true)
    const { error } = await supabase.from('dosen').delete().eq('id', deleteId)
    if (error) {
      alert('Gagal menghapus data: ' + error.message)
    } else {
      setDeleteId(null)
      loadData()
    }
    setActionLoading(false)
  }

  // Update Handler
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return
    setActionLoading(true)
    const { error } = await supabase
      .from('dosen')
      .update({
        nidn: editItem.nidn,
        nip: editItem.nip,
        nama_lengkap: editItem.nama_lengkap,
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

  if (loading) return <div className="p-8">Memuat data...</div>

  if (isAdmin) {
    return (
      <div className="p-8 max-w-6xl mx-auto font-sans space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">👨‍🏫 Data Seluruh Dosen (Mode Admin)</h1>
          <Link
            href="/dashboard/dosen/tambah"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm text-sm"
          >
            <span>➕</span>
            <span>Tambah Dosen</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pencarian Keyword</label>
            <input
              type="text"
              placeholder="🔍 Cari NIDN/NIP atau Nama..."
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
                <th className="p-3">NIDN / NIP</th>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">Fakultas</th>
                <th className="p-3">Program Studi</th>
                <th className="p-3">Email</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((dsn) => (
                  <tr key={dsn.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono font-medium">{dsn.nidn || dsn.nip || '-'}</td>
                    <td className="p-3">{dsn.nama_lengkap || '-'}</td>
                    <td className="p-3">{getFakultas(dsn)}</td>
                    <td className="p-3">{getProdi(dsn)}</td>
                    <td className="p-3 text-gray-600">{dsn.email || '-'}</td>
                    <td className="p-3 text-center space-x-2">
                      <button
                        onClick={() => setEditItem(dsn)}
                        className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(dsn.id)}
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
                    Data dosen tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Edit Dosen */}
        {editItem && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4 shadow-lg">
              <h2 className="text-xl font-bold">Edit Data Dosen</h2>
              <form onSubmit={handleUpdate} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">NIDN / NIP</label>
                  <input
                    type="text"
                    value={editItem.nidn || editItem.nip || ''}
                    onChange={(e) => setEditItem({ ...editItem, nidn: e.target.value })}
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

        {/* Modal Konfirmasi Delete */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-sm space-y-4 shadow-lg text-center">
              <h2 className="text-lg font-bold">Hapus Data Dosen?</h2>
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

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">👨‍🏫 Profil Dosen</h1>
      {singleDosen ? (
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-3 text-gray-800">
          <p><strong>Nama Lengkap:</strong> {singleDosen.nama_lengkap || '-'}</p>
          <p><strong>NIDN / NIP:</strong> {singleDosen.nidn || singleDosen.nip || '-'}</p>
          <p><strong>Fakultas:</strong> {getFakultas(singleDosen)}</p>
          <p><strong>Program Studi:</strong> {getProdi(singleDosen)}</p>
          <p><strong>Email:</strong> {singleDosen.email || '-'}</p>
        </div>
      ) : (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg border border-yellow-200">
          Data dosen belum terhubung.
        </div>
      )}
    </div>
  )
}