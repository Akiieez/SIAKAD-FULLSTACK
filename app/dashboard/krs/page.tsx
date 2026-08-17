'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function KRSMahasiswaPage() {
  const [semester, setSemester] = useState<number>(1)
  const [listMatkul, setListMatkul] = useState<any[]>([])
  const [selectedMatkulIds, setSelectedMatkulIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function fetchMatkul() {
      setLoading(true)
      const { data } = await supabase
        .from('mata_kuliah')
        .select('*')
        .eq('semester', semester)

      setListMatkul(data || [])
      setLoading(false)
    }

    fetchMatkul()
  }, [semester])

  const toggleSelectMatkul = (id: string) => {
    if (selectedMatkulIds.includes(id)) {
      setSelectedMatkulIds(selectedMatkulIds.filter((item) => item !== id))
    } else {
      setSelectedMatkulIds([...selectedMatkulIds, id])
    }
  }

  const totalSKS = listMatkul
    .filter((mk) => selectedMatkulIds.includes(mk.id))
    .reduce((acc, curr) => acc + (curr.sks || 0), 0)

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">📝 Kartu Rencana Studi (KRS)</h1>
          <p className="text-gray-600 text-sm">Pilih mata kuliah yang ingin diambil semester ini</p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-sm font-semibold">Semester:</label>
          <select
            value={semester}
            onChange={(e) => {
              setSemester(Number(e.target.value))
              setSelectedMatkulIds([])
            }}
            className="p-2 border border-gray-300 rounded-lg bg-white shadow-sm font-medium"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex justify-between items-center text-blue-900">
        <span>Total SKS Terpilih: <strong>{totalSKS} SKS</strong></span>
        <button
          onClick={() => alert(`KRS Semester ${semester} berhasil disimpan dengan total ${totalSKS} SKS!`)}
          disabled={selectedMatkulIds.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Simpan KRS
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Memuat mata kuliah...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-center">Pilih</th>
                <th className="p-3">Kode MK</th>
                <th className="p-3">Nama Mata Kuliah</th>
                <th className="p-3 text-center">SKS</th>
              </tr>
            </thead>
            <tbody>
              {listMatkul.length > 0 ? (
                listMatkul.map((mk) => {
                  const isChecked = selectedMatkulIds.includes(mk.id)
                  return (
                    <tr key={mk.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectMatkul(mk.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </td>
                      <td className="p-3 font-mono text-sm">{mk.kode_mk || '-'}</td>
                      <td className="p-3 font-medium">{mk.nama_mk || '-'}</td>
                      <td className="p-3 text-center font-semibold">{mk.sks || 0}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    Tidak ada mata kuliah untuk semester {semester}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}