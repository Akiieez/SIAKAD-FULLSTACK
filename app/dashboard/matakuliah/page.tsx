'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type MataKuliah = {
  id: string
  kode_mk: string
  nama_mk: string
  sks: number
  semester: number
  program_studi: {
    nama: string
    fakultas: {
      nama: string
    }
  }
}

export default function MataKuliahPage() {
  const [listMK, setListMK] = useState<MataKuliah[]>([])
  const [selectedFakultas, setSelectedFakultas] = useState<string>('ALL')
  const [selectedProdi, setSelectedProdi] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('mata_kuliah')
        .select(`
          id,
          kode_mk,
          nama_mk,
          sks,
          semester,
          program_studi:program_studi_id (
            nama,
            fakultas:fakultas_id ( nama )
          )
        `)
        .order('kode_mk', { ascending: true })

      if (data) setListMK(data as unknown as MataKuliah[])
      setLoading(false)
    }
    fetchData()
  }, [])

  // Filter Unik
  const listFakultas = Array.from(
    new Set(listMK.map((m) => m.program_studi?.fakultas?.nama).filter(Boolean))
  )

  const filteredByFakultas = selectedFakultas === 'ALL'
    ? listMK
    : listMK.filter((m) => m.program_studi?.fakultas?.nama === selectedFakultas)

  const listProdi = Array.from(
    new Set(filteredByFakultas.map((m) => m.program_studi?.nama).filter(Boolean))
  )

  const filteredList = filteredByFakultas.filter((m) => {
    if (selectedProdi !== 'ALL' && m.program_studi?.nama !== selectedProdi) return false
    return true
  })

  // Kelompokkan berdasar Fakultas & Prodi
  const groupedByProdi = filteredList.reduce<Record<string, MataKuliah[]>>((acc, mk) => {
    const fakNama = mk.program_studi?.fakultas?.nama || 'Lainnya'
    const prdNama = mk.program_studi?.nama || 'Umum'
    const key = `${fakNama} - ${prdNama}`
    if (!acc[key]) acc[key] = []
    acc[key].push(mk)
    return acc
  }, {})

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📚 Master Mata Kuliah</h1>
          <p className="text-gray-500 text-sm">Kelola kurikulum, SKS, dan semester mata kuliah per prodi</p>
        </div>
        <Link 
          href="/dashboard/matakuliah/tambah"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition"
        >
          + Tambah Mata Kuliah
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Filter Fakultas</label>
          <select
            value={selectedFakultas}
            onChange={(e) => {
              setSelectedFakultas(e.target.value)
              setSelectedProdi('ALL')
            }}
            className="px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">🏛️ Semua Fakultas</option>
            {listFakultas.map((fak) => (
              <option key={fak} value={fak}>{fak}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Filter Program Studi</label>
          <select
            value={selectedProdi}
            onChange={(e) => setSelectedProdi(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">📚 Semua Program Studi</option>
            {listProdi.map((prd) => (
              <option key={prd} value={prd}>{prd}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-500 self-end pb-2">
          Total Mata Kuliah: <span className="font-bold text-blue-600">{filteredList.length}</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Memuat data mata kuliah...</div>
      ) : Object.keys(groupedByProdi).length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-gray-400">
          Tidak ada data mata kuliah ditemukan.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByProdi).map(([groupTitle, mkGroup]) => (
            <div key={groupTitle} className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b px-6 py-3 flex justify-between items-center">
                <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <span>🏛️</span> {groupTitle}
                </h2>
                <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">
                  {mkGroup.length} Mata Kuliah
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs border-b">
                    <tr>
                      <th className="px-6 py-3">Kode MK</th>
                      <th className="px-6 py-3">Nama Mata Kuliah</th>
                      <th className="px-6 py-3">Semester</th>
                      <th className="px-6 py-3">Beban SKS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mkGroup.map((mk) => (
                      <tr key={mk.id} className="hover:bg-gray-50/80 transition">
                        <td className="px-6 py-3 font-mono font-bold text-blue-600">{mk.kode_mk}</td>
                        <td className="px-6 py-3 font-medium text-gray-800">{mk.nama_mk}</td>
                        <td className="px-6 py-3">Semester {mk.semester}</td>
                        <td className="px-6 py-3">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold text-xs rounded-md">
                            {mk.sks} SKS
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}